import { Injectable } from "@nestjs/common";
import { activeEconomy, alphaConfig, economyConfig, nextLifeStage, presentCard, presentPlayableCard } from "@nexora/config";
import { canEvolve, collectCardContributions, collectCardPool, generateCreatureBlueprint, partySynergyLinks, seedFromParts } from "@nexora/game-engine";
import {
  alignCreatureLoci,
  ensureCreatureCardKit,
  kitFromRecord,
  persistCreature,
  presentCreature,
  presentKitCards,
  presentKin,
  toBlueprint,
  type CreatureRecord,
} from "../../common/creature-io";
import {
  genesisCanConfirm,
  genesisPayloadHasNoSecrets,
  presentCollectionVisual,
  presentGenesisReveal,
  resolveRowVisual,
  revealStatusOf,
} from "../../common/creature-visual-present";
import { currentVisualProvider } from "../creature-visuals/generation-key";
import { Errors } from "../../common/errors/app-error";
import { parseCreatureName } from "./creature-name";
import { grantItem } from "../../common/inventory";
import { PrismaService } from "../../prisma/prisma.service";
import { CreatureVisualsService } from "../creature-visuals/creature-visuals.service";
import { CardArtService } from "../card-art/card-art.service";
import { GeneticPowersService } from "../genetic-powers/genetic-powers.service";

const creatureInclude = {
  species: true,
  mutation: true,
  loci: true,
  visualAssets: true,
  modelAssets: true,
  geneticPower: { include: { power: true } },
} as const;

