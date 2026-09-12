import { randomUUID } from "node:crypto";
import {
  assemblePhenotype,
  CARD_GEN_VERSION,
  cardBelongsToSpecies,
  cardsForLocus,
  creatureLifeStageConfig,
  getCardDefinition,
  isRevealHidden,
    maturationProgress,
    nextLifeStage,
    seedPowerForSpecies,
    speciesElements,
    speciesVisuals,
    explainPersonalResource,
} from "@nexora/config";
import type {
  Creature,
  CreatureLocus,
  CreatureModelAsset,
  CreatureSpecies,
  CreatureVisualAsset,
  Mutation,
  Prisma,
} from "@nexora/database";
import { officialImageJobsEnabled } from "../modules/creature-visuals/generation-key";
import {
  assembleCreatureCardKit,
  assembleVisualGenome,
  hydratePersonalResource,
  canEvolve,
  chassisSignature,
  deriveVisualSeed,
  expressionFromCard,
  isCardKitManifest,
  parseChassisDna,
  rollChassisDna,
  withUniqueChassis,
  xpToReachLevel,
  type CardKitManifest,
  type ChassisDna,
  type CreatureBlueprint,
  type CreatureCardKit,
  type CreatureVisualGenome,
  type LocusBlueprint,
} from "@nexora/game-engine";
import {
  GENETIC_CARD_LOCI,
  type CreatureRevealStatus,
  type GeneKey,
  type GeneRank,
  type Element,
  type GeneticCardExpression,
  type GeneticCardLocusKey,
  type Temperament,
} from "@nexora/types";
import { presentModel } from "./creature-model-present";
import { officialVisualPending, presentCollectionVisual, revealStatusOf } from "./creature-visual-present";

type Tx = Prisma.TransactionClient;

export type CreatureRecord = Creature & {
  species: CreatureSpecies;
  mutation: Mutation | null;
  loci: CreatureLocus[];
  visualAssets?: CreatureVisualAsset[];
  modelAssets?: CreatureModelAsset[];
  geneticPower?: {
    lineageId: string;
    originType: string;
    power: { namePt: string; name: string; typology: string; element: string; key: string; definitionJson?: unknown };
  } | null;
};

export function toBlueprint(row: CreatureRecord): CreatureBlueprint {
  return {
    speciesKey: row.species.key,
    name: row.name ?? row.species.name,
    gender: row.gender,
    generation: row.generation,
    origin: row.origin,
    level: row.level,
    fertility: row.fertility,
    elementPrimary: row.elementPrimary,
    elementSecondary: row.elementSecondary ?? undefined,
    genes: {
      HP: row.hpGene,
      ATK: row.attackGene,
      DEF: row.defenseGene,
      MAG: row.magicGene,
      RES: row.resistanceGene,
      SPD: row.speedGene,
      CRIT: row.critGene,
      CRIT_DAMAGE: row.critDamageGene,
      PRECISION: row.precisionGene,
      EVASION: row.evasionGene,
      STATUS: row.statusGene,
    },
    bodyPlanExpressed: row.bodyPlanExpressed,
    bodyPlanRecessive: row.bodyPlanRecessive,
    headExpressed: row.headExpressed,
    headRecessive: row.headRecessive,
    mutationKey: row.mutation?.key,
    geneticPurity: Number(row.geneticPurity),
    geneticHash: row.geneticHash,
    genesisSeed: row.genesisSeed,
    loci: row.loci.map((locus) => ({
      locusKey: locus.locusKey as GeneticCardLocusKey,
      expressed: locus.expressedJson as unknown as GeneticCardExpression,
      recessive: locus.recessiveJson as unknown as GeneticCardExpression,
    })),
    fatherId: row.fatherId ?? undefined,
    motherId: row.motherId ?? undefined,
    tags: [...(speciesVisuals[row.species.key]?.tags ?? [])],
    lifeStage: row.lifeStage,
    chassis: presentChassis(row) ?? undefined,
    combatManifest: (row.combatManifestJson as CreatureBlueprint["combatManifest"]) ?? undefined,
  };
}

