import type { CardRange, GenesisGrade, TargetRule } from "@nexora/types";

/**
 * Números da Guerra Mágica e da memória tática.
 * Nada disto é NFT, dano do cliente ou RNG fora do RandomService.
 */
export const combatEngineConfig = {
  manaCap: 10,
  presenceDrawMax: 3,
  draftWeightUnused: 1,
  draftWeightSameTurn: 3,
  draftWeightPreviousTurn: 1,
  interventionSurcharge: [0, 1, 2] as const,
  maxStackDepth: 8,
  manifestationFactor: 0.15,
  rarityMultiplier: {
    COMMON: 1,
    REFINED: 1.1,
    RARE: 1.25,
    EXCEPTIONAL: 1.45,
    GENESIS: 1.7,
  } satisfies Record<GenesisGrade, number>,
  rarityManaTax: {
    COMMON: 0,
    REFINED: 0,
    RARE: 1,
    EXCEPTIONAL: 1,
    GENESIS: 2,
  } satisfies Record<GenesisGrade, number>,
} as const;

export function rangeToTargetRule(range: CardRange): TargetRule {
  switch (range) {
    case "SHORT":
      return "FRONT_ONLY";
    case "MEDIUM":
      return "ANY_TARGETABLE";
    case "LONG":
      return "PIERCE_FRONT";
    case "AOE":
      return "AOE_ALL";
    default:
      return "ANY_TARGETABLE";
  }
}
