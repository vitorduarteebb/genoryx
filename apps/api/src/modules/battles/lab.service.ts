import { Injectable } from "@nestjs/common";
import { alphaConfig, combatMatrixConfig, seedPowerForSpecies } from "@nexora/config";
import type { LinearFormationSlot } from "@nexora/types";
import {
  aiBanTarget,
  aiFormation,
  aiLabCatalog,
  aiPickThree,
  createBattleState,
  createDraftState,
  generateCreatureBlueprint,
  parseChassisDna,
  reduceDraft,
  seedFromParts,
  type DraftCreature,
  type DraftState,
} from "@nexora/game-engine";
import { persistCreature, presentCreature, toBlueprint, type CreatureRecord } from "../../common/creature-io";
import { Errors } from "../../common/errors/app-error";
import { BattleVisualsService } from "../battle-visuals/battle-visuals.service";
import { CreaturesService } from "../creatures/creatures.service";
import { PrismaService } from "../../prisma/prisma.service";
import { BattlesService } from "./battles.service";

const creatureInclude = {
  species: true,
  mutation: true,
  loci: true,
  visualAssets: true,
  modelAssets: true,
  geneticPower: { include: { power: true } },
} as const;

const LAB_SPECIES = ["pyron", "florune", "noctyr", "terranox", "voltaris"] as const;

export type LabCreatureView = {
  creatureId: string;
  name: string;
  speciesKey: string;
  speciesName: string;
  element: string;
  typology: string;
  powerName: string;
  lifeStage: string;
  hp: number;
  portraitUrl: string | null;
  chassis?: ReturnType<typeof parseChassisDna>;
  temperament?: string | null;
  visualSeed?: string | null;
  banned?: boolean;
  benched?: boolean;
  lock?: string;
  locked?: boolean;
};

export type LabSession = {
  kind: "COMPETITIVE_LAB";
  rulesVersion: "V2";
  seed: number;
  draft: DraftState;
  playerCatalog: LabCreatureView[];
  foeCatalog: LabCreatureView[];
};

