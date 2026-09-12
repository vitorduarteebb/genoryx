import type { GenesisGrade } from "@nexora/types";

export const genesisComplexityConfig = {
  base: 20,
  weights: {
    geneticNovelty: 10,
    powerOriginNew: 20,
    mutationEvent: 15,
    lineageDistance: 10,
    rareMorphology: 10,
    typologyCombination: 10,
    elementCombination: 10,
  },
  rareBodyPlans: ["GOLEM", "AVIAN", "ABYSSAL", "SERPENT_WYRM", "FLOATING", "INSECTOID_BIPED"] as const,
  gradeThresholds: {
    REFINED: 35,
    RARE: 50,
    EXCEPTIONAL: 70,
    GENESIS: 85,
  },
} as const;

export function genesisGradeFromScore(score: number): GenesisGrade {
  const clamped = Math.max(0, Math.min(100, score));
  if (clamped >= genesisComplexityConfig.gradeThresholds.GENESIS) {
    return "GENESIS";
  }
  if (clamped >= genesisComplexityConfig.gradeThresholds.EXCEPTIONAL) {
    return "EXCEPTIONAL";
  }
  if (clamped >= genesisComplexityConfig.gradeThresholds.RARE) {
    return "RARE";
  }
  if (clamped >= genesisComplexityConfig.gradeThresholds.REFINED) {
    return "REFINED";
  }
  return "COMMON";
}
