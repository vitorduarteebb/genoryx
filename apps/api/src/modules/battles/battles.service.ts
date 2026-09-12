import { Injectable } from "@nestjs/common";
import {
  activeEconomy,
  alphaConfig,
  battlePresentationConfig,
  breedingConfig,
  captureConfig,
  combatMatrixConfig,
  combatV15Flags,
  matchRulesFor,
  economyConfig,
  genomeCatalystKey,
  resolveCanonicalCardArt,
} from "@nexora/config";
import type { BattleState, DraftCreature } from "@nexora/game-engine";
import {
  applyCreatureXp,
  clampRewardToBudget,
  createBattleState,
  createDraftState,
  createSeededRandom,
  draftCreatureSummary,
  evaluateTimeout,
  familyFromKey,
  formationSlotFromIndex,
  generateCreatureBlueprint,
  livingCreatures,
  pickAiAction,
  pvpGoldReward,
  reduceBattle,
  reduceDraft,
  resolveMatchRules,
  rollCapture,
  rollPveCatalyst,
  rollPveGold,
  rollWildEncounter,
  seedFromParts,
} from "@nexora/game-engine";
import { persistCreature, presentCreature, toBlueprint, type CreatureRecord } from "../../common/creature-io";
import { presentBattle } from "./present-battle";
import { Errors } from "../../common/errors/app-error";
import { dailyGoldRewardRemaining } from "../../common/economy-budget";
import { consumeItem, countItem, grantItem } from "../../common/inventory";
import { creditOnce } from "../../common/ledger";
import { BattleVisualsService } from "../battle-visuals/battle-visuals.service";
import { CardArtService } from "../card-art/card-art.service";
import { CreaturesService } from "../creatures/creatures.service";
import { MaturationService } from "../creatures/maturation.service";
import { CreatureVisualsService } from "../creature-visuals/creature-visuals.service";
import { PrismaService } from "../../prisma/prisma.service";

const creatureInclude = { species: true, mutation: true, loci: true, visualAssets: true, modelAssets: true } as const;

