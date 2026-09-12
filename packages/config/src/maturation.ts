import type { LifeStage } from "@nexora/types";

export const ENCOUNTER_FAMILIES = ["COMMON", "UNCOMMON", "ELITE", "BOSS"] as const;
export type EncounterFamily = (typeof ENCOUNTER_FAMILIES)[number];

export const MATURATION_STATES = ["GROWING", "READY", "MATURE"] as const;
export type MaturationState = (typeof MATURATION_STATES)[number];

export const maturationConfig = {
  thresholds: {
    YOUNG: 100,
    ADULT: 350,
  } satisfies Record<"YOUNG" | "ADULT", number>,
  familyXp: {
    COMMON: 2,
    UNCOMMON: 4,
    ELITE: 10,
    BOSS: 25,
  } satisfies Record<EncounterFamily, number>,
  lossShare: 0.25,
  discoveryBonus: 1.5,
  diversity: [
    { upTo: 10, share: 1 },
    { upTo: 20, share: 0.7 },
    { upTo: Number.POSITIVE_INFINITY, share: 0.4 },
  ] as const,
  participation: {
    min: 0.25,
    max: 1,
    cards: 0.28,
    damage: 0.18,
    support: 0.22,
    alive: 0.16,
    present: 0.16,
  },
  ledgerSource: "MATURATION_XP_GRANTED",
} as const;

export function maturationThresholdFor(nextStage: "YOUNG" | "ADULT"): number {
  return maturationConfig.thresholds[nextStage];
}

export function maturationThresholdOf(lifeStage: LifeStage | string): number {
  if (lifeStage === "EGG" || lifeStage === "BABY") {
    return maturationConfig.thresholds.YOUNG;
  }
  if (lifeStage === "YOUNG") {
    return maturationConfig.thresholds.ADULT;
  }
  return maturationConfig.thresholds.ADULT;
}

export function maturationProgress(lifeStage: LifeStage | string, maturationXp: number): {
  current: number;
  target: number;
  ratio: number;
  state: MaturationState;
} {
  if (lifeStage === "ADULT") {
    return { current: maturationXp, target: maturationConfig.thresholds.ADULT, ratio: 1, state: "MATURE" };
  }
  const target = maturationThresholdOf(lifeStage);
  const ratio = target <= 0 ? 1 : Math.min(1, Math.max(0, maturationXp / target));
  return {
    current: maturationXp,
    target,
    ratio,
    state: ratio >= 1 ? "READY" : "GROWING",
  };
}
