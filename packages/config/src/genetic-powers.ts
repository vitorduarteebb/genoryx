import type { Element, GeneticCardLocusKey, Typology } from "@nexora/types";
import { cardCatalog } from "./cards";

export const geneticPowerConfig = {
  enabled: process.env.GENETIC_POWER_V1 === "true",
  inheritanceSides: 3,
  fusionUnlockRound: 5,
  tripleFusionMinRound: 7,
  maxDoubleFusionCandidates: 3,
  resonancePlay: 1,
  resonanceCombo: 2,
  resonanceThreshold: 4,
  tripleResonanceThreshold: 10,
  tripleMomentumThreshold: 3,
  maxTriggerDepth: 3,
  similarityReroll: 0.9,
  maxNewPowerAttempts: 6,
  functionalTypologies: ["BURN", "TANK", "HEAL", "CONTROL", "CRITICAL"] as const satisfies readonly Typology[],
} as const;

export type PowerMechanic =
  | "APPLY_BURN"
  | "AMPLIFY_BURN"
  | "APPLY_SHIELD"
  | "FORTIFY"
  | "HEAL"
  | "REGENERATE"
  | "APPLY_SLOW"
  | "LOCK_STATUS"
  | "CRIT_WINDOW"
  | "SPREAD_STATUS"
  | "GAIN_ENERGY"
  | "GAIN_MOMENTUM";

export type PowerTrigger = "ON_PLAY" | "ON_BURN_TICK" | "ON_HIT" | "ON_ALLY_HEAL" | "ON_ROUND_START" | "REACTION";
export type PowerResource = "HEAT" | "BARK" | "STONE" | "TIDE" | "RESONANCE" | "NONE";
export type PowerRisk = "NONE" | "SELF_DAMAGE_OPTIONAL" | "DELAYED_COST" | "EXPOSE";
export type PowerTarget = "ENEMY" | "SELF" | "ALLIES" | "ALL_ENEMIES" | "MIXED";

export type GeneticPowerGenome = {
  key: string;
  name: string;
  namePt: string;
  element: Element;
  typology: Typology;
  powerTheme: string;
  primaryMechanic: PowerMechanic;
  secondaryMechanic: PowerMechanic;
  resourceInteraction: PowerResource;
  targetPattern: PowerTarget;
  scalingPattern: "LINEAR" | "STACK" | "WINDOW";
  triggerPattern: PowerTrigger;
  riskPattern: PowerRisk;
  signatureModifier: string;
};

export type SeedPower = GeneticPowerGenome & {
  speciesKeys: readonly string[];
};

export const seedGeneticPowers: readonly SeedPower[] = [
  {
    key: "INCANDESCENT_HEART",
    name: "Incandescent Heart",
    namePt: "Coração Incandescente",
    element: "FIRE",
    typology: "BURN",
    powerTheme: "furnace",
    primaryMechanic: "APPLY_BURN",
    secondaryMechanic: "AMPLIFY_BURN",
    resourceInteraction: "HEAT",
    targetPattern: "ENEMY",
    scalingPattern: "STACK",
    triggerPattern: "ON_BURN_TICK",
    riskPattern: "SELF_DAMAGE_OPTIONAL",
    signatureModifier: "BURN_EXPLOSION",
    speciesKeys: ["pyron", "drakor"],
  },
  {
    key: "SYMBIOTIC_GROVE",
    name: "Symbiotic Grove",
    namePt: "Bosque Simbiótico",
    element: "NATURE",
    typology: "HEAL",
    powerTheme: "grove",
    primaryMechanic: "HEAL",
    secondaryMechanic: "APPLY_SHIELD",
    resourceInteraction: "BARK",
    targetPattern: "ALLIES",
    scalingPattern: "LINEAR",
    triggerPattern: "ON_ALLY_HEAL",
    riskPattern: "NONE",
    signatureModifier: "ROOT_NETWORK",
    speciesKeys: ["florune"],
  },
  {
    key: "STONE_CORE",
    name: "Stone Core",
    namePt: "Núcleo Pétreo",
    element: "EARTH",
    typology: "TANK",
    powerTheme: "bedrock",
    primaryMechanic: "APPLY_SHIELD",
    secondaryMechanic: "FORTIFY",
    resourceInteraction: "STONE",
    targetPattern: "SELF",
    scalingPattern: "LINEAR",
    triggerPattern: "ON_HIT",
    riskPattern: "EXPOSE",
    signatureModifier: "MOUNTAIN_CRASH",
    speciesKeys: ["terranox", "grumak"],
  },
  {
    key: "CONSCIOUS_TIDE",
    name: "Conscious Tide",
    namePt: "Maré Consciente",
    element: "WATER",
    typology: "CONTROL",
    powerTheme: "tide",
    primaryMechanic: "APPLY_SLOW",
    secondaryMechanic: "HEAL",
    resourceInteraction: "TIDE",
    targetPattern: "MIXED",
    scalingPattern: "WINDOW",
    triggerPattern: "ON_PLAY",
    riskPattern: "DELAYED_COST",
    signatureModifier: "TIDAL_LOCK",
    speciesKeys: ["nympha", "aqualis", "noctyr"],
  },
  {
    key: "PRECISION_CORE",
    name: "Precision Core",
    namePt: "Núcleo de Precisão",
    element: "ELECTRIC",
    typology: "CRITICAL",
    powerTheme: "edge",
    primaryMechanic: "CRIT_WINDOW",
    secondaryMechanic: "GAIN_MOMENTUM",
    resourceInteraction: "NONE",
    targetPattern: "ENEMY",
    scalingPattern: "WINDOW",
    triggerPattern: "ON_HIT",
    riskPattern: "EXPOSE",
    signatureModifier: "EXECUTE",
    speciesKeys: ["voltaris", "sparkyn"],
  },
];

