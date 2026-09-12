import { genesisComplexityConfig, genesisGradeFromScore } from "@nexora/config";
import type { Element, GenesisGrade, Typology } from "@nexora/types";
import type { CreatureBlueprint } from "../genes/generate";
import { typologyFromTags } from "./cross-potential";

export type PowerOriginKind = "INHERITED" | "NEW" | "NONE";

export type GenesisComplexityInput = {
  parentA: Pick<CreatureBlueprint, "speciesKey" | "generation" | "elementPrimary" | "bodyPlanExpressed" | "headExpressed" | "tags"> & {
    typology?: Typology | string | null;
  };
  parentB: Pick<CreatureBlueprint, "speciesKey" | "generation" | "elementPrimary" | "bodyPlanExpressed" | "headExpressed" | "tags"> & {
    typology?: Typology | string | null;
  };
  child: Pick<
    CreatureBlueprint,
    "speciesKey" | "generation" | "elementPrimary" | "elementSecondary" | "bodyPlanExpressed" | "headExpressed" | "mutationKey" | "tags"
  >;
  powerOrigin?: PowerOriginKind;
};

export type GenesisComplexityBreakdown = {
  base: number;
  geneticNovelty: number;
  powerOrigin: number;
  mutationEvent: number;
  lineageDistance: number;
  rareMorphology: number;
  typologyCombination: number;
  elementCombination: number;
};

export type GenesisComplexity = {
  score: number;
  grade: GenesisGrade;
  breakdown: GenesisComplexityBreakdown;
};

function typologyOf(
  row: { typology?: Typology | string | null; tags?: readonly string[] },
): string | null {
  return (row.typology as string | undefined) ?? typologyFromTags(row.tags);
}

function uncommonBody(body: string): boolean {
  return (genesisComplexityConfig.rareBodyPlans as readonly string[]).includes(body);
}

export function scoreGenesisComplexity(input: GenesisComplexityInput): GenesisComplexity {
  const { parentA, parentB, child } = input;
  const weights = genesisComplexityConfig.weights;
  const mixedSpecies = parentA.speciesKey !== parentB.speciesKey;
  const childDiffers =
    child.speciesKey !== parentA.speciesKey ||
    child.speciesKey !== parentB.speciesKey ||
    child.bodyPlanExpressed !== parentA.bodyPlanExpressed ||
    child.bodyPlanExpressed !== parentB.bodyPlanExpressed ||
    child.headExpressed !== parentA.headExpressed ||
    child.headExpressed !== parentB.headExpressed;
  const genGap = Math.abs(parentA.generation - parentB.generation);
  const typologyA = typologyOf(parentA);
  const typologyB = typologyOf(parentB);
  const mixedTypology = Boolean(typologyA && typologyB && typologyA !== typologyB);
  const mixedElement = parentA.elementPrimary !== parentB.elementPrimary;
  const childDual = Boolean(child.elementSecondary && child.elementSecondary !== child.elementPrimary);
  const novelElement = mixedElement || childDual || (child.elementPrimary !== parentA.elementPrimary && child.elementPrimary !== parentB.elementPrimary);

  const breakdown: GenesisComplexityBreakdown = {
    base: genesisComplexityConfig.base,
    geneticNovelty: childDiffers || mixedSpecies ? weights.geneticNovelty : 0,
    powerOrigin: input.powerOrigin === "NEW" ? weights.powerOriginNew : 0,
    mutationEvent: child.mutationKey ? weights.mutationEvent : 0,
    lineageDistance: mixedSpecies || genGap >= 1 ? weights.lineageDistance : 0,
    rareMorphology: uncommonBody(child.bodyPlanExpressed) ? weights.rareMorphology : 0,
    typologyCombination: mixedTypology ? weights.typologyCombination : 0,
    elementCombination: novelElement ? weights.elementCombination : 0,
  };

  const score = Math.max(
    0,
    Math.min(
      100,
      Object.values(breakdown).reduce((sum, value) => sum + value, 0),
    ),
  );

  return {
    score,
    grade: genesisGradeFromScore(score),
    breakdown,
  };
}

export function complexityIgnoresCombatStats(input: unknown): boolean {
  const blob = JSON.stringify(input);
  return !/\bATK\b/.test(blob) && !/\bHP\b/.test(blob) && !/"attackGene"/.test(blob) && !/"hpGene"/.test(blob);
}

export function rarityFromGenesisGrade(grade: GenesisGrade): "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY" {
  if (grade === "GENESIS") {
    return "LEGENDARY";
  }
  if (grade === "EXCEPTIONAL") {
    return "EPIC";
  }
  if (grade === "RARE") {
    return "RARE";
  }
  if (grade === "REFINED") {
    return "UNCOMMON";
  }
  return "COMMON";
}

export function genesisGradeFromLegacyRarity(rarity: string): GenesisGrade {
  if (rarity === "LEGENDARY" || rarity === "ANCIENT" || rarity === "MYTHIC" || rarity === "ANCESTRAL") {
    return "GENESIS";
  }
  if (rarity === "EPIC") {
    return "EXCEPTIONAL";
  }
  if (rarity === "RARE") {
    return "RARE";
  }
  if (rarity === "UNCOMMON") {
    return "REFINED";
  }
  return "COMMON";
}

export function elementHintLabel(primary: Element, secondary?: Element): string {
  if (!secondary || secondary === primary) {
    return primary.toLowerCase();
  }
  return `${primary.toLowerCase()}-${secondary.toLowerCase()}`;
}
