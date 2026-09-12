import type { GeneRank } from "@nexora/types";

export const combatConfig = {
  teamSize: 3,
  activeCreatures: 3,
  canvasWidth: 1280,
  canvasHeight: 720,
  startingHand: 5,
  drawPerRound: 2,
  maxHand: 8,
  energyPerRound: 1,
  maxEnergy: 10,
  startingMomentum: 0,
  maxMomentum: 8,
  minDamageOnHit: 1,
  defenseDivisor: 4,
  geneRankMultiplier: {
    F: 0.7,
    E: 0.8,
    D: 0.9,
    C: 1,
    B: 1.1,
    A: 1.25,
    S: 1.45,
    SS: 1.7,
  } satisfies Record<GeneRank, number>,
  critChanceByRank: {
    F: 0.02,
    E: 0.03,
    D: 0.04,
    C: 0.05,
    B: 0.07,
    A: 0.1,
    S: 0.14,
    SS: 0.18,
  } satisfies Record<GeneRank, number>,
  critDamage: 1.5,
  burnDamagePerStack: 4,
  poisonDamagePerStack: 3,
  fallbackCardKeys: ["ember_strike", "aqua_jab", "vine_tap", "stone_guard"] as const,
} as const;

/** Turno 1 = 1 energia, turno 2 = 2, … até maxEnergy. */
export function energyForRound(round: number): number {
  return Math.max(1, Math.min(combatConfig.maxEnergy, Math.floor(round)));
}
