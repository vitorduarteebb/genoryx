import { Injectable, Logger } from "@nestjs/common";
import { activeEconomy, alphaConfig, economyConfig, geneticPowerConfig, genomeCatalystKey } from "@nexora/config";
import {
  backfillGeneticPower,
  breedingCostGold,
  calculateBreeding,
  calculateCrossPotential,
  createSeededRandom,
  deriveEggVisualGenome,
  inheritGeneticPower,
  isReservedOffspringName,
  normalizeOffspringName,
  parentPotentialFromBlueprint,
  priorBreedsFromFertility,
  seedFromParts,
  uniqueOffspringName,
  type CreatureBlueprint,
  type PowerAssignment,
} from "@nexora/game-engine";
import type { Prisma } from "@nexora/database";
import { persistCreature, toBlueprint, type CreatureRecord } from "../../common/creature-io";
import { canUseRevealedCreature, presentCollectionVisual, revealStatusOf } from "../../common/creature-visual-present";
import { Errors } from "../../common/errors/app-error";
import { consumeItem, countItem } from "../../common/inventory";
import { debitWallet } from "../../common/ledger";
import { PrismaService } from "../../prisma/prisma.service";
import { officialImageJobsEnabled } from "../creature-visuals/generation-key";
import { CreatureVisualsService } from "../creature-visuals/creature-visuals.service";
import { EggVisualsService } from "../egg-visuals/egg-visuals.service";
import { GeneticPowersService } from "../genetic-powers/genetic-powers.service";
import { presentCrossPotential, presentGeneticIdentity, presentParentSummary } from "./breeding.present";

const include = {
  species: true,
  mutation: true,
  loci: true,
  visualAssets: true,
  modelAssets: true,
  geneticPower: { include: { power: true, lineage: true } },
} as const;

@Injectable()
export class BreedingService {
  private readonly log = new Logger(BreedingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly visuals: CreatureVisualsService,
    private readonly eggVisuals: EggVisualsService,
    private readonly geneticPowers: GeneticPowersService,
  ) {}

  async preview(userId: string, parentAId: string, parentBId: string) {
    const { parentA, parentB, costGold, blueprintA, blueprintB, character } = await this.validatePair(
      userId,
      parentAId,
      parentBId,
    );
    const identityA = presentGeneticIdentity(parentA);
    const identityB = presentGeneticIdentity(parentB);
    const cross = calculateCrossPotential(
      parentPotentialFromBlueprint(blueprintA, { typology: identityA?.typology }),
      parentPotentialFromBlueprint(blueprintB, { typology: identityB?.typology }),
    );
    const catalystRequired = activeEconomy().breeding.catalystRequired;
    const catalystOwned = await countItem(this.prisma.client, character.id, genomeCatalystKey);
    return {
      compatible: true,
      costGold: costGold.toString(),
      catalystRequired,
      catalystOwned,
      fertilityA: parentA.fertility,
      fertilityB: parentB.fertility,
      fertilityAfterA: parentA.fertility - 1,
      fertilityAfterB: parentB.fertility - 1,
      generation: Math.max(parentA.generation, parentB.generation) + 1,
      crossPotential: presentCrossPotential(cross),
      parentA: presentParentSummary(parentA),
      parentB: presentParentSummary(parentB),
    };
  }