export type FusionFamilyDef = {
  key: string;
  name: string;
  namePt: string;
  typologies: readonly Typology[];
  triple?: boolean;
  condition: {
    minRound: number;
    minResonance: number;
    minMomentum?: number;
  };
  effects: readonly { op: "DAMAGE" | "HEAL" | "SHIELD" | "APPLY_STATUS"; value?: number; status?: string; duration?: number }[];
  textPt: string;
};

export const fusionFamilies: readonly FusionFamilyDef[] = [
  {
    key: "LIVING_FURNACE",
    name: "Living Furnace",
    namePt: "Fornalha Viva",
    typologies: ["BURN", "TANK"],
    condition: { minRound: 5, minResonance: 4 },
    effects: [
      { op: "SHIELD", value: 12 },
      { op: "APPLY_STATUS", status: "BURN", duration: 2 },
    ],
    textPt: "Aliados ganham escudo. Inimigos recebem Burn.",
  },
  {
    key: "VITAL_ASHES",
    name: "Vital Ashes",
    namePt: "Cinzas Vitais",
    typologies: ["BURN", "HEAL"],
    condition: { minRound: 5, minResonance: 4 },
    effects: [
      { op: "DAMAGE", value: 10 },
      { op: "HEAL", value: 8 },
    ],
    textPt: "Parte do dano de Burn desta janela vira cura. Sem loop.",
  },
  {
    key: "INCANDESCENT_MARK",
    name: "Incandescent Mark",
    namePt: "Marca Incandescente",
    typologies: ["BURN", "CONTROL"],
    condition: { minRound: 5, minResonance: 4 },
    effects: [
      { op: "APPLY_STATUS", status: "BURN", duration: 3 },
      { op: "APPLY_STATUS", status: "SLOW", duration: 2 },
    ],
    textPt: "Burn + Slow. Impede cleanse simples neste round.",
  },
  {
    key: "LIVING_BASTION",
    name: "Living Bastion",
    namePt: "Bastião Vivo",
    typologies: ["TANK", "HEAL"],
    condition: { minRound: 5, minResonance: 4 },
    effects: [
      { op: "SHIELD", value: 14 },
      { op: "HEAL", value: 10 },
    ],
    textPt: "Escudo e cura nos aliados da frente.",
  },
  {
    key: "CONTROLLED_REGENERATION",
    name: "Controlled Regeneration",
    namePt: "Regeneração Controlada",
    typologies: ["HEAL", "CONTROL"],
    condition: { minRound: 5, minResonance: 4 },
    effects: [
      { op: "HEAL", value: 12 },
      { op: "APPLY_STATUS", status: "WARD", duration: 2 },
    ],
    textPt: "Cura + mitigação. Protege contra o próximo controle.",
  },
  {
    key: "PHOENIX_CYCLE",
    name: "Phoenix Cycle",
    namePt: "Ciclo da Fênix",
    typologies: ["BURN", "HEAL", "CONTROL"],
    triple: true,
    condition: { minRound: 7, minResonance: 10, minMomentum: 3 },
    effects: [
      { op: "DAMAGE", value: 16 },
      { op: "HEAL", value: 12 },
      { op: "APPLY_STATUS", status: "SLOW", duration: 2 },
    ],
    textPt: "DoT, sustain e controle. Uma vez por batalha.",
  },
];

export const effectBudgetByLocus: Record<GeneticCardLocusKey, { cost: number; budget: number }> = {
  G1: { cost: 1, budget: 16 },
  G2: { cost: 1, budget: 18 },
  G3: { cost: 2, budget: 22 },
  G4: { cost: 1, budget: 16 },
  G5: { cost: 1, budget: 14 },
  G6: { cost: 2, budget: 22 },
  G7: { cost: 1, budget: 16 },
  G8: { cost: 1, budget: 14 },
  G9: { cost: 2, budget: 28 },
  G10: { cost: 3, budget: 36 },
};

export const effectBudgetWeights = {
  DAMAGE: 1,
  HEAL: 1.1,
  SHIELD: 0.9,
  APPLY_STATUS: 6,
  REMOVE_STATUS: 5,
  DRAW: 8,
  GAIN_ENERGY: 10,
  GAIN_MOMENTUM: 8,
  GAIN_RESOURCE: 4,
  CONSUME_RESOURCE: 0,
} as const;

export function seedPowerForSpecies(speciesKey: string): SeedPower | null {
  return seedGeneticPowers.find((row) => row.speciesKeys.includes(speciesKey)) ?? null;
}

export function existingCardsForSpecies(speciesKey: string) {
  return cardCatalog.filter((card) => card.species.includes(speciesKey));
}
