import type { GeneticCardLocusKey } from "@nexora/types";

/** Versão do algoritmo. Kits persistidos com outra versão não são reescritos. */
export const CARD_GEN_VERSION = "gxr-kit-v1" as const;

export const cardKitConfig = {
  version: CARD_GEN_VERSION,
  maxEnergyCost: 4,
  minEnergyCost: 1,
  luckShift: 0.18,
  inheritHybridChance: 0.34,
} as const;

export type CardKitTier = "FOUNDATION" | "SPECIALIZATION" | "SYNERGY" | "ADVANCED" | "SIGNATURE" | "SUPREME";
export type CardKitFunction =
  | "ATTACK"
  | "DEFENSE"
  | "BUFF"
  | "DEBUFF"
  | "CONTROL"
  | "HEAL"
  | "SHIELD"
  | "UTILITY"
  | "COUNTER"
  | "MOBILITY"
  | "DOT"
  | "AOE"
  | "EXECUTE"
  | "SUSTAIN"
  | "SUPPORT";

export const cardKitSlots: Record<
  GeneticCardLocusKey,
  { tier: CardKitTier; cost: number; budget: number; functions: readonly CardKitFunction[] }
> = {
  G1: { tier: "FOUNDATION", cost: 1, budget: 14, functions: ["ATTACK"] },
  G2: { tier: "FOUNDATION", cost: 1, budget: 16, functions: ["MOBILITY", "ATTACK"] },
  G3: { tier: "SPECIALIZATION", cost: 2, budget: 20, functions: ["ATTACK", "DOT", "AOE"] },
  G4: { tier: "SPECIALIZATION", cost: 2, budget: 18, functions: ["SHIELD", "DEFENSE"] },
  G5: { tier: "SYNERGY", cost: 1, budget: 16, functions: ["UTILITY", "BUFF"] },
  G6: { tier: "SYNERGY", cost: 2, budget: 20, functions: ["CONTROL", "DEBUFF"] },
  G7: { tier: "ADVANCED", cost: 2, budget: 18, functions: ["COUNTER"] },
  G8: { tier: "ADVANCED", cost: 2, budget: 22, functions: ["SUPPORT", "SUSTAIN", "HEAL"] },
  G9: { tier: "SIGNATURE", cost: 3, budget: 28, functions: ["ATTACK", "CONTROL", "EXECUTE"] },
  G10: { tier: "SUPREME", cost: 4, budget: 36, functions: ["AOE", "EXECUTE", "SUSTAIN"] },
};

export function clampCardCost(cost: number): number {
  return Math.max(cardKitConfig.minEnergyCost, Math.min(cardKitConfig.maxEnergyCost, Math.round(cost)));
}