export async function persistCreature(
  tx: Tx,
  ownerCharacterId: string,
  blueprint: CreatureBlueprint,
  extras?: {
    fatherId?: string;
    motherId?: string;
    breederId?: string;
    temperament?: Temperament;
    revealStatus?: CreatureRevealStatus;
    reservedSignatures?: Set<string>;
  },
) {
  const species = await tx.creatureSpecies.findUniqueOrThrow({ where: { key: blueprint.speciesKey } });
  const mutation = blueprint.mutationKey
    ? await tx.mutation.findUnique({ where: { key: blueprint.mutationKey } })
    : null;

  const id = randomUUID();
  const visualSeed = deriveVisualSeed(id, blueprint.geneticHash);
  const revealStatus: CreatureRevealStatus =
    extras?.revealStatus ??
    (blueprint.origin === "BRED" ? (officialImageJobsEnabled() ? "PENDING_VISUAL" : "REVEALED") : "NOT_REQUIRED");
  const chassis = await claimUniqueChassis(tx, blueprint, extras?.reservedSignatures);
  extras?.reservedSignatures?.add(chassisSignature(chassis));
  const genome = assembleVisualGenome({
    creatureId: id,
    speciesKey: blueprint.speciesKey,
    bodyPlanExpressed: blueprint.bodyPlanExpressed,
    bodyPlanRecessive: blueprint.bodyPlanRecessive,
    headExpressed: blueprint.headExpressed,
    headRecessive: blueprint.headRecessive,
    geneticHash: blueprint.geneticHash,
    genesisSeed: blueprint.genesisSeed % 2147483647,
    lifeStage: "BABY",
    mutationKey: blueprint.mutationKey,
    expressedCardKeys: blueprint.loci.map((locus) => locus.expressed.cardFamily),
    temperament: extras?.temperament,
    visualSeed,
    chassis,
  });

  return tx.creature.create({
    data: {
      id,
      ownerCharacterId,
      speciesId: species.id,
      name: blueprint.name,
      level: blueprint.level,
      gender: blueprint.gender,
      generation: blueprint.generation,
      fatherId: extras?.fatherId ?? blueprint.fatherId,
      motherId: extras?.motherId ?? blueprint.motherId,
      breederId: extras?.breederId,
      fertility: blueprint.fertility,
      elementPrimary: blueprint.elementPrimary,
      elementSecondary: blueprint.elementSecondary,
      hpGene: blueprint.genes.HP,
      attackGene: blueprint.genes.ATK,
      defenseGene: blueprint.genes.DEF,
      magicGene: blueprint.genes.MAG,
      resistanceGene: blueprint.genes.RES,
      speedGene: blueprint.genes.SPD,
      critGene: blueprint.genes.CRIT,
      critDamageGene: blueprint.genes.CRIT_DAMAGE,
      precisionGene: blueprint.genes.PRECISION,
      evasionGene: blueprint.genes.EVASION,
      statusGene: blueprint.genes.STATUS,
      mutationId: mutation?.id,
      geneticPurity: blueprint.geneticPurity,
      origin: blueprint.origin,
      geneticHash: blueprint.geneticHash,
      genesisSeed: blueprint.genesisSeed % 2147483647,
      bodyPlanExpressed: blueprint.bodyPlanExpressed,
      bodyPlanRecessive: blueprint.bodyPlanRecessive,
      headExpressed: blueprint.headExpressed,
      headRecessive: blueprint.headRecessive,
      lifeStage: "BABY",
      temperament: genome.temperament,
      visualSeed,
      visualStatus: "PENDING",
      visualGenomeJson: genome,
      chassisSignature: chassisSignature(chassis),
      revealStatus,
      geneticEngineVersion: blueprint.combatManifest?.engineVersion,
      combatManifestJson: blueprint.combatManifest ? JSON.parse(JSON.stringify(blueprint.combatManifest)) : undefined,
      loci: {
        create: blueprint.loci.map((locus: LocusBlueprint) => ({
          locusKey: locus.locusKey,
          expressedCardKey: locus.expressed.cardFamily,
          recessiveCardKey: locus.recessive.cardFamily,
          expressedJson: locus.expressed,
          recessiveJson: locus.recessive,
        })),
      },
    },
    include: { species: true, mutation: true, loci: true, visualAssets: true },
  });
}

