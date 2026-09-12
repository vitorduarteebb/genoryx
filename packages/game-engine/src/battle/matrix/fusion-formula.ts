import { combatEngineConfig } from "@nexora/config";
import type { GenesisGrade } from "@nexora/types";

/**
 * Fusão determinística — registro dos tipos, sem RNG.
 * V_gen é o valor da habilidade única da criatura (0–100), não um atributo de chain.
 */
export function fusionPower(input: {
  basePower: number;
  rarity: GenesisGrade;
  geneticValue: number;
  fieldBonus?: number;
}): number {
  const multiplier = combatEngineConfig.rarityMultiplier[input.rarity];
  const genetic = Math.max(0, Math.min(100, input.geneticValue)) * combatEngineConfig.manifestationFactor;
  return Math.floor(input.basePower * multiplier + genetic + (input.fieldBonus ?? 0));
}

export function fusionEnergyCost(input: {
  costs: readonly number[];
  rarity: GenesisGrade;
}): number {
  const sum = input.costs.reduce((total, row) => total + Math.max(0, row), 0);
  const tax = combatEngineConfig.rarityManaTax[input.rarity];
  return Math.max(1, Math.ceil(sum / 2) + tax);
}
