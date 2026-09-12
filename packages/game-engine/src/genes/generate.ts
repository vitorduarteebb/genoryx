import {
  cardBelongsToSpecies,
  cardsForLocus,
  cardsForSpecies,
  getCardDefinition,
  speciesElements,
  speciesVisuals,
} from "@nexora/config";
import {
  BODY_PLANS,
  GENE_KEYS,
  GENE_RANKS,
  GENETIC_CARD_LOCI,
  HEAD_TYPES,
  type BodyPlan,
  type CreatureOrigin,
  type Element,
  type Gender,
  type GeneKey,
  type GeneRank,
  type GeneticCardExpression,
  type GeneticCardLocusKey,
  type HeadType,
  type LifeStage,
} from "@nexora/types";
import { applyKitToLoci, assembleCreatureCardKit } from "../cards/kit";
import { breedChassisDna, rollChassisDna, type ChassisDna } from "../chassis/dna";
import { createSeededRandom, type RandomService } from "../random/random-service";
import { geneticHash } from "./hash";

export type LocusBlueprint = {
  locusKey: GeneticCardLocusKey;
  expressed: GeneticCardExpression;
  recessive: GeneticCardExpression;
};

export type CreatureBlueprint = {
  speciesKey: string;
  name: string;
  gender: Gender;
  generation: number;
  origin: CreatureOrigin;
  level: number;
  fertility: number;
  elementPrimary: Element;
  elementSecondary?: Element;
  genes: Record<GeneKey, GeneRank>;
  bodyPlanExpressed: BodyPlan;
  bodyPlanRecessive: BodyPlan;
  headExpressed: HeadType;
  headRecessive: HeadType;
  mutationKey?: string;
  geneticPurity: number;
  geneticHash: string;
  genesisSeed: number;
  loci: LocusBlueprint[];
  fatherId?: string;
  motherId?: string;
  tags: string[];
  lifeStage?: LifeStage;
  chassis?: ChassisDna;
  combatManifest?: import("../genetic-combat/types").GeneticCombatManifest;
};

const STARTER_RANKS: GeneRank[] = ["D", "C", "C", "B", "B", "A"];
const WILD_RANKS: GeneRank[] = ["F", "E", "D", "D", "C", "C", "B", "A"];

export function expressionFromCard(cardKey: string, mutationState = "NONE"): GeneticCardExpression {
  const card = getCardDefinition(cardKey);
  return {
    cardFamily: cardKey,
    variant: "alpha-v1",
    element: card?.element ?? "ARCANE",
    powerExpression: String(card?.effects.find((effect) => effect.op === "DAMAGE")?.value ?? 10),
    energyExpression: String(card?.cost ?? 1),
    speedExpression: "NORMAL",
    statusExpression: card?.effects.find((effect) => effect.status)?.status ?? "NONE",
    targetExpression: card?.targetType ?? "ENEMY",
    modifierGenes: [],
    mutationState,
  };
}

function pickLocusAllele(rng: RandomService, speciesKey: string, role: (typeof GENETIC_CARD_LOCI)[number]["role"]): string {
  const pool = cardsForLocus(speciesKey, role);
  if (pool.length > 0) {
    return rng.pick(pool).key;
  }
  const speciesPool = cardsForSpecies(speciesKey);
  if (speciesPool.length > 0) {
    return rng.pick(speciesPool).key;
  }
  return "ember_strike";
}

export function rollGene(rng: RandomService, origin: CreatureOrigin): GeneRank {
  const pool = origin === "STARTER" ? STARTER_RANKS : WILD_RANKS;
  return rng.pick(pool);
}