  async breed(userId: string, parentAId: string, parentBId: string) {
    const { parentA, parentB, costGold, blueprintA, blueprintB, character } = await this.validatePair(
      userId,
      parentAId,
      parentBId,
    );
    const seed = seedFromParts([character.id, parentAId, parentBId, Date.now()]);
    const draft = calculateBreeding({ seed, parentA: blueprintA, parentB: blueprintB });
    const powerPlan = this.planPower(blueprintA, blueprintB, parentA, parentB, seed, draft.offspring.elementPrimary);
    const result = calculateBreeding({
      seed,
      parentA: blueprintA,
      parentB: blueprintB,
      powerOrigin: powerPlan?.originType === "MUTATED_NEW" ? "NEW" : powerPlan ? "INHERITED" : "NONE",
    });
    const eggVisual = deriveEggVisualGenome({
      child: result.offspring,
      parentA: blueprintA,
      parentB: blueprintB,
      genesisGrade: result.genesisGrade,
      powerOrigin: powerPlan?.originType === "MUTATED_NEW" ? "NEW" : powerPlan ? "INHERITED" : "NONE",
    });
    const started = new Date();
    const hatchesAt = new Date(started.getTime() + result.hatchInMs);

    const egg = await this.prisma.client.$transaction(async (tx) => {
      const freshA = await tx.creature.findUniqueOrThrow({ where: { id: parentAId } });
      const freshB = await tx.creature.findUniqueOrThrow({ where: { id: parentBId } });
      if (freshA.lock !== "NONE" || freshB.lock !== "NONE") {
        throw Errors.creatureLocked();
      }
      if (freshA.fertility <= 0 || freshB.fertility <= 0) {
        throw Errors.breedInvalid("Pai ou mãe sem fertilidade.");
      }
      const session = await tx.breedingSession.create({
        data: {
          breederCharacterId: character.id,
          parentAId,
          parentBId,
          costGold,
          rngSeed: seed,
          status: "PENDING",
        },
      });
      if (costGold > 0n) {
        await debitWallet(tx, {
          userId,
          currency: "GOLD",
          amount: costGold,
          source: economyConfig.ledgerSources.BREEDING_COST,
          referenceId: session.id,
        });
      }
      await consumeItem(tx, character.id, genomeCatalystKey, activeEconomy().breeding.catalystRequired, {
        source: economyConfig.ledgerSources.BREEDING_COST,
        referenceId: session.id,
      });
      await tx.creature.update({
        where: { id: parentAId },
        data: { fertility: { decrement: 1 }, lock: "NONE" },
      });
      await tx.creature.update({
        where: { id: parentBId },
        data: { fertility: { decrement: 1 }, lock: "NONE" },
      });
      await tx.breedingSession.update({
        where: { id: session.id },
        data: { status: "COMPLETED" },
      });
      const taken = await this.takenOffspringNames(tx);
      const offspring = { ...result.offspring, name: uniqueOffspringName(seed, taken) };
      return tx.egg.create({
        data: {
          ownerCharacterId: character.id,
          rarity: result.rarity,
          status: "INCUBATING",
          hatchesAt,
          incubationStartedAt: started,
          breedingSessionId: session.id,
          generation: result.offspring.generation,
          geneticSeed: seed,
          geneticHash: result.offspring.geneticHash,
          parentAId,
          parentBId,
          speciesKey: offspring.speciesKey,
          offspringJson: offspring,
          genesisGrade: result.genesisGrade,
          complexityScore: result.complexityScore,
          eggVisualStatus: "PENDING",
          eggVisualJson: eggVisual,
          powerPlanJson: powerPlan ?? undefined,
        },
      });
    });

    try {
      await this.eggVisuals.enqueue(egg.id);
    } catch (error) {
      this.log.warn(error instanceof Error ? error.message : "enqueue ovo falhou; breeding mantido");
    }

    return {
      eggId: egg.id,
      generation: egg.generation,
      genesisGrade: egg.genesisGrade,
      incubationStartedAt: egg.incubationStartedAt,
      hatchAt: egg.hatchesAt,
      eggVisualStatus: egg.eggVisualStatus,
      costGold: costGold.toString(),
    };
  }

  async eggs(userId: string) {
    const character = await this.requireCharacter(userId);
    const rows = await this.prisma.client.egg.findMany({
      where: { ownerCharacterId: character.id },
      include: { visualAssets: true },
      orderBy: { createdAt: "desc" },
    });
    const parentIds = [...new Set(rows.flatMap((row) => [row.parentAId, row.parentBId]).filter(Boolean))];
    const parents = await this.prisma.client.creature.findMany({
      where: { id: { in: parentIds } },
      include,
    });
    const byId = new Map(parents.map((row) => [row.id, row as CreatureRecord]));
    const now = Date.now();
    return rows.map((egg) => this.presentEgg(egg, byId, now));
  }

  async history(userId: string) {
    const character = await this.requireCharacter(userId);
    const sessions = await this.prisma.client.breedingSession.findMany({
      where: { breederCharacterId: character.id },
      include: { egg: { include: { visualAssets: true } } },
      orderBy: { createdAt: "desc" },
      take: 40,
    });
    const parentIds = [...new Set(sessions.flatMap((row) => [row.parentAId, row.parentBId]))];
    const childIds = sessions.map((row) => row.egg?.hatchedCreatureId).filter((id): id is string => Boolean(id));
    const creatures = await this.prisma.client.creature.findMany({
      where: { id: { in: [...parentIds, ...childIds] } },
      include,
    });
    const byId = new Map(creatures.map((row) => [row.id, row as CreatureRecord]));
    const now = Date.now();
    return sessions.map((session) => ({
      id: session.id,
      createdAt: session.createdAt,
      costGold: session.costGold.toString(),
      parentA: byId.get(session.parentAId) ? presentParentSummary(byId.get(session.parentAId)!) : { id: session.parentAId },
      parentB: byId.get(session.parentBId) ? presentParentSummary(byId.get(session.parentBId)!) : { id: session.parentBId },
      egg: session.egg ? this.presentEgg(session.egg, byId, now) : null,
      child: session.egg?.hatchedCreatureId && byId.get(session.egg.hatchedCreatureId)
        ? {
            id: session.egg.hatchedCreatureId,
            name: byId.get(session.egg.hatchedCreatureId)!.name,
            speciesName: byId.get(session.egg.hatchedCreatureId)!.species.name,
          }
        : null,
    }));
  }