@Injectable()
export class CreaturesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly visuals: CreatureVisualsService,
    private readonly geneticPowers: GeneticPowersService,
    private readonly cardArt: CardArtService,
  ) {}

  async chooseStarter(userId: string, speciesKey: string) {
    const character = await this.requireCharacter(userId);
    if (character.starterChosen) {
      throw Errors.starterChosen();
    }

    const seed = seedFromParts([character.id, speciesKey, "starter"]);
    const blueprint = generateCreatureBlueprint({
      seed,
      speciesKey,
      origin: "STARTER",
      name: speciesKey,
    });

    const result = await this.prisma.client.$transaction(async (tx) => {
      const locked = await tx.character.findUniqueOrThrow({ where: { id: character.id } });
      if (locked.starterChosen) {
        throw Errors.starterChosen();
      }
      const reserved = new Set<string>();
      const creature = await persistCreature(tx, character.id, blueprint, { reservedSignatures: reserved });
      const extras = await this.grantCompanions(
        tx,
        character.id,
        speciesKey,
        [creature.species.key],
        [creature],
        reserved,
      );
      await tx.partySlot.createMany({
        data: [creature, ...extras].slice(0, alphaConfig.partySize).map((row, slot) => ({
          characterId: character.id,
          slot,
          creatureId: row.id,
        })),
      });
      await tx.character.update({
        where: { id: character.id },
        data: { starterChosen: true },
      });
      const starter = activeEconomy().starting;
      await grantItem(tx, character.id, "nexorb", starter.nexOrbs, {
        source: economyConfig.ledgerSources.SYSTEM_GRANT,
        referenceId: creature.id,
      });
      await grantItem(tx, character.id, "nexorb_plus", starter.nexOrbPlus, {
        source: economyConfig.ledgerSources.SYSTEM_GRANT,
        referenceId: creature.id,
      });
      for (const key of ["first-spark", "first-hunt"] as const) {
        const quest = await tx.quest.findUnique({ where: { key } });
        if (quest) {
          await tx.questProgress.upsert({
            where: { characterId_questId: { characterId: character.id, questId: quest.id } },
            update: { status: "ACTIVE" },
            create: { characterId: character.id, questId: quest.id, status: "ACTIVE" },
          });
        }
      }
      return { starter: creature, spawned: [creature.id, ...extras.map((row) => row.id)] };
    });

    await this.visuals.enqueueBorn(result.spawned);
    return presentCreature(result.starter);
  }

  async list(userId: string) {
    const character = await this.requireCharacter(userId);
    if (character.starterChosen) {
      await this.replaceLegacyRoster(character.id);
      await this.ensureAlphaRoster(character.id);
      await this.alignOwnedCards(character.id);
    }
    const rows = await this.prisma.client.creature.findMany({
      where: { ownerCharacterId: character.id },
      include: creatureInclude,
      orderBy: { birthDate: "asc" },
    });
    return rows.map((row) => presentCreature(row as CreatureRecord));
  }

  async get(userId: string, creatureId: string) {
    const character = await this.requireCharacter(userId);
    const row = await this.prisma.client.creature.findFirst({
      where: { id: creatureId, ownerCharacterId: character.id },
      include: creatureInclude,
    });
    if (!row) {
      throw Errors.creatureNotFound();
    }
    await this.prisma.client.$transaction(async (tx) => {
      await alignCreatureLoci(tx, row as CreatureRecord);
      await ensureCreatureCardKit(tx, row as CreatureRecord);
    });
    const [father, mother] = await Promise.all([this.kin(row.fatherId, character.id), this.kin(row.motherId, character.id)]);
    const geneticPower = await this.geneticPowers.ensureForCreature(row as CreatureRecord);
    const kit = kitFromRecord(row as CreatureRecord);
    const cards = kit
      ? await this.cardArt.attachCreatureArts(row.id, presentKitCards(kit))
      : await this.cardArt.attachCreatureArts(row.id, geneticPower.cards);
    return {
      ...presentCreature(row as CreatureRecord),
      geneticPower: { ...geneticPower, cards },
      parents: {
        fatherId: row.fatherId,
        motherId: row.motherId,
        generation: row.generation,
        breederId: row.breederId,
        father,
        mother,
      },
    };
  }

  async cardKit(userId: string, creatureId: string) {
    const character = await this.requireCharacter(userId);
    const row = await this.prisma.client.creature.findFirst({
      where: { id: creatureId, ownerCharacterId: character.id },
      include: creatureInclude,
    });
    if (!row) {
      throw Errors.creatureNotFound();
    }
    const kit = await this.prisma.client.$transaction(async (tx) => {
      await alignCreatureLoci(tx, row as CreatureRecord);
      return ensureCreatureCardKit(tx, row as CreatureRecord);
    });
    return {
      creatureId: row.id,
      speciesKey: row.species.key,
      geneticHash: row.geneticHash,
      version: kit.version,
      cards: kit.cards.map((card) => ({
        locus: card.locus,
        role: card.locusRole,
        name: card.namePt,
        cost: card.cost,
        tier: card.tier,
        function: card.function,
        catalogKey: card.cardFamily,
        text: card.text,
        targetType: card.targetType,
        effects: card.effects,
        luckRoll: card.luckRoll,
        powerBudget: card.powerBudget,
        derivedFrom: card.derivedFrom,
      })),
    };
  }

  async genesisQueue(userId: string) {
    const character = await this.requireCharacter(userId);
    const rows = await this.prisma.client.creature.findMany({
      where: {
        ownerCharacterId: character.id,
        revealStatus: { in: ["PENDING_VISUAL", "READY_TO_REVEAL"] },
      },
      include: creatureInclude,
      orderBy: { birthDate: "asc" },
    });
    const items = rows.map((row) => {
      const payload = presentGenesisReveal(row as CreatureRecord);
      return {
        creatureId: payload.creatureId,
        revealStatus: payload.revealStatus,
        visual: { ...payload.visual, url: null, imageHash: null },
      };
    });
    return {
      count: items.length,
      pendingVisual: items.filter((row) => row.revealStatus === "PENDING_VISUAL").length,
      readyToReveal: items.filter((row) => row.revealStatus === "READY_TO_REVEAL").length,
      items,
    };
  }

  async evolutionQueue(userId: string) {
    const character = await this.requireCharacter(userId);
    const rows = await this.prisma.client.creature.findMany({
      where: { ownerCharacterId: character.id, evolutionStatus: "READY_TO_EVOLVE" },
      include: creatureInclude,
      orderBy: { birthDate: "asc" },
    });
    const items = rows.map((row) => {
      const presented = presentCreature(row as CreatureRecord);
      return {
        creatureId: presented.id,
        name: presented.name,
        speciesName: presented.speciesName,
        lifeStage: presented.lifeStage,
        nextLifeStage: presented.nextLifeStage,
        level: presented.level,
        maturation: presented.maturation,
      };
    });
    return { count: items.length, items };
  }

  async genesis(userId: string, creatureId: string) {
    const row = await this.requireOwned(userId, creatureId);
    const payload = presentGenesisReveal(row);
    if (!genesisPayloadHasNoSecrets(payload)) {
      throw Errors.validation("Payload de revelação inválido.");
    }
    const egg = await this.prisma.client.egg.findFirst({
      where: { hatchedCreatureId: row.id },
      select: { genesisGrade: true, powerPlanJson: true },
    });
    const power = await this.geneticPowers.ensureForCreature(row as CreatureRecord);
    const origin = (egg?.powerPlanJson as { originType?: string } | null)?.originType ?? power.originType;
    return {
      ...payload,
      element: row.elementPrimary,
      typology: power.typology,
      geneticPower: power.name,
      powerOrigin: origin,
      genesisGrade: egg?.genesisGrade ?? null,
      newGeneticPower: origin === "MUTATED_NEW",
    };
  }

  async reveal(userId: string, creatureId: string) {
    const row = await this.requireOwned(userId, creatureId);
    const status = revealStatusOf(row);
    if (status === "REVEALED" || status === "NOT_REQUIRED") {
      return presentCreature(row);
    }
    const visual = resolveRowVisual(row, { strictPreferred: currentVisualProvider() === "OPENAI" });
    const readyOfficial = status === "READY_TO_REVEAL" && visual.status === "READY" && Boolean(visual.url);
    if (!readyOfficial && !genesisCanConfirm(row)) {
      throw Errors.breedInvalid("Genesis ainda está formando.");
    }
    const updated = await this.prisma.client.creature.update({
      where: { id: row.id },
      data: { revealStatus: "REVEALED" },
      include: creatureInclude,
    });
    return presentCreature(updated as CreatureRecord);
  }

  async evolution(userId: string, creatureId: string) {
    const row = await this.requireOwned(userId, creatureId);
    return this.presentEvolution(row);
  }

  async evolve(userId: string, creatureId: string) {
    const row = await this.requireOwned(userId, creatureId);
    if (row.lock !== "NONE") {
      throw Errors.creatureLocked();
    }
    const progress = {
      level: row.level,
      xp: row.xp,
      lifeStage: row.lifeStage,
      evolutionStatus: row.evolutionStatus,
      maturationXp: row.maturationXp,
    };
    if (!canEvolve(progress)) {
      throw Errors.evolutionInvalid("Esta criatura ainda não está pronta para evoluir.");
    }
    const toStage = nextLifeStage(row.lifeStage);
    if (!toStage) {
      throw Errors.evolutionInvalid("Esta criatura já atingiu o estágio adulto.");
    }
    const fromStage = row.lifeStage;
    const fromVisual = presentCollectionVisual(row);
    await this.prisma.client.creature.update({
      where: { id: row.id },
      data: { evolutionStatus: "EVOLVING" },
    });
    try {
      await this.visuals.evolve(row.id, toStage);
    } catch (error) {
      await this.prisma.client.creature.update({
        where: { id: row.id },
        data: { evolutionStatus: "READY_TO_EVOLVE" },
      });
      throw error;
    }
    const updated = await this.requireOwned(userId, creatureId);
    await this.prisma.client.creature.update({
      where: { id: updated.id },
      data: { evolutionStatus: "NONE" },
    });
    const ready = await this.requireOwned(userId, creatureId);
    return {
      ...this.presentEvolution(ready, fromStage, fromVisual),
      evolved: true,
    };
  }

  private presentEvolution(
    row: CreatureRecord,
    fromStage?: string,
    fromVisual?: ReturnType<typeof presentCollectionVisual>,
  ) {
    const presented = presentCreature(row);
    const next = nextLifeStage(row.lifeStage);
    const origin = fromStage ?? (row.evolutionStatus === "READY_TO_EVOLVE" ? row.lifeStage : row.lifeStage);
    const target = fromStage ? row.lifeStage : (next && row.evolutionStatus === "READY_TO_EVOLVE" ? next : row.lifeStage);
    const from = fromVisual ?? presentCollectionVisual({ ...row, lifeStage: origin } as CreatureRecord);
    const to = presentCollectionVisual({ ...row, lifeStage: target } as CreatureRecord);
    return {
      creatureId: row.id,
      name: presented.name,
      speciesName: presented.speciesName,
      fromStage: origin,
      toStage: target,
      evolutionStatus: row.evolutionStatus,
      canEvolve: presented.canEvolve,
      maturation: presented.maturation,
      identity: {
        creatureId: row.id,
        geneticHash: row.geneticHash,
        geneticPower: presented.geneticPower,
        parents: { fatherId: row.fatherId, motherId: row.motherId },
        loci: presented.loci,
        lifeStage: row.lifeStage,
      },
      fromVisual: { status: from.status, lifeStage: from.lifeStage, url: from.url, imageHash: from.imageHash },
      toVisual: { status: to.status, lifeStage: to.lifeStage, url: to.url, imageHash: to.imageHash },
      model: presented.model,
    };
  }

  private async requireOwned(userId: string, creatureId: string) {
    const character = await this.requireCharacter(userId);
    const row = await this.prisma.client.creature.findFirst({
      where: { id: creatureId, ownerCharacterId: character.id },
      include: creatureInclude,
    });
    if (!row) {
      throw Errors.creatureNotFound();
    }
    return row as CreatureRecord;
  }

  async rename(userId: string, creatureId: string, rawName: string) {
    const character = await this.requireCharacter(userId);
    const name = parseCreatureName(rawName);
    const owned = await this.prisma.client.creature.findFirst({
      where: { id: creatureId, ownerCharacterId: character.id },
      select: { id: true, revealStatus: true },
    });
    if (!owned) {
      throw Errors.creatureNotFound();
    }
    if (owned.revealStatus === "PENDING_VISUAL" || owned.revealStatus === "READY_TO_REVEAL") {
      throw Errors.breedInvalid("Revele o Genesis antes de nomear esta criatura.");
    }
    await this.prisma.client.creature.update({
      where: { id: owned.id },
      data: { name },
    });
    return this.get(userId, owned.id);
  }

  async party(userId: string) {
    const character = await this.requireCharacter(userId);
    if (character.starterChosen) {
      await this.replaceLegacyRoster(character.id);
      await this.ensureAlphaRoster(character.id);
      await this.alignOwnedCards(character.id);
    }
    const slots = await this.prisma.client.partySlot.findMany({
      where: { characterId: character.id },
      include: { creature: { include: creatureInclude } },
      orderBy: { slot: "asc" },
    });
    for (const slot of slots) {
      await ensureCreatureCardKit(this.prisma.client, slot.creature as CreatureRecord);
    }
    const creatures = slots.map((slot) => presentCreature(slot.creature as CreatureRecord));
    const blueprints = slots.map((slot) => toBlueprint(slot.creature as CreatureRecord));
    const contributions = collectCardContributions(
      slots.map((slot) => ({
        blueprint: toBlueprint(slot.creature as CreatureRecord),
        creatureId: slot.creature.id,
      })),
    );
    const cards = [];
    for (const row of contributions) {
      const presented = row.resolved ? presentPlayableCard(row.resolved) : presentCard(row.definitionKey);
      let artUrl: string | null = null;
      let imageHash: string | null = null;
      try {
        const art = row.sourceCreatureId
          ? await this.cardArt.resolveCreatureReady(row.sourceCreatureId, row.definitionKey, row.locus)
          : await this.cardArt.resolveCanonical(row.definitionKey);
        artUrl = art.artUrl;
        imageHash = art.imageHash;
      } catch {
        artUrl = null;
        imageHash = null;
      }
      cards.push({
        ...presented,
        catalogKey: row.definitionKey,
        locus: row.locus ?? null,
        artUrl,
        imageHash,
        sourceCreatureId: row.sourceCreatureId ?? null,
      });
    }
    return {
      creatures,
      deck: collectCardPool(blueprints).slice(0, 16),
      cards,
      synergies: partySynergyLinks(
        slots.flatMap((slot) => {
          const manifest = (slot.creature as CreatureRecord).combatManifestJson;
          if (!manifest || typeof manifest !== "object") {
            return [];
          }
          return [
            {
              creatureId: slot.creature.id,
              name: slot.creature.name ?? slot.creature.id,
              manifest: manifest as never,
            },
          ];
        }),
      ),
    };
  }

  async setParty(userId: string, creatureIds: string[]) {
    const character = await this.requireCharacter(userId);
    const unique = [...new Set(creatureIds)];
    if (unique.length !== creatureIds.length) {
      throw Errors.partyInvalid("Party com criatura repetida.");
    }
    const owned = await this.prisma.client.creature.findMany({
      where: { ownerCharacterId: character.id, id: { in: unique } },
    });
    if (owned.length !== unique.length) {
      throw Errors.partyInvalid("Só é possível colocar criaturas próprias.");
    }
    if (owned.some((row) => row.lock !== "NONE")) {
      throw Errors.creatureLocked();
    }
    await this.prisma.client.$transaction(async (tx) => {
      await tx.partySlot.deleteMany({ where: { characterId: character.id } });
      await tx.partySlot.createMany({
        data: unique.map((creatureId, slot) => ({ characterId: character.id, slot, creatureId })),
      });
    });
    return this.party(userId);
  }

  async alignOwnedCards(characterId: string) {
    const rows = await this.prisma.client.creature.findMany({
      where: { ownerCharacterId: characterId },
      include: creatureInclude,
    });
    await this.prisma.client.$transaction(async (tx) => {
      for (const row of rows) {
        await alignCreatureLoci(tx, row as CreatureRecord);
        await ensureCreatureCardKit(tx, row as CreatureRecord);
      }
    });
  }

  async enqueueBornPublic(ids: string[]) {
    if (ids.length > 0) {
      await this.visuals.enqueueBorn(ids);
    }
  }

  async ensureAlphaRoster(characterId: string) {
    const ownedLite = await this.prisma.client.creature.findMany({
      where: { ownerCharacterId: characterId },
      select: { gender: true },
    });
    const slotCount = await this.prisma.client.partySlot.count({ where: { characterId } });
    const hasMale = ownedLite.some((row) => row.gender === "MALE");
    const hasFemale = ownedLite.some((row) => row.gender === "FEMALE");
    if (
      ownedLite.length >= alphaConfig.starterRosterSize &&
      slotCount >= alphaConfig.partySize &&
      hasMale &&
      hasFemale
    ) {
      return;
    }

    const spawned = await this.prisma.client.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`genoryx_roster_${characterId}`}))`;
      const owned = await tx.creature.findMany({
        where: { ownerCharacterId: characterId },
        include: { species: true },
        orderBy: { birthDate: "asc" },
      });
      const starterKey = owned[0]?.species.key ?? "pyron";
      const have = owned.map((row) => row.species.key);
      const extras = await this.grantCompanions(tx, characterId, starterKey, have, owned, new Set());
      owned.push(...extras);
      const unlocked = owned.filter((row) => row.lock === "NONE");
      const slots = await tx.partySlot.findMany({ where: { characterId } });
      const usedCreatures = new Set(slots.map((slot) => slot.creatureId));
      const usedSlots = new Set(slots.map((slot) => slot.slot));
      for (let slot = 0; slot < alphaConfig.partySize; slot += 1) {
        if (usedSlots.has(slot)) {
          continue;
        }
        const next = unlocked.find((row) => !usedCreatures.has(row.id));
        if (!next) {
          break;
        }
        await tx.partySlot.create({
          data: { characterId, slot, creatureId: next.id },
        });
        usedCreatures.add(next.id);
      }
      return extras.map((row) => row.id);
    });
    await this.visuals.enqueueBorn(spawned);
  }

  private companionsFor(speciesKey: string) {
    const table = alphaConfig.starterCompanions;
    return table[speciesKey as keyof typeof table] ?? table.pyron;
  }

  private async grantCompanions(
    tx: Parameters<typeof persistCreature>[0],
    characterId: string,
    starterKey: string,
    already: string[],
    owned: Array<{ gender: "MALE" | "FEMALE" }>,
    reserved: Set<string>,
  ) {
    const created: CreatureRecord[] = [];
    const seen = new Set(already);
    const queue = [
      ...this.companionsFor(starterKey),
      { speciesKey: "pyron", gender: "MALE" as const },
      { speciesKey: "nympha", gender: "FEMALE" as const },
      { speciesKey: "florune", gender: "FEMALE" as const },
      { speciesKey: "terranox", gender: "MALE" as const },
      { speciesKey: "pyron", gender: "FEMALE" as const },
      { speciesKey: "nympha", gender: "MALE" as const },
    ];

    const hasGender = (gender: "MALE" | "FEMALE") =>
      owned.some((row) => row.gender === gender) || created.some((row) => row.gender === gender);

    const spawn = async (speciesKey: string, gender: "MALE" | "FEMALE") => {
      const blueprint = generateCreatureBlueprint({
        seed: seedFromParts([characterId, speciesKey, gender, "alpha-roster"]),
        speciesKey,
        origin: "STARTER",
        name: speciesKey,
        gender,
      });
      const creature = await persistCreature(tx, characterId, blueprint, { reservedSignatures: reserved });
      created.push(creature as CreatureRecord);
      seen.add(speciesKey);
    };

    const fill = async (preferNewSpecies: boolean) => {
      for (const row of queue) {
        if (owned.length + created.length >= alphaConfig.starterRosterSize) {
          return;
        }
        if (preferNewSpecies && seen.has(row.speciesKey)) {
          continue;
        }
        const gender = !hasGender("MALE") ? "MALE" : !hasGender("FEMALE") ? "FEMALE" : row.gender;
        await spawn(row.speciesKey, gender);
      }
    };
    await fill(true);
    await fill(false);

    if (!hasGender("MALE")) {
      const speciesKey = queue.find((row) => !seen.has(row.speciesKey))?.speciesKey ?? "pyron";
      await spawn(speciesKey, "MALE");
    }
    if (!hasGender("FEMALE")) {
      const speciesKey = queue.find((row) => !seen.has(row.speciesKey))?.speciesKey ?? "nympha";
      await spawn(speciesKey, "FEMALE");
    }
    return created;
  }

  /**
   * Plantel anterior à fisionomia do chassi V1: sem `chassisSignature`.
   * Apaga as criaturas daquele jogador e entrega 5 aleatórias, cada uma
   * com fenótipo único no servidor. Capturas novas depois disso não passam daqui.
   */
  async replaceLegacyRoster(characterId: string) {
    const stale = await this.prisma.client.creature.count({
      where: { ownerCharacterId: characterId, chassisSignature: null },
    });
    if (stale === 0) {
      return;
    }
    const spawned = await this.prisma.client.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`genoryx_chassis_${characterId}`}))`;
      const still = await tx.creature.count({
        where: { ownerCharacterId: characterId, chassisSignature: null },
      });
      if (still === 0) {
        return [];
      }
      await this.purgeCharacterCreatures(tx, characterId);
      return this.grantRandomRoster(tx, characterId);
    });
    await this.visuals.enqueueBorn(spawned);
  }

  async reseedAllLegacyRosters() {
    const owners = await this.prisma.client.creature.findMany({
      where: { chassisSignature: null },
      select: { ownerCharacterId: true },
      distinct: ["ownerCharacterId"],
    });
    let characters = 0;
    let creatures = 0;
    for (const row of owners) {
      const before = await this.prisma.client.creature.count({ where: { ownerCharacterId: row.ownerCharacterId } });
      await this.replaceLegacyRoster(row.ownerCharacterId);
      characters += 1;
      creatures += before;
    }
    const admin = await this.prisma.client.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    if (admin) {
      await this.prisma.client.adminActionLog.create({
        data: {
          adminUserId: admin.id,
          action: "CHASSIS_ROSTER_RESEED",
          targetType: "CREATURE",
          payload: { characters, creaturesRemoved: creatures, grantedPerPlayer: alphaConfig.starterRosterSize },
          reason: "Alpha: fisionomia do chassi V1. Nenhuma criatura pode repetir o fenótipo.",
        },
      });
    }
    return { characters, creaturesRemoved: creatures, grantedPerPlayer: alphaConfig.starterRosterSize };
  }

  private async purgeCharacterCreatures(tx: Parameters<typeof persistCreature>[0], characterId: string) {
    const owned = await tx.creature.findMany({
      where: { ownerCharacterId: characterId },
      select: { id: true },
    });
    const ids = owned.map((row) => row.id);
    if (ids.length === 0) {
      return;
    }
    await tx.partySlot.deleteMany({ where: { characterId } });
    await tx.marketListing.updateMany({
      where: { creatureId: { in: ids } },
      data: { creatureId: null, status: "CANCELLED" },
    });
    const visualIds = (
      await tx.creatureVisualAsset.findMany({ where: { creatureId: { in: ids } }, select: { id: true } })
    ).map((row) => row.id);
    await tx.cardArtAsset.updateMany({
      where: {
        OR: [
          { creatureId: { in: ids } },
          ...(visualIds.length > 0 ? [{ sourceCreatureVisualAssetId: { in: visualIds } }] : []),
        ],
      },
      data: { creatureId: null, sourceCreatureVisualAssetId: null },
    });
    await tx.creatureModelAsset.deleteMany({ where: { creatureId: { in: ids } } });
    await tx.creatureVisualAsset.deleteMany({ where: { creatureId: { in: ids } } });
    await tx.creature.updateMany({
      where: { OR: [{ id: { in: ids } }, { fatherId: { in: ids } }, { motherId: { in: ids } }] },
      data: { fatherId: null, motherId: null },
    });
    await tx.egg.deleteMany({ where: { ownerCharacterId: characterId } });
    await tx.breedingSession.deleteMany({ where: { breederCharacterId: characterId } });
    await tx.creature.deleteMany({ where: { ownerCharacterId: characterId } });
  }

  private async grantRandomRoster(tx: Parameters<typeof persistCreature>[0], characterId: string) {
    const catalog = await tx.creatureSpecies.findMany({ select: { key: true }, orderBy: { key: "asc" } });
    const species = catalog.map((row) => row.key);
    const reserved = new Set<string>();
    const created: string[] = [];
    const genders: Array<"MALE" | "FEMALE"> = ["MALE", "FEMALE", "MALE", "FEMALE", "MALE"];
    for (let slot = 0; slot < alphaConfig.starterRosterSize; slot += 1) {
      const speciesKey = species[seedFromParts([characterId, "species", slot]) % species.length] ?? "pyron";
      const gender = genders[slot] ?? (slot % 2 === 0 ? "MALE" : "FEMALE");
      const blueprint = generateCreatureBlueprint({
        seed: seedFromParts([characterId, "chassis-v1", slot, speciesKey, gender]),
        speciesKey,
        origin: "STARTER",
        name: speciesKey,
        gender,
      });
      const creature = await persistCreature(tx, characterId, blueprint, { reservedSignatures: reserved });
      created.push(creature.id);
      if (slot < alphaConfig.partySize) {
        await tx.partySlot.create({
          data: { characterId, slot, creatureId: creature.id },
        });
      }
    }
    return created;
  }

  private async kin(creatureId: string | null, ownerCharacterId: string) {
    if (!creatureId) {
      return null;
    }
    const row = await this.prisma.client.creature.findUnique({
      where: { id: creatureId },
      include: creatureInclude,
    });
    if (!row) {
      return null;
    }
    return presentKin(row as CreatureRecord, row.ownerCharacterId === ownerCharacterId);
  }

  private async requireCharacter(userId: string) {
    const character = await this.prisma.client.character.findUnique({ where: { userId } });
    if (!character) {
      throw Errors.characterNotFound();
    }
    return character;
  }

}
