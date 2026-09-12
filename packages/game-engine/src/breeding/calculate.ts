import { activeEconomy, alphaConfig, breedingConfig, incubationMinutesForGrade } from "@nexora/config";
import type { GenesisGrade, ItemRarity } from "@nexora/types";
import { blueprintFromParents, type CreatureBlueprint } from "../genes/generate";
import { scoreGenesisComplexity, rarityFromGenesisGrade, type PowerOriginKind } from "./genesis-complexity";

export function breedingCostGold(priorA: number, priorB: number): number {
  const { baseGold, priorBreedWeight } = activeEconomy().breeding;
  const usedA = Math.max(0, Math.floor(priorA));
  const usedB = Math.max(0, Math.floor(priorB));
  const weightBps = Math.round(priorBreedWeight * 100);
  const scale = 100 + weightBps * usedA + weightBps * usedB;
  return Math.floor((baseGold * scale) / 100);
}

export function priorBreedsFromFertility(fertility: number): number {
  return Math.max(0, breedingConfig.maxFertility - fertility);
}

export function incubationMsForGrade(grade: GenesisGrade): number {
  return incubationMinutesForGrade(grade) * 60_000;
}

/** @deprecated incubação passa a ser por GenesisGrade. Mantido para ovos legados. */
export function incubationMs(rarity: ItemRarity): number {
  const minutes =
    alphaConfig.incubationMinutes[rarity as keyof typeof alphaConfig.incubationMinutes] ??
    alphaConfig.incubationMinutes.COMMON;
  return minutes * 60_000;
}

export function eggRarity(parentA: CreatureBlueprint, parentB: CreatureBlueprint): ItemRarity {
  const gen = Math.max(parentA.generation, parentB.generation);
  if (parentA.mutationKey || parentB.mutationKey || gen >= 4) {
    return "EPIC";
  }
  if (gen >= 2) {
    return "RARE";
  }
  return "COMMON";
}

export function calculateBreeding(input: {
  seed: number;
  parentA: CreatureBlueprint;
  parentB: CreatureBlueprint;
  powerOrigin?: PowerOriginKind;
}): {
  offspring: CreatureBlueprint;
  costGold: number;
  rarity: ItemRarity;
  hatchInMs: number;
  genesisGrade: GenesisGrade;
  complexityScore: number;
} {
  const offspring = blueprintFromParents(
    input.seed,
    input.parentA,
    input.parentB,
    alphaConfig.mutationChance,
    breedingConfig.recessiveRevealChance,
    breedingConfig.rankDriftChance,
  );
  const complexity = scoreGenesisComplexity({
    parentA: input.parentA,
    parentB: input.parentB,
    child: offspring,
    powerOrigin: input.powerOrigin ?? "NONE",
  });
  return {
    offspring,
    costGold: breedingCostGold(
      priorBreedsFromFertility(input.parentA.fertility),
      priorBreedsFromFertility(input.parentB.fertility),
    ),
    rarity: rarityFromGenesisGrade(complexity.grade),
    hatchInMs: incubationMsForGrade(complexity.grade),
    genesisGrade: complexity.grade,
    complexityScore: complexity.score,
  };
}
