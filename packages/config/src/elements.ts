import type { Element } from "@nexora/types";

/**
 * Vantagens da v1 (GDD §5).
 * Gelo não tem vantagem registrada — permanece neutro até o GDD ser atualizado.
 */
export const ELEMENT_ADVANTAGE: Partial<Record<Element, readonly Element[]>> = {
  WATER: ["FIRE"],
  FIRE: ["NATURE"],
  NATURE: ["EARTH"],
  EARTH: ["ELECTRIC"],
  ELECTRIC: ["WATER"],
  LIGHT: ["DARK"],
  DARK: ["ARCANE"],
  ARCANE: ["LIGHT"],
  ICE: [],
};

export const ELEMENT_MULTIPLIER_STRONG = 1.25;
export const ELEMENT_MULTIPLIER_WEAK = 0.8;
export const ELEMENT_MULTIPLIER_NEUTRAL = 1;