export function generateCreatureBlueprint(input: {
  seed: number;
  speciesKey: string;
  origin: CreatureOrigin;
  level?: number;
  generation?: number;
  name?: string;
  gender?: Gender;
  fatherId?: string;
  motherId?: string;
}): CreatureBlueprint {
  const rng = createSeededRandom(input.seed);
  const visual = speciesVisuals[input.speciesKey] ?? speciesVisuals.pyron;
  const elementPrimary = speciesElements[input.speciesKey] ?? "FIRE";
  const genes = {} as Record<GeneKey, GeneRank>;
  for (const key of GENE_KEYS) {
    genes[key] = rollGene(rng, input.origin);
  }

  const loci = GENETIC_CARD_LOCI.map((locus) => {
    const expressedKey = pickLocusAllele(rng, input.speciesKey, locus.role);
    const recessiveKey = pickLocusAllele(rng, input.speciesKey, locus.role);
    return {
      locusKey: locus.key,
      expressed: expressionFromCard(expressedKey),
      recessive: expressionFromCard(recessiveKey),
    };
  });

  const bodyRecessive = rng.pick(BODY_PLANS);
  const headRecessive = rng.pick(HEAD_TYPES);
  const gender: Gender = input.gender ?? (rng.chance(0.5) ? "MALE" : "FEMALE");
  const hash = geneticHash([
    input.speciesKey,
    input.seed,
    input.origin,
    ...GENE_RANKS,
    ...loci.map((locus) => `${locus.locusKey}:${locus.expressed.cardFamily}/${locus.recessive.cardFamily}`),
    visual.bodyPlan,
    bodyRecessive,
    visual.head,
    headRecessive,
  ]);

  const draft: CreatureBlueprint = {
    speciesKey: input.speciesKey,
    name: input.name ?? input.speciesKey,
    gender,
    generation: input.generation ?? 0,
    origin: input.origin,
    level: input.level ?? 1,
    fertility: 5,
    elementPrimary,
    genes,
    bodyPlanExpressed: visual.bodyPlan,
    bodyPlanRecessive: bodyRecessive,
    headExpressed: visual.head,
    headRecessive: headRecessive,
    geneticPurity: input.origin === "STARTER" ? 100 : 92,
    geneticHash: hash,
    genesisSeed: input.seed,
    loci,
    fatherId: input.fatherId,
    motherId: input.motherId,
    tags: [...(visual.tags ?? [])],
    chassis: rollChassisDna({ seed: input.seed, lifeStage: "BABY" }),
  };
  return sealCardKit(draft, `genesis:${hash}`);
}

function sealCardKit(blueprint: CreatureBlueprint, creatureId: string, parents?: Parameters<typeof assembleCreatureCardKit>[0]["parents"]) {
  const kit = assembleCreatureCardKit({ creatureId, blueprint, parents });
  return { ...blueprint, loci: applyKitToLoci(blueprint.loci, kit), combatManifest: kit.combat };
}

function clampAlleleToSpecies(
  rng: RandomService,
  speciesKey: string,
  role: (typeof GENETIC_CARD_LOCI)[number]["role"],
  preferred: GeneticCardExpression,
  fallback: GeneticCardExpression,
): GeneticCardExpression {
  const preferredCard = getCardDefinition(preferred.cardFamily);
  if (preferredCard && cardBelongsToSpecies(preferredCard, speciesKey)) {
    return preferred;
  }
  const fallbackCard = getCardDefinition(fallback.cardFamily);
  if (fallbackCard && cardBelongsToSpecies(fallbackCard, speciesKey)) {
    return fallback;
  }
  return expressionFromCard(pickLocusAllele(rng, speciesKey, role));
}

