import { GENETIC_CARD_LOCI, type GeneticCardLocusKey, type LifeStage } from "@nexora/types";

/** Números de idade e desbloqueio. Nunca hardcode nos componentes. */
export const creatureLifeStageConfig = {
  minLevel: {
    EGG: 1,
    BABY: 1,
    YOUNG: 10,
    ADULT: 20,
  } satisfies Record<LifeStage, number>,
  maxLevel: 50,
  /** Multiplicador pequeno sobre stats derivados. ADULT não é +50%. */
  statMultiplier: {
    EGG: 1,
    BABY: 1,
    YOUNG: 1.04,
    ADULT: 1.08,
  } satisfies Record<LifeStage, number>,
  /**
   * BABY G1–G6, YOUNG G1–G8, ADULT G1–G10.
   * Desligado no Alpha: todas as criaturas atuais são BABY e perderiam G7–G10.
   */
  gateCardsByStage: false,
  usableLoci: {
    EGG: [] as readonly GeneticCardLocusKey[],
    BABY: ["G1", "G2", "G3", "G4", "G5", "G6"] as const satisfies readonly GeneticCardLocusKey[],
    YOUNG: ["G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8"] as const satisfies readonly GeneticCardLocusKey[],
    ADULT: GENETIC_CARD_LOCI.map((row) => row.key),
  },
} as const;

export function usableLociForStage(lifeStage: LifeStage | string): readonly GeneticCardLocusKey[] {
  const stage = lifeStage as LifeStage;
  return creatureLifeStageConfig.usableLoci[stage] ?? creatureLifeStageConfig.usableLoci.BABY;
}

export function nextLifeStage(lifeStage: LifeStage | string): "YOUNG" | "ADULT" | null {
  if (lifeStage === "EGG" || lifeStage === "BABY") {
    return "YOUNG";
  }
  if (lifeStage === "YOUNG") {
    return "ADULT";
  }
  return null;
}

export function lifeStageStatMultiplier(lifeStage: LifeStage | string | undefined): number {
  if (!lifeStage) {
    return 1;
  }
  return creatureLifeStageConfig.statMultiplier[lifeStage as LifeStage] ?? 1;
}