@Injectable()
export class BattlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly creatures: CreaturesService,
    private readonly visuals: CreatureVisualsService,
    private readonly cardArt: CardArtService,
    private readonly battleVisuals: BattleVisualsService,
    private readonly maturation: MaturationService,
  ) {}

  async startWild(userId: string, offerId?: string) {
    const character = await this.requireReady(userId);
    const pvp = await this.activePvp(character.id);
    if (pvp?.stateJson) {
      const pvpState = await this.resolveAbandonedPvp(character.id, userId, pvp);
      if (pvpState.status === "ACTIVE") {
        throw Errors.battleInvalid("Termine o PvP da arena primeiro.");
      }
    }
    if (character.mapKey !== "verdantis" && !offerId) {
      throw Errors.battleInvalid("Encontros selvagens só em Verdantis.");
    }

    const party = await this.loadParty(character.id);
    const encounter = offerId
      ? await this.consumeOffer(character.id, offerId)
      : await this.rollAdHoc(character.id);

    const family = familyFromKey("family" in encounter ? String(encounter.family) : "COMMON");
    const spawnKey = "spawnKey" in encounter ? (encounter.spawnKey as string | null) : null;
    const wildBlueprint = generateCreatureBlueprint({
      seed: encounter.seed,
      speciesKey: encounter.speciesKey,
      origin: "WILD",
      level: encounter.level,
    });
    const bases = await this.basesFor(encounter.speciesKey);
    const playerBases = await Promise.all(
      party.map(async (row) => ({ row, bases: await this.basesFor(row.species.key), slot: row.partySlot })),
    );

    const battleId = crypto.randomUUID();
    let state = createBattleState({
      id: battleId,
      seed: encounter.seed,
      type: "PVE",
      matchMode: "PVE",
      mapKey: "verdantis",
      rulesVersion: combatMatrixConfig.fusionV2 || combatMatrixConfig.formationLinearV2 ? "V2" : "V1",
      wildSpeciesKey: encounter.speciesKey,
      sideA: {
        id: "player",
        characterId: character.id,
        displayName: character.name,
        creatures: playerBases.map(({ row, bases: b, slot }) => ({
          blueprint: toBlueprint(row as CreatureRecord),
          bases: b,
          creatureId: row.id,
          slot: formationSlotFromIndex(slot, "V2"),
        })),
      },
      sideB: {
        id: "wild",
        displayName: wildBlueprint.name,
        creatures: [{ blueprint: wildBlueprint, bases, creatureId: `wild:${battleId}` }],
      },
    });

    const created = await this.prisma.client.$transaction(async (tx) => {
      await tx.creature.updateMany({
        where: { id: { in: party.map((row) => row.id) } },
        data: { lock: "BATTLE" },
      });
      return tx.battle.create({
        data: {
          id: battleId,
          type: "PVE",
          status: "ACTIVE",
          rngSeed: encounter.seed,
          mapKey: "verdantis",
          encounterFamily: family,
          mobSpecies: encounter.speciesKey,
          spawnKey,
          stateJson: state as object,
          currentRound: state.round,
          rulesVersion: state.rulesVersion,
          participants: {
            create: [
              { characterId: character.id, team: 0, isNpc: false },
              { team: 1, isNpc: true },
            ],
          },
        },
      });
    });

    return this.viewFor(character.id, created.id, state);
  }

  async getByCharacter(characterId: string, battleId: string, state: BattleState) {
    return this.viewFor(characterId, battleId, state);
  }

  async get(userId: string, battleId: string) {
    const character = await this.requireReady(userId);
    const battle = await this.loadOwnedBattle(userId, battleId);
    const raw = battle.stateJson as { kind?: string } | BattleState | null;
    if (raw && "kind" in raw && raw.kind === "RANKED_DRAFT") {
      return this.presentRankedDraft(character.id, battle.id, raw as RankedDraftSession);
    }
    const state = await this.resolveAbandonedPvp(character.id, userId, battle);
    return this.viewFor(character.id, battle.id, state);
  }

  async act(userId: string, battleId: string, action: Parameters<typeof reduceBattle>[1]) {
    const character = await this.requireReady(userId);
    const battle = await this.loadOwnedBattle(userId, battleId);
    if ((battle.stateJson as { kind?: string } | null)?.kind === "RANKED_DRAFT") {
      throw Errors.battleInvalid("Draft ainda não virou batalha.");
    }
    let state = await this.resolveAbandonedPvp(character.id, userId, battle);
    if (state.status !== "ACTIVE") {
      throw Errors.battleInvalid("Batalha já encerrada.");
    }
    if (action.type === "CONCEDE" || (action.type === "FLEE" && state.type === "PVP")) {
      return this.concede(character.id, userId, battle.id, state);
    }
    if (action.type === "FLEE" && state.type === "PVE") {
      state = reduceBattle(state, action);
      await this.persistState(battle.id, state);
      await this.finish(character.id, userId, battle.id, state);
      return this.viewFor(character.id, battleId, state);
    }
    if (state.type === "PVP") {
      const timed = evaluateTimeout(state);
      if (timed !== "WAIT") {
        state = reduceBattle(state, { type: "TIMEOUT" });
        await this.persistState(battle.id, state);
        if (state.status !== "ACTIVE") {
          await this.finish(character.id, userId, battle.id, state);
          return this.viewFor(character.id, battleId, state);
        }
      }
      const side = state.sides[state.activeSide];
      if (side.characterId !== character.id && action.type !== "TIMEOUT") {
        throw Errors.battleInvalid("Não é o seu turno.");
      }
    } else if (state.activeSide !== 0) {
      throw Errors.battleInvalid("Aguarde o turno selvagem.");
    }

    if (action.type === "CAPTURE") {
      return this.capture(userId, battleId, action.orbKey);
    }

    state = reduceBattle(state, action);
    if (state.log.at(-1)?.type === "REJECT") {
      throw Errors.battleInvalid(state.log.at(-1)?.text ?? "Jogada recusada.");
    }
    if (state.type === "PVE" && state.status === "ACTIVE" && state.activeSide === 1) {
      state = this.resolveWildTurn(state);
    }
    await this.persistState(battle.id, state);
    if (state.status === "FINISHED" || state.status === "FLED") {
      await this.finish(character.id, userId, battle.id, state);
    }
    return this.viewFor(character.id, battleId, state);
  }

  async queuePvp(userId: string, opts?: { mode?: "CASUAL" | "RANKED"; creatureIds?: string[] }) {
    if (opts?.mode === "RANKED") {
      return this.queueRanked(userId, opts.creatureIds ?? []);
    }
    const character = await this.requireReady(userId);
    const existing = await this.activePvp(character.id);
    if (existing?.stateJson) {
      const state = await this.resolveAbandonedPvp(character.id, userId, existing);
      if (state.status === "ACTIVE") {
        return { status: "MATCHED" as const, battleId: existing.id };
      }
    }

    const matchedId = await this.prisma.client.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('genoryx_pvp_queue'))`;
      const already = await tx.battle.findFirst({
        where: { type: "PVP", status: "ACTIVE", participants: { some: { characterId: character.id } } },
        select: { id: true },
      });
      if (already) {
        return already.id;
      }
      const mine = await tx.character.findUniqueOrThrow({ where: { id: character.id } });
      if (mine.title === "PVP_QUEUE") {
        return null;
      }
      const waiting = await tx.character.findFirst({
        where: { id: { not: character.id }, title: "PVP_QUEUE" },
      });
      if (!waiting) {
        await tx.character.update({ where: { id: character.id }, data: { title: "PVP_QUEUE" } });
        return null;
      }
      await tx.character.update({ where: { id: waiting.id }, data: { title: null } });
      await tx.character.update({ where: { id: character.id }, data: { title: null } });
      return { waiting, self: character };
    });

    if (matchedId && typeof matchedId === "object") {
      const battle = await this.createPvp(matchedId.waiting, matchedId.self);
      return { status: "MATCHED" as const, battleId: battle.id };
    }
    if (typeof matchedId === "string") {
      return { status: "MATCHED" as const, battleId: matchedId };
    }
    return { status: "QUEUED" as const };
  }

  async leavePvp(userId: string) {
    const character = await this.requireReady(userId);
    const existing = await this.activePvp(character.id);
    if (existing) {
      if (existing.stateJson) {
        await this.concede(character.id, userId, existing.id, existing.stateJson as unknown as BattleState);
      }
      return { status: "IDLE" as const };
    }
    await this.prisma.client.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('genoryx_pvp_queue'))`;
      await tx.character.updateMany({
        where: { id: character.id, title: "PVP_QUEUE" },
        data: { title: null },
      });
    });
    return { status: "IDLE" as const };
  }

  async pvpStatus(userId: string) {
    const character = await this.requireReady(userId);
    if (character.title === "PVP_QUEUE") {
      return { status: "QUEUED" as const };
    }
    const active = await this.activePvp(character.id);
    if (active?.stateJson) {
      const raw = active.stateJson as { kind?: string };
      if (raw.kind === "RANKED_DRAFT") {
        return { status: "MATCHED" as const, ...(await this.presentRankedDraft(character.id, active.id, raw as RankedDraftSession)) };
      }
      const state = await this.resolveAbandonedPvp(character.id, userId, active);
      if (state.status !== "ACTIVE") {
        return { status: "IDLE" as const };
      }
      return {
        status: "MATCHED" as const,
        ...(await this.viewFor(character.id, active.id, state)),
      };
    }
    return { status: "IDLE" as const };
  }

  private resolveWildTurn(state: BattleState): BattleState {
    let current = state;
    let guard = 0;
    while (current.status === "ACTIVE" && current.activeSide === 1 && guard < 8) {
      const action = pickAiAction(current);
      current = reduceBattle(current, action);
      if (action.type === "END_TURN") {
        break;
      }
      guard += 1;
    }
    if (current.status === "ACTIVE" && current.activeSide === 1) {
      current = reduceBattle(current, { type: "END_TURN" });
    }
    return current;
  }

  private async capture(userId: string, battleId: string, orbKey: string) {
    const character = await this.requireReady(userId);
    const battle = await this.loadOwnedBattle(userId, battleId);
    let state = battle.stateJson as unknown as BattleState;
    if (state.type !== "PVE" || state.status !== "ACTIVE") {
      throw Errors.battleInvalid("Captura só em PvE ativo.");
    }
    const allowed = captureConfig.orbKeys as readonly string[];
    if (!allowed.includes(orbKey)) {
      throw Errors.battleInvalid("NexOrb inválida.");
    }
    const wild = livingCreatures(state.sides[1])[0];
    if (!wild) {
      throw Errors.battleInvalid("Alvo já derrotado.");
    }
    const owned = await countItem(this.prisma.client, character.id, orbKey);
    if (owned < 1) {
      throw Errors.battleInvalid(orbKey === "nexorb_plus" ? "Você não tem NexOrb+." : "Você não tem NexOrb.");
    }

    const rng = createSeededRandom(state.seed + state.rngIndex + 17);
    const roll = rollCapture({ hp: wild.hp, maxHp: wild.maxHp, orbKey }, rng);
    state = reduceBattle(state, { type: "CAPTURE", orbKey });
    state.rngIndex += 1;
    state.log.push({
      type: "CAPTURE_ROLL",
      value: Math.round(roll.chance * 100),
      text: roll.success ? "Captura bem-sucedida." : "A criatura escapou da NexOrb.",
    });

    let captured: ReturnType<typeof presentCreature> | null = null;
    try {
      const created = await this.prisma.client.$transaction(async (tx) => {
        await consumeItem(tx, character.id, orbKey, 1, {
          source: "CAPTURE",
          referenceId: battleId,
        });
        if (!roll.success) {
          return null;
        }
        const blueprint = generateCreatureBlueprint({
          seed: state.seed,
          speciesKey: state.wildSpeciesKey ?? wild.speciesKey,
          origin: "WILD",
          level: 1,
        });
        const creature = await persistCreature(tx, character.id, blueprint);
        await this.completeCaptureQuest(tx, character.id, userId);
        return creature;
      });
      if (created) {
        state.status = "FINISHED";
        state.winnerSide = 0;
        state.log.push({ type: "CAPTURE_OK", text: `${created.name ?? created.speciesId} agora é seu.` });
        captured = presentCreature(created as CreatureRecord);
        await this.visuals.enqueueBorn([created.id]).catch(() => undefined);
      }
    } catch (error) {
      throw error instanceof Error && error.message
        ? Errors.battleInvalid(error.message)
        : Errors.battleInvalid("A NexOrb falhou ao se materializar.");
    }

    await this.persistState(battle.id, state);
    if (state.status === "FINISHED") {
      await this.finish(character.id, userId, battle.id, state).catch(() => undefined);
    }
    return { ...(await this.viewFor(character.id, battleId, state)), captured, chance: roll.chance };
  }

  private async concede(characterId: string, userId: string, battleId: string, state: BattleState) {
    if (state.status !== "ACTIVE") {
      return this.viewFor(characterId, battleId, state);
    }
    const side = state.sides[0].characterId === characterId ? 0 : 1;
    const next = reduceBattle(state, { type: "CONCEDE", side });
    await this.persistState(battleId, next);
    await this.finish(characterId, userId, battleId, next);
    return this.viewFor(characterId, battleId, next);
  }

  private async resolveAbandonedPvp(
    characterId: string,
    userId: string,
    battle: { id: string; createdAt: Date; stateJson: unknown },
  ) {
    let state = battle.stateJson as unknown as BattleState;
    if ((battle.stateJson as { kind?: string } | null)?.kind === "RANKED_DRAFT") {
      return state;
    }
    if (state.type !== "PVP" || state.status !== "ACTIVE") {
      return state;
    }
    const last = await this.prisma.client.battleLog.findFirst({
      where: { battleId: battle.id },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    const lastAt = last?.createdAt ?? battle.createdAt;
    if (resolveMatchRules(state).turnTimerSec) {
      const decision = evaluateTimeout(state);
      if (decision === "WAIT") {
        return state;
      }
      state = reduceBattle(state, { type: "TIMEOUT" });
      if (state.status !== "ACTIVE") {
        await this.persistState(battle.id, state);
        await this.finish(characterId, userId, battle.id, state);
      } else {
        await this.persistState(battle.id, state);
      }
      return state;
    }
    if (Date.now() - lastAt.getTime() < alphaConfig.pvpTurnTimeoutMs) {
      return state;
    }
    const abandoned = state.activeSide === 1 ? 1 : 0;
    state = reduceBattle(state, { type: "CONCEDE", side: abandoned });
    state.log.push({
      type: "TIMEOUT",
      text: `${state.sides[abandoned].displayName} abandonou o turno.`,
    });
    await this.persistState(battle.id, state);
    await this.finish(characterId, userId, battle.id, state);
    return state;
  }

  private async finish(characterId: string, userId: string, battleId: string, state: BattleState) {
    const participants = await this.prisma.client.battleParticipant.findMany({
      where: { battleId, characterId: { not: null } },
      select: { characterId: true },
    });
    for (const row of participants) {
      if (row.characterId) {
        await this.unlockParty(row.characterId);
      }
    }
    await this.unlockParty(characterId);
    await this.prisma.client.$transaction(async (tx) => {
      const claimed = await tx.battle.updateMany({
        where: { id: battleId, finishedAt: null },
        data: {
          status: state.status === "FLED" ? "FLED" : "FINISHED",
          finishedAt: new Date(),
          winnerCharacterId: state.sides[state.winnerSide ?? 0]?.characterId ?? null,
          stateJson: state as object,
        },
      });
      if (claimed.count === 0) {
        return;
      }

      if (state.type === "PVP") {
        const winner = state.sides[state.winnerSide ?? 0];
        await tx.pvpMatch.create({
          data: {
            seasonKey: "alpha",
            challengerId: state.sides[0].characterId ?? characterId,
            opponentId: state.sides[1].characterId ?? characterId,
            winnerId: winner.characterId,
            battleId,
          },
        });
        const gold = pvpGoldReward("CASUAL");
        if (gold > 0 && winner.characterId) {
          const winnerChar = await tx.character.findUnique({ where: { id: winner.characterId } });
          if (winnerChar) {
            await this.creditBudgetedGold(
              tx,
              winnerChar.userId,
              gold,
              economyConfig.ledgerSources.PVP_REWARD,
              battleId,
            );
          }
        }
        return;
      }

      if (state.type !== "PVE" || state.status !== "FINISHED") {
        return;
      }

      if (state.winnerSide === 0) {
        const rng = createSeededRandom(seedFromParts([battleId, "pve-gold"]));
        const rolled = rollPveGold("WILD", rng);
        await this.creditBudgetedGold(tx, userId, rolled, economyConfig.ledgerSources.PVE_REWARD, battleId);
        if (rollPveCatalyst("WILD", rng)) {
          await grantItem(tx, characterId, genomeCatalystKey, 1, {
            source: economyConfig.ledgerSources.PVE_REWARD,
            referenceId: battleId,
          });
        }
        await tx.character.update({
          where: { id: characterId },
          data: { xp: { increment: alphaConfig.pveXp } },
        });
        const party = await tx.partySlot.findMany({
          where: { characterId },
          include: { creature: true },
        });
        for (const slot of party) {
          const next = applyCreatureXp(
            {
              level: slot.creature.level,
              xp: slot.creature.xp,
              lifeStage: slot.creature.lifeStage,
              evolutionStatus: slot.creature.evolutionStatus,
              maturationXp: slot.creature.maturationXp,
            },
            Math.round(alphaConfig.pveXp / 2),
          );
          await tx.creature.update({
            where: { id: slot.creatureId },
            data: {
              xp: next.xp,
              level: next.level,
              evolutionStatus: next.evolutionStatus as "NONE" | "READY_TO_EVOLVE" | "EVOLVING",
              readyToEvolveAt:
                next.evolutionStatus === "READY_TO_EVOLVE" && !slot.creature.readyToEvolveAt
                  ? new Date()
                  : slot.creature.readyToEvolveAt,
            },
          });
        }
      }

      const battleRow = await tx.battle.findUnique({ where: { id: battleId } });
      await this.maturation.grantForPveBattle(tx, {
        battleId,
        characterId,
        state,
        family: battleRow?.encounterFamily,
        mobSpecies: battleRow?.mobSpecies ?? state.wildSpeciesKey,
        mapKey: battleRow?.mapKey ?? "verdantis",
      });
    });
  }

  private async creditBudgetedGold(
    tx: Parameters<typeof creditOnce>[0],
    userId: string,
    rolled: number,
    source: string,
    referenceId: string,
  ) {
    const remaining = Number(await dailyGoldRewardRemaining(tx));
    const gold = clampRewardToBudget(rolled, remaining);
    if (gold <= 0) {
      return 0;
    }
    await creditOnce(tx, {
      userId,
      currency: "GOLD",
      amount: BigInt(gold),
      source,
      referenceId,
    });
    return gold;
  }

  private async createPvp(a: { id: string; name: string; userId: string }, b: { id: string; name: string; userId: string }) {
    const partyA = await this.loadParty(a.id);
    const partyB = await this.loadParty(b.id);
    const seed = seedFromParts([a.id, b.id, Date.now()]);
    const battleId = crypto.randomUUID();
    const state = createBattleState({
      id: battleId,
      seed,
      type: "PVP",
      matchMode: "CASUAL",
      mapKey: "casual",
      rulesVersion: "V1",
      sideA: {
        id: "a",
        characterId: a.id,
        displayName: a.name,
        creatures: await Promise.all(
          partyA.map(async (row) => ({
            blueprint: toBlueprint(row as CreatureRecord),
            bases: await this.basesFor(row.species.key),
            creatureId: row.id,
            slot: formationSlotFromIndex(row.partySlot, "V1"),
          })),
        ),
      },
      sideB: {
        id: "b",
        characterId: b.id,
        displayName: b.name,
        creatures: await Promise.all(
          partyB.map(async (row) => ({
            blueprint: toBlueprint(row as CreatureRecord),
            bases: await this.basesFor(row.species.key),
            creatureId: row.id,
            slot: formationSlotFromIndex(row.partySlot, "V1"),
          })),
        ),
      },
    });
    return this.prisma.client.battle.create({
      data: {
        id: battleId,
        type: "PVP",
        status: "ACTIVE",
        rngSeed: seed,
        stateJson: state as object,
        rulesVersion: state.rulesVersion,
        participants: {
          create: [
            { characterId: a.id, team: 0 },
            { characterId: b.id, team: 1 },
          ],
        },
      },
    });
  }

  private async loadParty(characterId: string) {
    await this.creatures.ensureAlphaRoster(characterId);
    await this.creatures.alignOwnedCards(characterId);
    const slots = await this.prisma.client.partySlot.findMany({
      where: { characterId },
      include: { creature: { include: creatureInclude } },
      orderBy: { slot: "asc" },
    });
    let rows = slots.map((slot) => ({ ...(slot.creature as CreatureRecord), partySlot: slot.slot }));
    if (rows.length === 0) {
      const fallback = await this.prisma.client.creature.findMany({
        where: { ownerCharacterId: characterId, lock: "NONE" },
        include: creatureInclude,
        take: 3,
        orderBy: { birthDate: "asc" },
      });
      rows = fallback.map((row, index) => ({ ...(row as CreatureRecord), partySlot: index }));
    }
    if (rows.length === 0) {
      throw Errors.starterRequired();
    }
    return rows;
  }

  private async basesFor(speciesKey: string) {
    const species = await this.prisma.client.creatureSpecies.findUniqueOrThrow({ where: { key: speciesKey } });
    return {
      baseHp: species.baseHp,
      baseAtk: species.baseAtk,
      baseDef: species.baseDef,
      baseMag: species.baseMag,
      baseRes: species.baseRes,
      baseSpd: species.baseSpd,
    };
  }

  private async consumeOffer(characterId: string, offerId: string) {
    const offer = await this.prisma.client.encounterOffer.findFirst({
      where: { id: offerId, characterId, consumedAt: null },
    });
    if (!offer || offer.expiresAt.getTime() < Date.now()) {
      throw Errors.encounterExpired();
    }
    await this.prisma.client.encounterOffer.update({
      where: { id: offer.id },
      data: { consumedAt: new Date() },
    });
    return offer;
  }

  private async rollAdHoc(characterId: string) {
    const verdantis = await this.prisma.client.gameMap.findUnique({
      where: { key: "verdantis" },
      include: { spawns: { include: { species: true } } },
    });
    const rng = createSeededRandom(seedFromParts([characterId, Date.now()]));
    const rolled = rollWildEncounter(
      (verdantis?.spawns ?? []).map((row) => ({
        speciesKey: row.species.key,
        weight: Math.round(row.weight * alphaConfig.spawnWeightMultiplier),
        minLevel: row.minLevel,
        maxLevel: row.maxLevel,
      })),
      rng,
    );
    return {
      ...rolled,
      seed: seedFromParts([characterId, rolled.speciesKey, Date.now()]),
      family: "COMMON",
      spawnKey: null,
    };
  }

  private async persistState(battleId: string, state: BattleState) {
    const last = state.log.at(-1)?.type;
    if (last === "END_TURN" || last === "START") {
      state.clock = state.clock ?? { turnStartedAt: Date.now(), timeBank: [120, 120], consecutiveAuto: [0, 0] };
      state.clock.turnStartedAt = Date.now();
    }
    await this.prisma.client.battle.update({
      where: { id: battleId },
      data: {
        stateJson: state as object,
        currentRound: state.round,
        rulesVersion: state.rulesVersion ?? "V1",
        status: state.status === "ACTIVE" ? "ACTIVE" : state.status === "FLED" ? "FLED" : "FINISHED",
      },
    });
    await this.prisma.client.battleLog.create({
      data: {
        battleId,
        turn: state.round,
        action: state.log.at(-1)?.type ?? "TICK",
        payload: state.log.at(-1) as object,
      },
    });
  }

  private async unlockParty(characterId: string) {
    await this.prisma.client.creature.updateMany({
      where: { ownerCharacterId: characterId, lock: "BATTLE" },
      data: { lock: "NONE" },
    });
  }

  private async completeCaptureQuest(tx: Parameters<typeof persistCreature>[0], characterId: string, userId: string) {
    const quest = await tx.quest.findUnique({ where: { key: breedingConfig.captureQuestKey } });
    if (!quest) {
      return;
    }
    const progress = await tx.questProgress.findUnique({
      where: { characterId_questId: { characterId, questId: quest.id } },
    });
    if (!progress || progress.status === "COMPLETED") {
      return;
    }
    await tx.questProgress.update({
      where: { id: progress.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
    const capture = activeEconomy().captureQuest;
    await creditOnce(tx, {
      userId,
      currency: "GOLD",
      amount: BigInt(capture.gold),
      source: economyConfig.ledgerSources.QUEST_REWARD,
      referenceId: quest.id,
    });
    await grantItem(tx, characterId, "nexorb", capture.nexOrbs, {
      source: economyConfig.ledgerSources.QUEST_REWARD,
      referenceId: quest.id,
    });
    await tx.character.update({
      where: { id: characterId },
      data: { xp: { increment: capture.xp } },
    });
  }

  private async loadOwnedBattle(userId: string, battleId: string) {
    const character = await this.requireReady(userId);
    const battle = await this.prisma.client.battle.findFirst({
      where: { id: battleId, participants: { some: { characterId: character.id } } },
    });
    if (!battle?.stateJson) {
      throw Errors.battleInvalid("Batalha não encontrada.");
    }
    return battle;
  }

  private async requireReady(userId: string) {
    const character = await this.prisma.client.character.findUnique({ where: { userId } });
    if (!character) {
      throw Errors.characterNotFound();
    }
    if (!character.starterChosen) {
      throw Errors.starterRequired();
    }
    return character;
  }

  private async activePvp(characterId: string) {
    return this.prisma.client.battle.findFirst({
      where: { type: "PVP", status: { in: ["ACTIVE", "PENDING"] }, participants: { some: { characterId } } },
      orderBy: { createdAt: "desc" },
    });
  }

  private async queueRanked(userId: string, creatureIds: string[]) {
    if (!combatV15Flags.rankedDraft) {
      throw Errors.battleInvalid("Draft ranqueado desligado.");
    }
    if (creatureIds.length !== 5 || new Set(creatureIds).size !== 5) {
      throw Errors.validation("Ranked exige um squad de 5 criaturas distintas.");
    }
    const character = await this.requireReady(userId);
    const existing = await this.activePvp(character.id);
    if (existing?.stateJson) {
      return { status: "MATCHED" as const, battleId: existing.id, phase: (existing.stateJson as { phase?: string }).phase };
    }
    const rows = await this.prisma.client.creature.findMany({
      where: { id: { in: creatureIds }, ownerCharacterId: character.id, lock: "NONE" },
      include: { species: true },
    });
    if (rows.length !== 5) {
      throw Errors.validation("Squad inválido. Precisa possuir 5 criaturas livres.");
    }
    const catalog: DraftCreature[] = rows.map((row) => ({
      creatureId: row.id,
      speciesKey: row.species.key,
      typology: row.species.key,
      eligible: true,
    }));
    const summaries = rows.map((row) => {
      const manifest = (row as { combatManifestJson?: unknown }).combatManifestJson as Parameters<typeof draftCreatureSummary>[4];
      return draftCreatureSummary(row.id, row.name ?? row.species.key, row.species.key, null, manifest);
    });

    const joined = await this.prisma.client.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('genoryx_ranked_queue'))`;
      const waiting = await tx.battle.findFirst({
        where: { type: "PVP", status: "PENDING", mapKey: "ranked" },
        include: { participants: true },
        orderBy: { createdAt: "asc" },
      });
      if (waiting && waiting.participants.length === 1 && waiting.participants[0]?.characterId !== character.id) {
        return { waiting, self: character, catalog, summaries, creatureIds };
      }
      const seed = seedFromParts([character.id, Date.now()]);
      const draft = createDraftState(character.id, "pending");
      const locked = reduceDraft(draft, { type: "SUBMIT_ROSTER", teamId: character.id, creatureIds, catalog });
      const battle = await tx.battle.create({
        data: {
          type: "PVP",
          status: "PENDING",
          rngSeed: seed,
          mapKey: "ranked",
          rulesVersion: matchRulesFor("RANKED").rulesVersion,
          stateJson: {
            kind: "RANKED_DRAFT",
            seed,
            matchRules: matchRulesFor("RANKED"),
            draft: locked,
            catalogs: { [character.id]: summaries },
            rosters: { [character.id]: { creatureIds, catalog } },
          } as object,
          participants: { create: [{ characterId: character.id, team: 0 }] },
        },
      });
      return { createdId: battle.id };
    });

    if ("createdId" in joined) {
      return { status: "QUEUED" as const, battleId: joined.createdId };
    }
    const battleId = joined.waiting.id;
    const session = joined.waiting.stateJson as RankedDraftSession;
    session.draft.teams[1].id = character.id;
    session.catalogs[character.id] = summaries;
    session.rosters[character.id] = { creatureIds, catalog };
    let draft = reduceDraft(session.draft, { type: "SUBMIT_ROSTER", teamId: character.id, creatureIds, catalog });
    session.draft = draft;
    await this.prisma.client.battle.update({
      where: { id: battleId },
      data: {
        stateJson: session as object,
        participants: { create: { characterId: character.id, team: 1 } },
      },
    });
    return { status: "MATCHED" as const, battleId, phase: draft.phase };
  }

  async rankedDraft(
    userId: string,
    battleId: string,
    action: { type: "BAN_CREATURE" | "SELECT_ACTIVE_CREATURES" | "SET_FORMATION"; creatureId?: string; creatureIds?: string[]; formation?: { FRONT?: string; MIDDLE?: string; BACK?: string } },
  ) {
    const character = await this.requireReady(userId);
    const battle = await this.loadOwnedBattle(userId, battleId);
    const session = battle.stateJson as RankedDraftSession;
    if (!session || session.kind !== "RANKED_DRAFT") {
      throw Errors.battleInvalid("Esta batalha não está em draft.");
    }
    const teamId = character.id;
    let draft = session.draft;
    if (action.type === "BAN_CREATURE") {
      draft = reduceDraft(draft, { type: "BAN_CREATURE", teamId, creatureId: action.creatureId ?? "" });
    } else if (action.type === "SELECT_ACTIVE_CREATURES") {
      draft = reduceDraft(draft, { type: "SELECT_ACTIVE_CREATURES", teamId, creatureIds: action.creatureIds ?? [] });
    } else {
      draft = reduceDraft(draft, { type: "SET_FORMATION", teamId, formation: action.formation ?? {} });
    }
    if (draft.log.at(-1)?.type === "REJECT") {
      throw Errors.battleInvalid(draft.log.at(-1)?.text ?? "Draft recusado.");
    }
    session.draft = draft;
    if (draft.phase === "READY") {
      return this.materializeRanked(character.id, battleId, session);
    }
    await this.prisma.client.battle.update({ where: { id: battleId }, data: { stateJson: session as object } });
    return this.presentRankedDraft(character.id, battleId, session);
  }

  private async materializeRanked(characterId: string, battleId: string, session: RankedDraftSession) {
    const participants = await this.prisma.client.battleParticipant.findMany({
      where: { battleId },
      orderBy: { team: "asc" },
    });
    const teamA = session.draft.teams[0];
    const teamB = session.draft.teams[1];
    const ids = [...teamA.selectedIds, ...teamB.selectedIds];
    const rows = await this.prisma.client.creature.findMany({
      where: { id: { in: ids } },
      include: { species: true, mutation: true, loci: true, visualAssets: true, modelAssets: true, geneticPower: { include: { power: true } } },
    });
    const toFighter = async (team: typeof teamA, character: { id: string; name: string }, prefix: string) => {
      const order = ["FRONT", "MIDDLE", "BACK"] as const;
      return {
        id: prefix,
        characterId: character.id,
        displayName: character.name,
        creatures: await Promise.all(
          order.map(async (slot) => {
            const id = team.formation[slot]!;
            const row = rows.find((item) => item.id === id)!;
            return {
              blueprint: toBlueprint(row as CreatureRecord),
              bases: await this.basesFor(row.species.key),
              creatureId: id,
              slot,
            };
          }),
        ),
        rosterIds: team.roster.map((row) => row.creatureId),
        bannedCreatureId: team.bannedCreatureId,
        selectedIds: team.selectedIds,
        benchedCreatureId: team.benchedCreatureId,
      };
    };
    const aChar = await this.prisma.client.character.findUniqueOrThrow({ where: { id: teamA.id } });
    const bChar = await this.prisma.client.character.findUniqueOrThrow({ where: { id: teamB.id } });
    const state = createBattleState({
      id: battleId,
      seed: session.seed,
      type: "PVP",
      matchMode: "RANKED",
      mapKey: "ranked",
      rulesVersion: "V1",
      sideA: await toFighter(teamA, aChar, "a"),
      sideB: await toFighter(teamB, bChar, "b"),
    });
    await this.prisma.client.battle.update({
      where: { id: battleId },
      data: { status: "ACTIVE", stateJson: state as object, currentRound: 1, rulesVersion: state.matchRules?.rulesVersion ?? "S1.V1" },
    });
    void participants;
    return this.viewFor(characterId, battleId, state);
  }

  private presentRankedDraft(characterId: string, battleId: string, session: RankedDraftSession) {
    const you = session.draft.teams.find((row) => row.id === characterId) ?? session.draft.teams[0];
    const foe = session.draft.teams.find((row) => row.id !== characterId) ?? session.draft.teams[1];
    const hideBan = session.draft.phase === "BAN_PHASE";
    return {
      battleId,
      kind: "RANKED_DRAFT" as const,
      phase: session.draft.phase,
      matchRules: session.matchRules,
      yourRoster: session.catalogs[characterId] ?? [],
      foeRoster: Object.entries(session.catalogs)
        .filter(([id]) => id !== characterId)
        .flatMap(([, rows]) => rows),
      yourBanLocked: Boolean(you.pendingBan),
      foeBanLocked: Boolean(foe.pendingBan),
      bannedByYou: hideBan ? null : foe.bannedCreatureId,
      bannedByFoe: hideBan ? null : you.bannedCreatureId,
      yourPick: you.selectedIds,
      foePick: hideBan || session.draft.phase === "PICK_PHASE" ? [] : foe.selectedIds,
      formation: you.formation,
    };
  }

  private async viewFor(characterId: string, battleId: string, state: BattleState) {
    const cardArt = new Map<string, ReturnType<typeof resolveCanonicalCardArt>>();
    for (const card of state.sides.flatMap((side) => side.hand)) {
      const mapKey = card.sourceCreatureId ? `${card.sourceCreatureId}:${card.definitionKey}` : card.definitionKey;
      if (cardArt.has(mapKey)) {
        continue;
      }
      try {
        const resolved = card.sourceCreatureId
          ? await this.cardArt.resolveCreatureReady(card.sourceCreatureId, card.definitionKey, card.locus)
          : await this.cardArt.resolveCanonical(card.definitionKey);
        cardArt.set(mapKey, resolved);
      } catch {
        cardArt.set(mapKey, { cardDefinitionId: card.definitionKey, variant: "BASE", status: "PLACEHOLDER", source: "placeholder", artUrl: null, imageHash: null });
      }
    }
    const cache = new Map();
    const visuals = new Map();
    for (const unit of state.sides.flatMap((side) => side.creatures)) {
      const resolved = await this.battleVisuals.resolveCombatant(
        { creatureId: unit.creatureId, speciesKey: unit.speciesKey },
        cache,
      );
      if (unit.creatureId) {
        visuals.set(unit.creatureId, resolved);
      }
      visuals.set(`species:${unit.speciesKey}`, cache.get(unit.speciesKey) ?? resolved);
    }
    const maturationRewards = await this.prisma.client.maturationEvent.findMany({
      where: { battleId },
      include: { creature: { select: { name: true, lifeStage: true, maturationXp: true, evolutionStatus: true } } },
    });
    const [nexorb, nexorbPlus] = await Promise.all([
      countItem(this.prisma.client, characterId, "nexorb"),
      countItem(this.prisma.client, characterId, "nexorb_plus"),
    ]);
    const character = await this.prisma.client.character.findUnique({
      where: { id: characterId },
      select: { mapKey: true },
    });
    return {
      ...presentBattle(battleId, state, characterId, {
        cardArt,
        visuals,
        renderer: battlePresentationConfig.renderer,
      }),
      orbs: { nexorb, nexorb_plus: nexorbPlus },
      returnMapKey: character?.mapKey ?? "haven",
      maturationRewards: maturationRewards.map((row) => ({
        creatureId: row.creatureId,
        name: row.creature.name ?? row.creatureId,
        amount: row.amount,
        participation: row.participation,
        discovery: row.discovery,
        becameReady: row.creature.evolutionStatus === "READY_TO_EVOLVE",
        maturationXp: row.creature.maturationXp,
        lifeStage: row.creature.lifeStage,
      })),
    };
  }
}

type RankedDraftSession = {
  kind: "RANKED_DRAFT";
  seed: number;
  matchRules: ReturnType<typeof matchRulesFor>;
  draft: ReturnType<typeof createDraftState>;
  catalogs: Record<string, ReturnType<typeof draftCreatureSummary>[]>;
  rosters: Record<string, { creatureIds: string[]; catalog: DraftCreature[] }>;
};