export function blueprintFromParents(
  seed: number,
  parentA: CreatureBlueprint,
  parentB: CreatureBlueprint,
  mutationChance: number,
  recessiveRevealChance: number,
  rankDriftChance: number,
): CreatureBlueprint {
  const rng = createSeededRandom(seed);
  const speciesKey = rng.chance(0.5) ? parentA.speciesKey : parentB.speciesKey;
  const genes = {} as Record<GeneKey, GeneRank>;
  for (const key of GENE_KEYS) {
    const pick = rng.chance(0.5) ? parentA.genes[key] : parentB.genes[key];
    genes[key] = driftRank(pick, rng, rankDriftChance);
  }

  const loci = GENETIC_CARD_LOCI.map((locus) => {
    const a = parentA.loci.find((row) => row.locusKey === locus.key) ?? parentA.loci[0];
    const b = parentB.loci.find((row) => row.locusKey === locus.key) ?? parentB.loci[0];
    const source = rng.chance(0.5) ? a : b;
    const other = source === a ? b : a;
    const revealRecessive = rng.chance(recessiveRevealChance);
    const expressed = clampAlleleToSpecies(
      rng,
      speciesKey,
      locus.role,
      revealRecessive ? source.recessive : source.expressed,
      other.expressed,
    );
    const recessive = clampAlleleToSpecies(
      rng,
      speciesKey,
      locus.role,
      rng.chance(0.5) ? other.expressed : other.recessive,
      source.expressed,
    );
    return { locusKey: locus.key, expressed, recessive };
  });

  let mutationKey: string | undefined;
  let elementSecondary = parentA.elementSecondary ?? parentB.elementSecondary;
  if (rng.chance(mutationChance)) {
    mutationKey = rng.pick(["PLASMA", "MAGMA", "ANCIENT", "VOID"]);
    if (mutationKey === "PLASMA") elementSecondary = "ELECTRIC";
    if (mutationKey === "MAGMA") elementSecondary = "FIRE";
    if (mutationKey === "VOID") elementSecondary = "DARK";
    const touched = rng.pick(loci);
    touched.expressed = { ...touched.expressed, mutationState: mutationKey };
  }

  const bodyPlanExpressed = rng.chance(0.5) ? parentA.bodyPlanExpressed : parentB.bodyPlanExpressed;
  const bodyPlanRecessive = rng.chance(0.5) ? parentA.bodyPlanRecessive : parentB.bodyPlanRecessive;
  const headExpressed = rng.chance(0.5) ? parentA.headExpressed : parentB.headExpressed;
  const headRecessive = rng.chance(0.5) ? parentA.headRecessive : parentB.headRecessive;
  const visual = speciesVisuals[speciesKey] ?? speciesVisuals.pyron;
  const hash = geneticHash([
    speciesKey,
    seed,
    "BRED",
    ...loci.map((locus) => `${locus.locusKey}:${locus.expressed.cardFamily}`),
    mutationKey ?? "",
    bodyPlanExpressed,
    headExpressed,
  ]);

  const draft: CreatureBlueprint = {
    speciesKey,
    name: speciesKey,
    gender: rng.chance(0.5) ? "MALE" : "FEMALE",
    generation: Math.max(parentA.generation, parentB.generation) + 1,
    origin: "BRED",
    level: 1,
    fertility: 5,
    elementPrimary: speciesElements[speciesKey] ?? (rng.chance(0.5) ? parentA.elementPrimary : parentB.elementPrimary),
    elementSecondary,
    genes,
    bodyPlanExpressed,
    bodyPlanRecessive,
    headExpressed,
    headRecessive,
    mutationKey,
    geneticPurity: Math.max(40, Math.round((parentA.geneticPurity + parentB.geneticPurity) / 2) - 4),
    geneticHash: hash,
    genesisSeed: seed,
    loci,
    fatherId: undefined,
    motherId: undefined,
    tags: [...new Set([...(visual.tags ?? []), ...parentA.tags, ...parentB.tags])],
    chassis:
      parentA.chassis && parentB.chassis
        ? breedChassisDna({ seed, parentA: parentA.chassis, parentB: parentB.chassis })
        : rollChassisDna({ seed, lifeStage: "BABY", salt: "bred-fallback" }),
  };
  return sealCardKit(draft, `bred:${hash}`, [
    { element: parentA.elementPrimary, families: parentA.loci.map((row) => row.expressed.cardFamily) },
    { element: parentB.elementPrimary, families: parentB.loci.map((row) => row.expressed.cardFamily) },
  ]);
}

function driftRank(rank: GeneRank, rng: RandomService, chance: number): GeneRank {
  if (!rng.chance(chance)) {
    return rank;
  }
  const index = GENE_RANKS.indexOf(rank);
  const next = rng.chance(0.5) ? index + 1 : index - 1;
  return GENE_RANKS[Math.max(0, Math.min(GENE_RANKS.length - 1, next))] ?? rank;
}