export function presentCreature(row: CreatureRecord) {
  const revealStatus = revealStatusOf(row);
  const hidden = isRevealHidden(revealStatus);
  const visual = presentCollectionVisual(row);
  const genes = Object.fromEntries(
    (
      [
        ["HP", row.hpGene],
        ["ATK", row.attackGene],
        ["DEF", row.defenseGene],
        ["MAG", row.magicGene],
        ["RES", row.resistanceGene],
        ["SPD", row.speedGene],
        ["CRIT", row.critGene],
        ["EVA", row.evasionGene],
        ["STATUS", row.statusGene],
      ] as Array<[GeneKey | "EVA", GeneRank]>
    ).map(([key, value]) => [key, value]),
  );
  return {
    id: row.id,
    speciesKey: hidden ? null : row.species.key,
    speciesName: hidden ? "???" : row.species.name,
    name: hidden ? "???" : (row.name ?? row.species.name),
    genesisSeed: hidden ? 0 : row.genesisSeed,
    phenotype: hidden
      ? null
      : assemblePhenotype({
          speciesKey: row.species.key,
          bodyPlan: row.bodyPlanExpressed,
          head: row.headExpressed,
          element: row.elementPrimary,
          seed: row.genesisSeed,
        }),
    gender: row.gender,
    level: hidden ? 1 : row.level,
    xp: hidden ? 0 : row.xp,
    generation: hidden ? 0 : row.generation,
    fertility: row.fertility,
    origin: row.origin,
    lock: row.lock,
    mutation: hidden ? null : (row.mutation?.key ?? null),
    bodyPlan: hidden ? null : row.bodyPlanExpressed,
    bodyPlanRecessive: hidden ? null : row.bodyPlanRecessive,
    head: hidden ? null : row.headExpressed,
    headRecessive: hidden ? null : row.headRecessive,
    elementPrimary: row.elementPrimary,
    elementSecondary: hidden ? null : row.elementSecondary,
    geneticHash: hidden ? null : row.geneticHash,
    lifeStage: row.lifeStage,
    evolutionStatus: row.evolutionStatus ?? "NONE",
    nextLifeStage: nextLifeStage(row.lifeStage),
    canEvolve: hidden
      ? false
      : canEvolve({
          level: row.level,
          xp: row.xp,
          lifeStage: row.lifeStage,
          evolutionStatus: row.evolutionStatus ?? "NONE",
          maturationXp: row.maturationXp ?? 0,
        }),
    xpToNext: hidden ? 0 : Math.max(0, xpToReachLevel(row.level + 1) - row.xp),
    maturation: hidden ? null : presentMaturation(row),
    temperament: row.temperament,
    visualStatus: visual.status,
    visualSeed: row.visualSeed,
    visualJob: visual.source === "forming" || officialVisualPending(row),
    portraitUrl: visual.url,
    imageHash: visual.imageHash,
    visual,
    chassis: presentChassis(row),
    model: presentModel(row),
    revealStatus,
    fatherId: hidden ? null : row.fatherId,
    motherId: hidden ? null : row.motherId,
    breederId: hidden ? null : row.breederId,
    birthDate: row.birthDate,
    geneticPurity: hidden ? null : Number(row.geneticPurity),
    physical: hidden ? null : presentPhysical(row),
    genes: hidden ? {} : genes,
    combatIdentity: hidden || !row.combatManifestJson ? null : presentCombatIdentity(row.combatManifestJson),
    loci: hidden
      ? []
      : row.loci.map((locus) => ({
          key: locus.locusKey,
          expressed: locus.expressedCardKey,
          recessive: locus.recessiveCardKey,
          expressedName: isCardKitManifest(locus.expressedJson) ? locus.expressedJson.namePt : undefined,
          expressedText: isCardKitManifest(locus.expressedJson) ? locus.expressedJson.text : undefined,
          cost: isCardKitManifest(locus.expressedJson) ? locus.expressedJson.cost : undefined,
          sourceGenes: isCardKitManifest(locus.expressedJson) ? locus.expressedJson.sourceGenes ?? [] : [],
          luckVariant: isCardKitManifest(locus.expressedJson) ? locus.expressedJson.luckVariant ?? null : null,
        })),
    geneticPower: hidden
      ? null
      : row.geneticPower
        ? {
            name: row.geneticPower.power.namePt,
            typology: row.geneticPower.power.typology,
            element: row.geneticPower.power.element,
            lineageId: row.geneticPower.lineageId,
            originType: row.geneticPower.originType,
          }
        : seedPowerForSpecies(row.species.key)
          ? {
              name: seedPowerForSpecies(row.species.key)!.namePt,
              typology: seedPowerForSpecies(row.species.key)!.typology,
              element: seedPowerForSpecies(row.species.key)!.element,
              lineageId: null,
              originType: "GENESIS",
            }
          : null,
  };
}

function presentMaturation(row: CreatureRecord) {
  const progress = maturationProgress(row.lifeStage, row.maturationXp ?? 0);
  const next = nextLifeStage(row.lifeStage);
  const levelRequired = next ? creatureLifeStageConfig.minLevel[next] : row.level;
  const state = row.lifeStage === "ADULT" ? "MATURE" : row.evolutionStatus === "READY_TO_EVOLVE" ? "READY" : progress.state;
  return {
    xp: progress.current,
    current: progress.current,
    target: progress.target,
    ratio: progress.ratio,
    state,
    readyToEvolveAt: row.readyToEvolveAt ?? null,
    label: row.lifeStage === "ADULT" ? "Mature" : `${Math.round(progress.ratio * 100)}%`,
    requirements: {
      level: { current: row.level, required: levelRequired, met: row.level >= levelRequired },
      maturation: { current: progress.current, required: progress.target, met: progress.ratio >= 1 },
    },
  };
}