@Injectable()
export class LabService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly creatures: CreaturesService,
    private readonly visuals: BattleVisualsService,
    private readonly battles: BattlesService,
  ) {}

  async catalog(userId: string) {
    const character = await this.requireReady(userId);
    await this.releaseStaleBattleLocks(character.id);
    const live = await this.prisma.client.battle.findFirst({
      where: {
        mapKey: "lab",
        status: { in: ["PENDING", "ACTIVE"] },
        participants: { some: { characterId: character.id } },
      },
      select: { id: true, status: true },
      orderBy: { createdAt: "desc" },
    });
    const rows = await this.prisma.client.creature.findMany({
      where: { ownerCharacterId: character.id },
      include: creatureInclude,
      orderBy: { birthDate: "asc" },
    });
    return {
      mode: "COMPETITIVE_LAB",
      ruleset: "ALPHA RULESET V2",
      activeDraftId: live?.status === "PENDING" ? live.id : null,
      activeBattleId: live?.status === "ACTIVE" ? live.id : null,
      creatures: await Promise.all(
        rows.map(async (row) => ({
          ...(await this.toView(row as CreatureRecord)),
          lock: row.lock,
          locked: row.lock !== "NONE",
        })),
      ),
    };
  }

  async start(userId: string, creatureIds: string[]) {
    if (!combatMatrixConfig.draftV2) {
      throw Errors.battleInvalid("Competitive Lab desligado.");
    }
    if (creatureIds.length !== 5) {
      throw Errors.validation("Selecione exatamente 5 criaturas.");
    }
    const character = await this.requireReady(userId);
    const unique = new Set(creatureIds);
    if (unique.size !== 5) {
      throw Errors.validation("Roster com criatura repetida.");
    }
    const rows = await this.prisma.client.creature.findMany({
      where: { id: { in: creatureIds }, ownerCharacterId: character.id, lock: "NONE" },
      include: creatureInclude,
    });
    if (rows.length !== 5) {
      throw Errors.battleInvalid("Roster inválido: posse, lock ou elegibilidade.");
    }

    const seed = seedFromParts([character.id, "lab", Date.now()]);
    const playerCatalog = await Promise.all(rows.map((row) => this.toView(row as CreatureRecord)));
    const foeCatalog = await Promise.all(aiLabCatalog().map((row) => this.aiView(row, seed)));
    const playerDraft: DraftCreature[] = playerCatalog.map((row) => ({
      creatureId: row.creatureId,
      speciesKey: row.speciesKey,
      typology: row.typology,
      eligible: true,
    }));
    const foeDraft = aiLabCatalog();

    let draft = createDraftState("player", "foe");
    draft = reduceDraft(draft, {
      type: "SUBMIT_ROSTER",
      teamId: "player",
      creatureIds,
      catalog: playerDraft,
    });
    draft = reduceDraft(draft, {
      type: "SUBMIT_ROSTER",
      teamId: "foe",
      creatureIds: foeDraft.map((row) => row.creatureId),
      catalog: foeDraft,
    });
    draft = this.advanceAi(draft, playerDraft, foeDraft);

    const battleId = crypto.randomUUID();
    const session: LabSession = {
      kind: "COMPETITIVE_LAB",
      rulesVersion: "V2",
      seed,
      draft,
      playerCatalog,
      foeCatalog,
    };
    await this.prisma.client.$transaction(async (tx) => {
      await tx.creature.updateMany({
        where: { id: { in: creatureIds } },
        data: { lock: "BATTLE" },
      });
      await tx.battle.create({
        data: {
          id: battleId,
          type: "PVE",
          status: "PENDING",
          rngSeed: seed,
          mapKey: "lab",
          rulesVersion: "V2",
          stateJson: session as object,
          currentRound: 0,
          participants: {
            create: [
              { characterId: character.id, team: 0, isNpc: false },
              { team: 1, isNpc: true },
            ],
          },
        },
      });
    });
    return this.presentLab(character.id, battleId, session);
  }

  async get(userId: string, battleId: string) {
    const character = await this.requireReady(userId);
    const battle = await this.loadLab(character.id, battleId);
    const json = battle.stateJson as LabSession | { rulesVersion?: string };
    if ("kind" in json && json.kind === "COMPETITIVE_LAB" && battle.status === "PENDING") {
      return this.presentLab(character.id, battleId, await this.withChassis(json));
    }
    return this.battles.get(userId, battleId);
  }

  async act(
    userId: string,
    battleId: string,
    action:
      | { type: "BAN_CREATURE"; creatureId: string }
      | { type: "SELECT_ACTIVE_CREATURES"; creatureIds: string[] }
      | { type: "SET_FORMATION"; formation: Partial<Record<LinearFormationSlot, string>> },
  ) {
    const character = await this.requireReady(userId);
    const battle = await this.loadLab(character.id, battleId);
    const session = battle.stateJson as LabSession;
    if (!session || session.kind !== "COMPETITIVE_LAB" || battle.status !== "PENDING") {
      throw Errors.battleInvalid("Draft já encerrado.");
    }
    const playerDraft = session.playerCatalog.map((row) => ({
      creatureId: row.creatureId,
      speciesKey: row.speciesKey,
      typology: row.typology,
      eligible: true,
    }));
    const foeDraft = aiLabCatalog();
    session.draft = reduceDraft(session.draft, { ...action, teamId: "player" } as never);
    if (session.draft.log.at(-1)?.type === "REJECT") {
      throw Errors.battleInvalid(session.draft.log.at(-1)?.text ?? "Ação recusada.");
    }
    session.draft = this.advanceAi(session.draft, playerDraft, foeDraft);
    if (session.draft.log.at(-1)?.type === "REJECT") {
      throw Errors.battleInvalid(session.draft.log.at(-1)?.text ?? "Ação recusada.");
    }
    const live = await this.withChassis(session);
    session.playerCatalog = live.playerCatalog;
    session.foeCatalog = live.foeCatalog;
    if (session.draft.phase === "READY") {
      return this.materialize(character.id, character.name, battleId, session);
    }
    await this.prisma.client.battle.update({
      where: { id: battleId },
      data: { stateJson: session as object },
    });
    return this.presentLab(character.id, battleId, session);
  }

  private advanceAi(draft: DraftState, player: DraftCreature[], foe: DraftCreature[]): DraftState {
    let next = draft;
    if (next.phase === "BAN_PHASE" && !next.teams[1].bannedCreatureId) {
      next = reduceDraft(next, { type: "BAN_CREATURE", teamId: "foe", creatureId: aiBanTarget(player) });
    }
    if (next.phase === "PICK_PHASE" && next.teams[1].selectedIds.length === 0 && next.teams[0].selectedIds.length === 3) {
      next = reduceDraft(next, {
        type: "SELECT_ACTIVE_CREATURES",
        teamId: "foe",
        creatureIds: aiPickThree(foe, next.teams[1].bannedCreatureId),
      });
    }
    if (next.phase === "FORMATION_PHASE" && !next.teams[1].formation.FRONT && next.teams[0].formation.FRONT) {
      next = reduceDraft(next, {
        type: "SET_FORMATION",
        teamId: "foe",
        formation: aiFormation(next.teams[1].selectedIds, foe),
      });
    }
    return next;
  }

  private async materialize(characterId: string, displayName: string, battleId: string, session: LabSession) {
    const playerIds = session.draft.teams[0].selectedIds;
    const rows = await this.prisma.client.creature.findMany({
      where: { id: { in: playerIds } },
      include: creatureInclude,
    });
    const formation = session.draft.teams[0].formation;
    const foeFormation = session.draft.teams[1].formation;
    const foeOrder = ["FRONT", "MIDDLE", "BACK"] as const;
    const state = createBattleState({
      id: battleId,
      seed: session.seed,
      type: "PVE",
      rulesVersion: "V2",
      sideA: {
        id: "player",
        characterId,
        displayName,
        creatures: playerIds.map((id) => {
          const row = rows.find((item) => item.id === id)!;
          const slot = (Object.entries(formation).find(([, creatureId]) => creatureId === id)?.[0] ?? "FRONT") as LinearFormationSlot;
          return {
            blueprint: toBlueprint(row as CreatureRecord),
            bases: this.bases(row.species),
            creatureId: id,
            slot,
            typology: seedPowerForSpecies(row.species.key)?.typology,
          };
        }),
        rosterIds: session.playerCatalog.map((row) => row.creatureId),
        bannedCreatureId: session.draft.teams[0].bannedCreatureId,
        selectedIds: playerIds,
        benchedCreatureId: session.draft.teams[0].benchedCreatureId,
      },
      sideB: {
        id: "lab-ai",
        displayName: "Lab AI",
        creatures: foeOrder.map((slot) => {
          const id = foeFormation[slot]!;
          const meta = aiLabCatalog().find((row) => row.creatureId === id)!;
          return {
            blueprint: generateCreatureBlueprint({
              seed: seedFromParts([session.seed, meta.speciesKey]),
              speciesKey: meta.speciesKey,
              origin: "WILD",
            }),
            bases: { baseHp: 92, baseAtk: 74, baseDef: 48, baseMag: 70, baseRes: 70, baseSpd: 88 },
            creatureId: id,
            slot,
            typology: meta.typology,
          };
        }),
        bannedCreatureId: session.draft.teams[1].bannedCreatureId,
        selectedIds: session.draft.teams[1].selectedIds,
        benchedCreatureId: session.draft.teams[1].benchedCreatureId,
      },
    });
    const noctyrId = session.playerCatalog.find((row) => row.speciesKey === "noctyr" && playerIds.includes(row.creatureId))?.creatureId;
    if (noctyrId && !state.sides[0].hand.concat(state.sides[0].deck).some((card) => card.definitionKey === "abyss_needle")) {
      state.sides[0].hand.push({
        instanceId: `${battleId}-backline`,
        definitionKey: "abyss_needle",
        sourceCreatureId: noctyrId,
        typology: "CONTROL",
        element: "DARK",
      });
    }
    await this.prisma.client.battle.update({
      where: { id: battleId },
      data: { status: "ACTIVE", stateJson: state as object, currentRound: 1, rulesVersion: "V2" },
    });
    const view = await this.battles.getByCharacter(characterId, battleId, state);
    const chassisById = new Map(
      [...session.playerCatalog, ...session.foeCatalog]
        .filter((row) => row.chassis)
        .map((row) => [row.creatureId, row.chassis] as const),
    );
    for (const side of view.state.sides) {
      for (const unit of side.creatures) {
        const chassis = chassisById.get(unit.creatureId ?? unit.id) ?? unit.visual?.chassis;
        if (!chassis) {
          continue;
        }
        unit.visual = { ...unit.visual, chassis };
      }
    }
    return view;
  }

  private async withChassis(session: LabSession): Promise<LabSession> {
    const rows = await this.prisma.client.creature.findMany({
      where: { id: { in: session.playerCatalog.map((row) => row.creatureId) } },
      include: creatureInclude,
    });
    const byId = new Map(rows.map((row) => [row.id, row as CreatureRecord]));
    return {
      ...session,
      playerCatalog: await Promise.all(
        session.playerCatalog.map((row) => {
          const owned = byId.get(row.creatureId);
          return owned ? this.toView(owned) : Promise.resolve(row);
        }),
      ),
      foeCatalog: await Promise.all(
        session.foeCatalog.map((row) =>
          this.aiView(
            { creatureId: row.creatureId, speciesKey: row.speciesKey, typology: row.typology, eligible: true },
            session.seed,
          ),
        ),
      ),
    };
  }

  private presentLab(characterId: string, battleId: string, session: LabSession) {
    const player = session.draft.teams[0];
    const foe = session.draft.teams[1];
    return {
      kind: "COMPETITIVE_LAB" as const,
      battleId,
      rulesVersion: "V2" as const,
      ruleset: "ALPHA RULESET V2",
      phase: session.draft.phase,
      yourRoster: session.playerCatalog.map((row) => ({
        ...row,
        banned: player.bannedCreatureId === row.creatureId,
        benched: player.benchedCreatureId === row.creatureId,
        selected: player.selectedIds.includes(row.creatureId),
      })),
      foeRoster: session.foeCatalog.map((row) => ({
        ...row,
        banned: foe.bannedCreatureId === row.creatureId,
        benched: foe.benchedCreatureId === row.creatureId,
        selected: foe.selectedIds.includes(row.creatureId),
      })),
      bannedByYou: foe.bannedCreatureId,
      bannedByFoe: player.bannedCreatureId,
      selected: player.selectedIds,
      benched: player.benchedCreatureId,
      formation: player.formation,
      log: session.draft.log,
      characterId,
    };
  }

  async ensureLabRoster(characterId: string) {
    await this.creatures.ensureAlphaRoster(characterId);
    const owned = await this.prisma.client.creature.findMany({
      where: { ownerCharacterId: characterId },
      include: { species: true },
    });
    const have = new Set(owned.map((row) => row.species.key));
    const missing = LAB_SPECIES.filter((key) => !have.has(key));
    if (missing.length === 0) {
      return;
    }
    const created = await this.prisma.client.$transaction(async (tx) => {
      const ids: string[] = [];
      for (const speciesKey of missing) {
        const blueprint = generateCreatureBlueprint({
          seed: seedFromParts([characterId, speciesKey, "lab-roster"]),
          speciesKey,
          origin: "STARTER",
          name: speciesKey,
          gender: speciesKey === "florune" || speciesKey === "noctyr" ? "FEMALE" : "MALE",
        });
        const row = await persistCreature(tx, characterId, blueprint);
        ids.push(row.id);
      }
      return ids;
    });
    await this.creatures.enqueueBornPublic(created);
    return created;
  }

  private async toView(row: CreatureRecord): Promise<LabCreatureView> {
    const presented = presentCreature(row);
    const visual = await this.visuals.resolveCombatant({ creatureId: row.id, speciesKey: row.species.key }, new Map());
    const power = seedPowerForSpecies(row.species.key);
    return {
      creatureId: row.id,
      name: presented.name,
      speciesKey: row.species.key,
      speciesName: row.species.name,
      element: row.elementPrimary,
      typology: presented.geneticPower?.typology ?? power?.typology ?? "AGGRO",
      powerName: presented.geneticPower?.name ?? power?.namePt ?? "—",
      lifeStage: row.lifeStage,
      hp: row.species.baseHp,
      portraitUrl: visual.portraitUrl ?? presented.portraitUrl ?? null,
      chassis: parseChassisDna((row.visualGenomeJson as { chassis?: unknown } | null)?.chassis) ?? presented.chassis ?? null,
      temperament: row.temperament ?? null,
      visualSeed: row.visualSeed ?? null,
    };
  }

  private async aiView(row: DraftCreature, seed: number): Promise<LabCreatureView> {
    const visual = await this.visuals.resolveCombatant({ speciesKey: row.speciesKey }, new Map());
    const power = seedPowerForSpecies(row.speciesKey);
    const blueprint = generateCreatureBlueprint({
      seed: seedFromParts([seed, row.speciesKey, "lab-foe"]),
      speciesKey: row.speciesKey,
      origin: "WILD",
    });
    return {
      creatureId: row.creatureId,
      name: row.speciesKey,
      speciesKey: row.speciesKey,
      speciesName: row.speciesKey,
      element: power?.element ?? "ARCANE",
      typology: row.typology,
      powerName: power?.namePt ?? "—",
      lifeStage: "ADULT",
      hp: 88,
      portraitUrl: visual.portraitUrl,
      chassis: blueprint.chassis ? { ...blueprint.chassis, growthStage: "Adult" } : null,
      visualSeed: String(seedFromParts([seed, row.speciesKey, "lab-foe"])),
    };
  }

  private bases(species: { baseHp: number; baseAtk: number; baseDef: number; baseMag: number; baseRes: number; baseSpd: number }) {
    return {
      baseHp: species.baseHp,
      baseAtk: species.baseAtk,
      baseDef: species.baseDef,
      baseMag: species.baseMag,
      baseRes: species.baseRes,
      baseSpd: species.baseSpd,
    };
  }

  private async loadLab(characterId: string, battleId: string) {
    const battle = await this.prisma.client.battle.findFirst({
      where: { id: battleId, participants: { some: { characterId } } },
    });
    if (!battle?.stateJson) {
      throw Errors.battleInvalid("Sessão do Lab não encontrada.");
    }
    return battle;
  }

  private async releaseStaleBattleLocks(characterId: string) {
    const cutoff = new Date(Date.now() - alphaConfig.pvpTurnTimeoutMs);
    const open = await this.prisma.client.battle.findMany({
      where: {
        type: "PVE",
        status: { in: ["ACTIVE", "PENDING"] },
        participants: { some: { characterId } },
      },
      select: {
        id: true,
        createdAt: true,
        logs: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
      },
    });
    const staleIds = open
      .filter((row) => (row.logs[0]?.createdAt ?? row.createdAt) < cutoff)
      .map((row) => row.id);
    if (staleIds.length > 0) {
      await this.prisma.client.battle.updateMany({
        where: { id: { in: staleIds } },
        data: { status: "FLED", finishedAt: new Date() },
      });
    }
    const blocking = await this.prisma.client.battle.count({
      where: { status: { in: ["ACTIVE", "PENDING"] }, participants: { some: { characterId } } },
    });
    if (blocking > 0) {
      return;
    }
    await this.prisma.client.creature.updateMany({
      where: { ownerCharacterId: characterId, lock: "BATTLE" },
      data: { lock: "NONE" },
    });
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
}