  async hatch(userId: string, eggId: string) {
    const character = await this.requireCharacter(userId);
    const planned = await this.prisma.client.egg.findFirst({
      where: { id: eggId, ownerCharacterId: character.id },
      select: { powerPlanJson: true, genesisGrade: true },
    });
    const hatched = await this.prisma.client.$transaction(async (tx) => {
      const egg = await tx.egg.findFirst({ where: { id: eggId, ownerCharacterId: character.id } });
      if (!egg || egg.status === "HATCHED") {
        throw Errors.breedInvalid("Ovo inválido.");
      }
      if (egg.hatchesAt.getTime() > Date.now()) {
        throw Errors.breedInvalid("Incubação ainda não terminou.");
      }
      const draft = egg.offspringJson as unknown as CreatureBlueprint;
      const taken = await this.takenOffspringNames(tx, egg.id);
      const preferred = draft.name;
      const keep =
        preferred &&
        !isReservedOffspringName(preferred) &&
        !taken.has(normalizeOffspringName(preferred));
      const offspring = {
        ...draft,
        name: keep ? preferred : uniqueOffspringName(egg.geneticSeed, taken),
      };
      const creature = await persistCreature(tx, character.id, offspring, {
        fatherId: egg.parentAId,
        motherId: egg.parentBId,
        breederId: character.id,
      });
      await tx.egg.update({
        where: { id: egg.id },
        data: { status: "HATCHED", hatchedCreatureId: creature.id },
      });
      return creature;
    });
    await this.geneticPowers.assignOnHatch(
      hatched as CreatureRecord,
      hatched.fatherId,
      hatched.motherId,
      planned?.powerPlanJson as PowerAssignment | null,
    );
    if (officialImageJobsEnabled()) {
      await this.visuals.enqueueBorn([hatched.id]);
    }
    const visual = presentCollectionVisual(hatched);
    return {
      status: "AWAITING_GENESIS_REVEAL" as const,
      creatureId: hatched.id,
      revealStatus: revealStatusOf(hatched),
      genesisGrade: planned?.genesisGrade ?? null,
      visual,
    };
  }

  private presentEgg(
    egg: {
      id: string;
      status: string;
      hatchesAt: Date;
      incubationStartedAt?: Date;
      genesisGrade: string;
      generation: number;
      parentAId: string;
      parentBId: string;
      createdAt: Date;
      eggVisualStatus: string;
      visualAssets?: Array<{ id: string; status: string; publicUrl: string | null; imageHash: string | null }>;
      hatchedCreatureId?: string | null;
    },
    parents: Map<string, CreatureRecord>,
    now: number,
  ) {
    const ready = egg.status === "INCUBATING" && egg.hatchesAt.getTime() <= now ? "READY" : egg.status;
    const visual = this.eggVisuals.presentPublic(egg);
    const parentA = parents.get(egg.parentAId);
    const parentB = parents.get(egg.parentBId);
    return {
      eggId: egg.id,
      id: egg.id,
      status: ready,
      genesisGrade: egg.genesisGrade,
      hatchAt: egg.hatchesAt,
      incubationStartedAt: egg.incubationStartedAt ?? egg.createdAt,
      generation: egg.generation,
      eggVisualStatus: visual.visualStatus,
      visualUrl: visual.visualUrl,
      imageHash: visual.imageHash,
      parentA: parentA ? { name: parentA.name ?? parentA.species.name, speciesName: parentA.species.name, speciesKey: parentA.species.key } : null,
      parentB: parentB ? { name: parentB.name ?? parentB.species.name, speciesName: parentB.species.name, speciesKey: parentB.species.key } : null,
    };
  }