function presentChassis(row: CreatureRecord) {
  return (
    parseChassisDna((row.visualGenomeJson as { chassis?: unknown } | null)?.chassis) ??
    rollChassisDna({ seed: row.genesisSeed, lifeStage: row.lifeStage, salt: row.id })
  );
}

function presentPhysical(row: CreatureRecord) {
  const genome = (row.visualGenomeJson ?? {}) as Partial<CreatureVisualGenome>;
  const chassis = parseChassisDna(genome.chassis);
  return {
    body: chassis ? chassis.body.d : row.bodyPlanExpressed,
    head: chassis ? chassis.head.d : row.headExpressed,
    eyes: chassis?.eyes.d ?? genome.eyeType?.expressed ?? null,
    horns: chassis?.horns.d ?? genome.hornType?.expressed ?? null,
    frontLimbs: chassis?.limbs.d ?? genome.frontLimbs?.expressed ?? null,
    rearLimbs: chassis?.limbs.d ?? genome.rearLimbs?.expressed ?? null,
    tail: chassis?.tail.d ?? genome.tailType?.expressed ?? null,
    back: chassis?.back.d ?? genome.backTrait?.expressed ?? null,
    pattern: chassis?.pattern.d ?? genome.patternType?.expressed ?? null,
    aura: chassis?.aura.d ?? genome.auraType?.expressed ?? null,
    core: chassis?.core.d ?? null,
    temperament: row.temperament,
    mutation: row.mutation?.key ?? genome.mutationType ?? null,
  };
}

async function claimUniqueChassis(
  tx: Tx,
  blueprint: CreatureBlueprint,
  reserved?: Set<string>,
): Promise<ChassisDna> {
  const taken = new Set(reserved);
  const existing = await tx.creature.findMany({
    where: { chassisSignature: { not: null } },
    select: { chassisSignature: true },
  });
  for (const row of existing) {
    if (row.chassisSignature) {
      taken.add(row.chassisSignature);
    }
  }
  return withUniqueChassis(blueprint.genesisSeed, taken, blueprint.lifeStage ?? "BABY", blueprint.chassis);
}

export function presentKin(row: CreatureRecord, owned: boolean) {
  const presented = presentCreature(row);
  return {
    id: presented.id,
    name: presented.name,
    speciesName: presented.speciesName,
    speciesKey: presented.speciesKey,
    generation: presented.generation,
    gender: presented.gender,
    portraitUrl: presented.portraitUrl,
    visual: presented.visual,
    visualStatus: presented.visualStatus,
    revealStatus: presented.revealStatus,
    bodyPlan: presented.bodyPlan,
    head: presented.head,
    elementPrimary: presented.elementPrimary,
    genesisSeed: presented.genesisSeed,
    phenotype: presented.phenotype,
    chassis: presented.chassis,
    owned,
  };
}

function typedKey(speciesKey: string, locusKey: string, current: string) {
  const role = GENETIC_CARD_LOCI.find((row) => row.key === locusKey)?.role;
  const card = getCardDefinition(current);
  if (card && cardBelongsToSpecies(card, speciesKey)) {
    return current;
  }
  if (!role) {
    return current;
  }
  return cardsForLocus(speciesKey, role)[0]?.key ?? current;
}

export function kitFromRecord(row: CreatureRecord): CreatureCardKit | null {
  const byKey = new Map(row.loci.map((locus) => [locus.locusKey, locus.expressedJson]));
  const cards: CardKitManifest[] = [];
  for (const locus of GENETIC_CARD_LOCI) {
    const value: unknown = byKey.get(locus.key);
    if (!isCardKitManifest(value)) {
      return null;
    }
    cards.push(value);
  }
  return { version: CARD_GEN_VERSION, cards };
}

export function presentKitCards(kit: CreatureCardKit) {
  return kit.cards.map((card) => ({
    locus: card.locus,
    role: card.locusRole,
    name: card.name,
    namePt: card.namePt,
    text: card.text,
    catalogKey: getCardDefinition(card.cardFamily) ? card.cardFamily : null,
    cost: card.cost,
    tier: card.tier,
    function: card.function,
    targetType: card.targetType,
    effects: card.effects,
    tags: [card.function, card.tier],
    sourceGenes: card.sourceGenes ?? [],
    luckVariant: card.luckVariant ?? null,
    produces: card.ability?.produces ?? [],
    consumes: card.ability?.consumes ?? [],
  }));
}

