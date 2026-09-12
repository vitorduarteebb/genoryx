import type { TargetRule, Typology } from "@nexora/types";

export const combatMatrixConfig = {
  draftV2: process.env.COMBAT_DRAFT_V2 === "true",
  formationLinearV2: process.env.FORMATION_LINEAR_V2 === "true",
  fusionV2: process.env.FUSION_V2 === "true",
  convergenceV1: process.env.CONVERGENCE_V1 === "true",
  defaultRulesVersion: "V1" as const,
  rosterSize: 5,
  banCount: 1,
  pickCount: 3,
  fusionUnlockRound: 5,
  convergenceMinRound: 7,
  maxDoubleFusionCandidates: 3,
  competitiveDeckSize: 16,
  startingHand: 5,
  drawPerRound: 2,
  maxHand: 8,
  energyPerRound: 1,
  middleVulnerableOnEvenRounds: true,
  fusionEnergyCost: 2,
  convergenceEnergyCost: 3,
  resonancePlay: 1,
  resonanceCombo: 2,
  resonanceThreshold: 4,
  convergenceResonanceThreshold: 10,
  convergenceMomentumThreshold: 3,
  resonanceCapPerTypologyPerRound: 2,
  diminishingAfterPlays: 2,
  maxTriggerDepth: 3,
  maxDrawChain: 3,
  maxEnergyChain: 3,
  functionalTypologies: ["BURN", "TANK", "HEAL", "CONTROL", "CRITICAL"] as const satisfies readonly Typology[],
} as const;

export function defaultTargetRule(targetType: string, tags: readonly string[] = []): TargetRule {
  if (tags.includes("BACKLINE") || tags.includes("PIERCE")) {
    return tags.includes("BACKLINE") ? "BACKLINE" : "PIERCE_FRONT";
  }
  if (targetType === "SELF") {
    return "SELF";
  }
  if (targetType === "ALLY") {
    return "ALLY";
  }
  if (targetType === "ALL_ALLIES") {
    return "ALL_ALLIES";
  }
  if (targetType === "ALL_ENEMIES") {
    return "AOE_ALL";
  }
  return "ANY_TARGETABLE";
}

export function isCombatMatrixEnabled() {
  return combatMatrixConfig.draftV2 || combatMatrixConfig.formationLinearV2 || combatMatrixConfig.fusionV2;
}
