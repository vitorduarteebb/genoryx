import {
  geneticPowerConfig,
  seedGeneticPowers,
  seedPowerForSpecies,
  type GeneticPowerGenome,
} from "@nexora/config";
import type { Element, GeneticPowerOrigin, Typology } from "@nexora/types";
import type { RandomService } from "../random/random-service";
import { composePowerKey, defaultMechanicFor, mechanicPool, namePower, themeFor } from "./grammar";
import { deterministicUuid, powerHash, powerSimilarity } from "./hash";

export type PowerAssignment = {
  powerId: string;
  lineageId: string;
  originType: GeneticPowerOrigin;
  originCreatureId: string | null;
  genome: GeneticPowerGenome;
};

export function backfillGeneticPower(input: {
  creatureId: string;
  speciesKey: string;
  element: Element;
  lociKeys?: readonly string[];
  geneticHash: string;
}): PowerAssignment {
  const seed = seedPowerForSpecies(input.speciesKey);
  const genome = seed
    ? stripSpecies(seed)
    : fallbackGenome(input.element, inferTypology(input.lociKeys ?? [], input.element), input.geneticHash);
  return {
    powerId: deterministicUuid(`power:${powerHash(genome)}`),
    lineageId: deterministicUuid(`lineage:${input.speciesKey}:${powerHash(genome)}`),
    originType: "GENESIS",
    originCreatureId: input.creatureId,
    genome,
  };
}

export function generateNewPower(input: {
  rng: RandomService;
  childId: string;
  childElement: Element;
  childTypology?: Typology;
  parentA: GeneticPowerGenome;
  parentB: GeneticPowerGenome;
}): PowerAssignment {
  const typology = input.childTypology ?? inferFromParents(input.parentA, input.parentB, input.rng);
  let attempt = 0;
  let genome = draftGenome(input.rng, input.childElement, typology, input.parentA, input.parentB);
  while (attempt < geneticPowerConfig.maxNewPowerAttempts) {
    const clash = seedGeneticPowers.some((row) => powerSimilarity(row, genome) >= geneticPowerConfig.similarityReroll);
    const dup = powerHash(genome) === powerHash(input.parentA) || powerHash(genome) === powerHash(input.parentB);
    if (!clash && !dup) {
      break;
    }
    genome = draftGenome(input.rng, input.childElement, typology, input.parentA, input.parentB);
    attempt += 1;
  }
  return {
    powerId: deterministicUuid(`power:${powerHash(genome)}`),
    lineageId: deterministicUuid(`lineage-new:${input.childId}:${powerHash(genome)}`),
    originType: "MUTATED_NEW",
    originCreatureId: input.childId,
    genome,
  };
}

function draftGenome(
  rng: RandomService,
  element: Element,
  typology: Typology,
  parentA: GeneticPowerGenome,
  parentB: GeneticPowerGenome,
): GeneticPowerGenome {
  const blocked = new Set([parentA.primaryMechanic, parentB.primaryMechanic]);
  const primary = defaultMechanicFor(typology);
  const secondary =
    mechanicPool.filter((row) => row !== primary && !blocked.has(row))[rng.nextInt(0, 4)] ??
    mechanicPool[rng.nextInt(0, mechanicPool.length - 1)]!;
  const theme = themeFor(typology, element);
  const names = namePower({ typology, element, primaryMechanic: primary, signatureModifier: secondary });
  return {
    key: composePowerKey(theme, primary, secondary),
    name: names.name,
    namePt: names.namePt,
    element,
    typology,
    powerTheme: theme,
    primaryMechanic: primary,
    secondaryMechanic: secondary,
    resourceInteraction: typology === "BURN" ? "HEAT" : typology === "TANK" ? "STONE" : typology === "HEAL" ? "BARK" : "TIDE",
    targetPattern: typology === "HEAL" || typology === "TANK" ? "ALLIES" : "ENEMY",
    scalingPattern: typology === "BURN" ? "STACK" : "LINEAR",
    triggerPattern: "ON_PLAY",
    riskPattern: "NONE",
    signatureModifier: `${typology}_${secondary}`,
  };
}

function fallbackGenome(element: Element, typology: Typology, salt: string): GeneticPowerGenome {
  const primary = defaultMechanicFor(typology);
  const names = namePower({ typology, element, primaryMechanic: primary, signatureModifier: salt.slice(0, 4) });
  const theme = themeFor(typology, element);
  return {
    key: composePowerKey(theme, primary, "GAIN_MOMENTUM"),
    name: names.name,
    namePt: names.namePt,
    element,
    typology,
    powerTheme: theme,
    primaryMechanic: primary,
    secondaryMechanic: "GAIN_MOMENTUM",
    resourceInteraction: "RESONANCE",
    targetPattern: "MIXED",
    scalingPattern: "LINEAR",
    triggerPattern: "ON_PLAY",
    riskPattern: "NONE",
    signatureModifier: salt.slice(0, 8),
  };
}

function inferTypology(lociKeys: readonly string[], element: Element): Typology {
  const blob = lociKeys.join(" ");
  if (blob.includes("bloom") || blob.includes("heal") || blob.includes("sunpetal") || element === "NATURE") {
    return "HEAL";
  }
  if (blob.includes("ember") || blob.includes("flame") || element === "FIRE") {
    return "BURN";
  }
  if (blob.includes("stone") || blob.includes("guard") || element === "EARTH") {
    return "TANK";
  }
  if (element === "WATER") {
    return "CONTROL";
  }
  return "CRITICAL";
}

function inferFromParents(a: GeneticPowerGenome, b: GeneticPowerGenome, rng: RandomService): Typology {
  return rng.nextInt(0, 1) === 0 ? a.typology : b.typology;
}

function stripSpecies(seed: (typeof seedGeneticPowers)[number]): GeneticPowerGenome {
  const { speciesKeys: _drop, ...genome } = seed;
  return genome;
}