function presentCombatIdentity(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const row = value as {
    identity?: {
      namePt?: string;
      stylePt?: string;
      archetype?: string;
      strengths?: string[];
      weaknesses?: string[];
      synergyTags?: string[];
      quirks?: Array<{ namePt: string; textPt: string }>;
      anomaly?: { textPt: string } | null;
      resource?: unknown;
    };
    rolls?: Record<string, number>;
    expression?: Record<string, number>;
    fingerprint?: string;
    engineVersion?: string;
  };
  if (!row.identity) return null;
  const resource = hydratePersonalResource(row.identity.resource);
  return {
    namePt: row.identity.namePt,
    stylePt: row.identity.stylePt,
    archetype: row.identity.archetype,
    strengths: row.identity.strengths ?? [],
    weaknesses: row.identity.weaknesses ?? [],
    synergyTags: row.identity.synergyTags ?? [],
    quirks: row.identity.quirks ?? [],
    anomaly: row.identity.anomaly ?? null,
    resource: resource
      ? {
          ...resource,
          help: explainPersonalResource(resource, "pt-BR"),
        }
      : null,
    rolls: row.rolls ?? {},
    expression: row.expression ?? {},
    fingerprint: row.fingerprint ?? null,
    engineVersion: row.engineVersion ?? null,
  };
}

async function parentHintsFor(tx: Tx, row: CreatureRecord) {
  const ids = [row.fatherId, row.motherId].filter((id): id is string => Boolean(id));
  if (ids.length === 0) {
    return [];
  }
  const parents = await tx.creature.findMany({
    where: { id: { in: ids } },
    include: { loci: true },
  });
  return parents.map((parent) => ({
    element: parent.elementPrimary as Element,
    families: parent.loci.map((locus) => locus.expressedCardKey),
  }));
}

export async function ensureCreatureCardKit(tx: Tx, row: CreatureRecord): Promise<CreatureCardKit> {
  const existing = kitFromRecord(row);
  if (existing && row.combatManifestJson) {
    return { ...existing, combat: row.combatManifestJson as CreatureCardKit["combat"] };
  }
  const kit = existing ?? assembleCreatureCardKit({
    creatureId: row.id,
    blueprint: toBlueprint(row),
    parents: await parentHintsFor(tx, row),
  });
  if (!existing) {
    const byKey = new Map(row.loci.map((locus) => [locus.locusKey, locus]));
    for (const card of kit.cards) {
      const locus = byKey.get(card.locus);
      if (!locus) continue;
      await tx.creatureLocus.update({
        where: { id: locus.id },
        data: { expressedCardKey: card.cardFamily, expressedJson: JSON.parse(JSON.stringify(card)) },
      });
      locus.expressedCardKey = card.cardFamily;
      locus.expressedJson = JSON.parse(JSON.stringify(card));
    }
  }
  if (!row.combatManifestJson) {
    const combat = kit.combat ?? assembleCreatureCardKit({
      creatureId: row.id,
      blueprint: toBlueprint(row),
      parents: await parentHintsFor(tx, row),
    }).combat;
    if (combat) {
      await tx.creature.update({
        where: { id: row.id },
        data: { geneticEngineVersion: combat.engineVersion, combatManifestJson: JSON.parse(JSON.stringify(combat)) },
      });
      row.geneticEngineVersion = combat.engineVersion;
      row.combatManifestJson = JSON.parse(JSON.stringify(combat));
    }
  }
  return kit;
}

export async function alignCreatureLoci(tx: Tx, row: CreatureRecord) {
  const speciesKey = row.species.key;
  const element = speciesElements[speciesKey];
  if (element && row.elementPrimary !== element) {
    await tx.creature.update({ where: { id: row.id }, data: { elementPrimary: element } });
    row.elementPrimary = element;
  }
  for (const locus of row.loci) {
    if (isCardKitManifest(locus.expressedJson)) {
      continue;
    }
    const expressed = typedKey(speciesKey, locus.locusKey, locus.expressedCardKey);
    const recessive = typedKey(speciesKey, locus.locusKey, locus.recessiveCardKey);
    if (expressed === locus.expressedCardKey && recessive === locus.recessiveCardKey) {
      continue;
    }
    await tx.creatureLocus.update({
      where: { id: locus.id },
      data: {
        expressedCardKey: expressed,
        recessiveCardKey: recessive,
        expressedJson: expressionFromCard(expressed),
        recessiveJson: expressionFromCard(recessive),
      },
    });
    locus.expressedCardKey = expressed;
    locus.recessiveCardKey = recessive;
  }
  return row;
}