  private planPower(
    blueprintA: CreatureBlueprint,
    blueprintB: CreatureBlueprint,
    parentA: CreatureRecord,
    parentB: CreatureRecord,
    seed: number,
    childElement: CreatureBlueprint["elementPrimary"],
  ): PowerAssignment | null {
    if (!geneticPowerConfig.enabled) {
      return null;
    }
    const father = this.powerSource(parentA, blueprintA);
    const mother = this.powerSource(parentB, blueprintB);
    const rng = createSeededRandom(seedFromParts([seed, blueprintA.geneticHash, blueprintB.geneticHash, "power"]));
    return inheritGeneticPower({
      rng,
      childId: `pending:${seed}`,
      childElement,
      parentA: father,
      parentB: mother,
    });
  }

  private powerSource(row: CreatureRecord, blueprint: CreatureBlueprint) {
    const stored = (row as CreatureRecord & {
      geneticPower?: { lineageId: string; power: { definitionJson: PowerAssignment["genome"] } } | null;
    }).geneticPower;
    if (stored?.power) {
      return {
        genome: stored.power.definitionJson,
        lineageId: stored.lineageId,
        creatureId: row.id,
      };
    }
    const fallback = backfillGeneticPower({
      creatureId: row.id,
      speciesKey: blueprint.speciesKey,
      element: blueprint.elementPrimary,
      geneticHash: blueprint.geneticHash,
    });
    return { genome: fallback.genome, lineageId: fallback.lineageId, creatureId: row.id };
  }

  private async takenOffspringNames(tx: Prisma.TransactionClient, exceptEggId?: string) {
    const [creatures, species, eggs] = await Promise.all([
      tx.creature.findMany({ select: { name: true } }),
      tx.creatureSpecies.findMany({ select: { key: true, name: true } }),
      tx.egg.findMany({ where: { status: "INCUBATING" }, select: { id: true, offspringJson: true } }),
    ]);
    const taken = new Set<string>();
    for (const row of creatures) {
      if (row.name) taken.add(normalizeOffspringName(row.name));
    }
    for (const row of species) {
      taken.add(normalizeOffspringName(row.key));
      taken.add(normalizeOffspringName(row.name));
    }
    for (const egg of eggs) {
      if (egg.id === exceptEggId) continue;
      const stored = egg.offspringJson as { name?: string } | null;
      if (stored?.name) taken.add(normalizeOffspringName(stored.name));
    }
    return taken;
  }

  private async validatePair(userId: string, parentAId: string, parentBId: string) {
    const character = await this.requireCharacter(userId);
    if (!character.starterChosen) {
      throw Errors.starterRequired();
    }
    if (character.level < alphaConfig.breedingUnlockLevel) {
      throw Errors.breedInvalid("Nível insuficiente.");
    }
    if (parentAId === parentBId) {
      throw Errors.breedInvalid("Não é possível cruzar a mesma criatura.");
    }
    const rows = await this.prisma.client.creature.findMany({
      where: { id: { in: [parentAId, parentBId] }, ownerCharacterId: character.id },
      include,
    });
    if (rows.length !== 2) {
      throw Errors.breedInvalid("O pai e a mãe precisam ser seus.");
    }
    const parentA = rows.find((row) => row.id === parentAId)! as CreatureRecord;
    const parentB = rows.find((row) => row.id === parentBId)! as CreatureRecord;
    if (parentA.gender !== "MALE") {
      throw Errors.breedInvalid("O pai precisa ser macho.");
    }
    if (parentB.gender !== "FEMALE") {
      throw Errors.breedInvalid("A mãe precisa ser fêmea.");
    }
    if (parentA.lock !== "NONE" || parentB.lock !== "NONE") {
      throw Errors.creatureLocked();
    }
    if (parentA.fertility <= 0 || parentB.fertility <= 0) {
      throw Errors.breedInvalid("Pai ou mãe sem fertilidade.");
    }
    if (
      officialImageJobsEnabled() &&
      (!canUseRevealedCreature(revealStatusOf(parentA)) || !canUseRevealedCreature(revealStatusOf(parentB)))
    ) {
      throw Errors.breedInvalid("Revele o Genesis antes de cruzar esta criatura.");
    }
    const blueprintA = toBlueprint(parentA);
    const blueprintB = toBlueprint(parentB);
    return {
      character,
      parentA,
      parentB,
      blueprintA,
      blueprintB,
      costGold: BigInt(
        breedingCostGold(priorBreedsFromFertility(parentA.fertility), priorBreedsFromFertility(parentB.fertility)),
      ),
    };
  }

  private async requireCharacter(userId: string) {
    const character = await this.prisma.client.character.findUnique({ where: { userId } });
    if (!character) {
      throw Errors.characterNotFound();
    }
    return character;
  }
}
