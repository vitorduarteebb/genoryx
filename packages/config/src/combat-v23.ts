import { TYPOLOGIES, type Typology } from "@nexora/types";
import type { FusionFamilyDef } from "./genetic-powers";

/** Combat V2.3 — Timing Engine + Mana do Embate. Não mistura Energy, Resonance nem recurso pessoal. */
export const COMBAT_V23_ENGINE = "gxr-combat-v2.3" as const;

export const TIMING_CLASSES = [
  "ACTION",
  "IMPETUS",
  "REACTION",
  "COUNTER",
  "PREPARATION",
  "CHANNEL",
  "RITUAL",
  "PASSIVE",
] as const;
export type TimingClass = (typeof TIMING_CLASSES)[number];

export const RESOLUTION_MODES = [
  "QUEUED",
  "STACKED",
  "IMMEDIATE",
  "DELAYED",
  "CHANNELLED",
  "PREPARED",
  "PASSIVE",
] as const;
export type ResolutionMode = (typeof RESOLUTION_MODES)[number];

export const STACK_SPEEDS = ["NORMAL", "FAST", "COUNTER_FAST"] as const;
export type StackSpeed = (typeof STACK_SPEEDS)[number];

export const EFFECT_DOMAINS = ["PHYSICAL", "ELEMENTAL", "ARCANE", "GENETIC", "HYBRID"] as const;
export type EffectDomain = (typeof EFFECT_DOMAINS)[number];

export const RESPONSE_WINDOWS = ["DECLARE", "PRE_IMPACT", "POST_IMPACT", "STATUS", "LETHAL", "FUSION"] as const;
export type ResponseWindow = (typeof RESPONSE_WINDOWS)[number];

export const INTERVENTION_OPS = [
  "CANCEL",
  "MITIGATE",
  "REDIRECT",
  "SUPPRESS",
  "AMPLIFY",
  "TRANSFORM",
  "ECHO",
  "DELAY",
  "SEAL",
  "INTERCEPT",
  "DODGE",
  "LAST_STAND",
] as const;
export type InterventionOp = (typeof INTERVENTION_OPS)[number];

export const TIMING_STYLES = ["AGGRESSIVE", "REACTIVE", "SETUP", "CONTROL"] as const;
export type TimingStyle = (typeof TIMING_STYLES)[number];

export type SurchargeProfile = {
  rootExtra: number;
  firstResponseExtra: number;
  stepAfterFirst: number;
};

export type ResolutionProfile = {
  timingClass: TimingClass;
  resolutionMode: ResolutionMode;
  stackSpeed: StackSpeed;
  opensStack: boolean;
  canJoinStack: boolean;
  responseWindows: ResponseWindow[];
  allowedResponses: InterventionOp[];
  interruptible: boolean;
  requiresSourceAlive: boolean;
  retargetPolicy: "NONE" | "NEAREST_VALID" | "SAME_LINE" | "LOWEST_HP_VALID" | "MARKED_VALID";
  fizzlePolicy: "CANCEL" | "RETARGET" | "PARTIAL";
  surchargeProfile: SurchargeProfile;
  effectDomain: EffectDomain;
  counterDomains: EffectDomain[];
  universalCounter: boolean;
  manaCost: number;
  impetusLimit: number;
  trigger?: string;
  interruptConditions: string[];
  visibility: "PUBLIC" | "HIDDEN";
  durationRounds?: number;
  channelRounds?: number;
  stackable: boolean;
  interventionOp?: InterventionOp;
};

export const combatV23Config = {
  engineVersion: COMBAT_V23_ENGINE,
  startingMana: 2,
  maxMana: 10,
  energyToMana: 1,
  defaultImpetusLimit: 1,
  priorityDeadlineMs: 5000,
  maxStackDepth: 8,
  neverNegativeSurcharge: true,
  surcharge: { rootExtra: 0, firstResponseExtra: 0, stepAfterFirst: 1 } satisfies SurchargeProfile,
  pveIntervention: { WILD: [0, 1], ELITE: [2, 4], BOSS: [6, 12] } as const,
  timingBudget: {
    ACTION: 0,
    IMPETUS: 6,
    REACTION: -3,
    COUNTER: 4,
    COUNTER_ANY: 14,
    PREPARATION: 1,
    CHANNEL: -4,
    RITUAL: -5,
    PASSIVE: 0,
  } satisfies Record<string, number>,
  tooltips: {
    IMPETUS:
      "Uma ação rápida que pode ser usada em janelas específicas durante a resolução. Ímpetos entram no topo da Guerra Mágica e possuem prioridade FAST.",
    INTERVENTION: "Uma carta usada para alterar uma ação que ainda não terminou de resolver.",
    PREPARATION: "Uma ação preparada antecipadamente que aguarda sua condição ser cumprida.",
    CHANNEL: "Uma habilidade poderosa que leva tempo para ser concluída e pode ser interrompida.",
  } as const,
} as const;

export const TIMING_LABEL_PT: Record<TimingClass, string> = {
  ACTION: "Ação",
  IMPETUS: "Ímpeto",
  REACTION: "Reação",
  COUNTER: "Contra",
  PREPARATION: "Preparação",
  CHANNEL: "Canalização",
  RITUAL: "Ritual",
  PASSIVE: "Passiva",
};

const DEFAULT_SURCHARGE: SurchargeProfile = combatV23Config.surcharge;

export function defaultResolutionProfile(timing: TimingClass, extras: Partial<ResolutionProfile> = {}): ResolutionProfile {
  const table: Record<TimingClass, Omit<ResolutionProfile, "timingClass">> = {
    ACTION: {
      resolutionMode: "QUEUED",
      stackSpeed: "NORMAL",
      opensStack: false,
      canJoinStack: false,
      responseWindows: ["DECLARE", "PRE_IMPACT"],
      allowedResponses: ["CANCEL", "MITIGATE", "REDIRECT", "INTERCEPT"],
      interruptible: true,
      requiresSourceAlive: true,
      retargetPolicy: "NONE",
      fizzlePolicy: "CANCEL",
      surchargeProfile: DEFAULT_SURCHARGE,
      effectDomain: "PHYSICAL",
      counterDomains: ["PHYSICAL", "ELEMENTAL", "ARCANE", "GENETIC", "HYBRID"],
      universalCounter: false,
      manaCost: 0,
      impetusLimit: combatV23Config.defaultImpetusLimit,
      interruptConditions: [],
      visibility: "PUBLIC",
      stackable: false,
    },
    IMPETUS: {
      resolutionMode: "STACKED",
      stackSpeed: "FAST",
      opensStack: false,
      canJoinStack: true,
      responseWindows: ["PRE_IMPACT", "DECLARE"],
      allowedResponses: ["CANCEL", "SEAL"],
      interruptible: true,
      requiresSourceAlive: true,
      retargetPolicy: "NEAREST_VALID",
      fizzlePolicy: "CANCEL",
      surchargeProfile: DEFAULT_SURCHARGE,
      effectDomain: "ELEMENTAL",
      counterDomains: ["ELEMENTAL", "ARCANE"],
      universalCounter: false,
      manaCost: 1,
      impetusLimit: combatV23Config.defaultImpetusLimit,
      interruptConditions: [],
      visibility: "PUBLIC",
      stackable: true,
    },
    REACTION: {
      resolutionMode: "STACKED",
      stackSpeed: "NORMAL",
      opensStack: false,
      canJoinStack: true,
      responseWindows: ["DECLARE", "PRE_IMPACT", "POST_IMPACT", "STATUS"],
      allowedResponses: ["MITIGATE", "SUPPRESS", "CANCEL"],
      interruptible: true,
      requiresSourceAlive: true,
      retargetPolicy: "NONE",
      fizzlePolicy: "CANCEL",
      surchargeProfile: DEFAULT_SURCHARGE,
      effectDomain: "ARCANE",
      counterDomains: ["ARCANE", "ELEMENTAL"],
      universalCounter: false,
      manaCost: 1,
      impetusLimit: combatV23Config.defaultImpetusLimit,
      trigger: "SELF_TARGETED_BY_ATTACK",
      interruptConditions: [],
      visibility: "PUBLIC",
      stackable: true,
    },
    COUNTER: {
      resolutionMode: "STACKED",
      stackSpeed: "COUNTER_FAST",
      opensStack: false,
      canJoinStack: true,
      responseWindows: ["DECLARE", "PRE_IMPACT"],
      allowedResponses: ["CANCEL", "MITIGATE", "REDIRECT", "SUPPRESS"],
      interruptible: true,
      requiresSourceAlive: true,
      retargetPolicy: "NONE",
      fizzlePolicy: "CANCEL",
      surchargeProfile: DEFAULT_SURCHARGE,
      effectDomain: "ARCANE",
      counterDomains: ["ARCANE", "ELEMENTAL", "PHYSICAL", "GENETIC", "HYBRID"],
      universalCounter: false,
      manaCost: 1,
      impetusLimit: combatV23Config.defaultImpetusLimit,
      trigger: "STACK_FRAME",
      interruptConditions: [],
      visibility: "PUBLIC",
      stackable: true,
      interventionOp: "CANCEL",
    },
    PREPARATION: {
      resolutionMode: "PREPARED",
      stackSpeed: "NORMAL",
      opensStack: false,
      canJoinStack: false,
      responseWindows: ["DECLARE"],
      allowedResponses: [],
      interruptible: true,
      requiresSourceAlive: true,
      retargetPolicy: "NONE",
      fizzlePolicy: "CANCEL",
      surchargeProfile: DEFAULT_SURCHARGE,
      effectDomain: "PHYSICAL",
      counterDomains: [],
      universalCounter: false,
      manaCost: 0,
      impetusLimit: combatV23Config.defaultImpetusLimit,
      interruptConditions: [],
      visibility: "PUBLIC",
      durationRounds: 2,
      stackable: false,
    },
    CHANNEL: {
      resolutionMode: "CHANNELLED",
      stackSpeed: "NORMAL",
      opensStack: true,
      canJoinStack: false,
      responseWindows: ["DECLARE", "STATUS"],
      allowedResponses: ["CANCEL", "DELAY", "SEAL"],
      interruptible: true,
      requiresSourceAlive: true,
      retargetPolicy: "NONE",
      fizzlePolicy: "CANCEL",
      surchargeProfile: DEFAULT_SURCHARGE,
      effectDomain: "GENETIC",
      counterDomains: ["GENETIC", "ARCANE"],
      universalCounter: false,
      manaCost: 0,
      impetusLimit: combatV23Config.defaultImpetusLimit,
      interruptConditions: ["STUN", "SILENCE", "DISRUPT", "SOURCE_DEAD"],
      visibility: "PUBLIC",
      channelRounds: 2,
      stackable: true,
    },
    RITUAL: {
      resolutionMode: "QUEUED",
      stackSpeed: "NORMAL",
      opensStack: true,
      canJoinStack: true,
      responseWindows: ["DECLARE", "PRE_IMPACT"],
      allowedResponses: ["CANCEL", "MITIGATE", "SUPPRESS", "REDIRECT", "DELAY", "SEAL"],
      interruptible: true,
      requiresSourceAlive: true,
      retargetPolicy: "NONE",
      fizzlePolicy: "CANCEL",
      surchargeProfile: DEFAULT_SURCHARGE,
      effectDomain: "ARCANE",
      counterDomains: ["ARCANE", "ELEMENTAL", "GENETIC"],
      universalCounter: false,
      manaCost: 0,
      impetusLimit: combatV23Config.defaultImpetusLimit,
      interruptConditions: [],
      visibility: "PUBLIC",
      stackable: true,
    },
    PASSIVE: {
      resolutionMode: "PASSIVE",
      stackSpeed: "NORMAL",
      opensStack: false,
      canJoinStack: false,
      responseWindows: [],
      allowedResponses: [],
      interruptible: false,
      requiresSourceAlive: false,
      retargetPolicy: "NONE",
      fizzlePolicy: "CANCEL",
      surchargeProfile: DEFAULT_SURCHARGE,
      effectDomain: "GENETIC",
      counterDomains: [],
      universalCounter: false,
      manaCost: 0,
      impetusLimit: 0,
      interruptConditions: [],
      visibility: "PUBLIC",
      stackable: false,
    },
  };
  return { timingClass: timing, ...table[timing], ...extras };
}

export function interventionSurchargeV23(responseIndex: number, modifier = 0): number {
  const extra =
    responseIndex <= 0
      ? combatV23Config.surcharge.rootExtra
      : responseIndex === 1
        ? combatV23Config.surcharge.firstResponseExtra
        : combatV23Config.surcharge.firstResponseExtra + combatV23Config.surcharge.stepAfterFirst * (responseIndex - 1);
  return Math.max(0, extra + modifier);
}

export function convertEnergyToMana(energyLeft: number, currentMana: number): { mana: number; converted: number } {
  const converted = Math.max(0, Math.floor(energyLeft) * combatV23Config.energyToMana);
  const mana = Math.min(combatV23Config.maxMana, Math.max(0, currentMana) + converted);
  return { mana, converted: mana - Math.min(combatV23Config.maxMana, Math.max(0, currentMana)) };
}

const PAIR_NAMES: Record<string, { key: string; name: string; namePt: string; textPt: string; effects: FusionFamilyDef["effects"] }> = {
  "BURN+TANK": {
    key: "LIVING_FURNACE",
    name: "Living Furnace",
    namePt: "Fornalha Viva",
    textPt: "Aliados ganham escudo. Inimigos recebem Burn.",
    effects: [
      { op: "SHIELD", value: 12 },
      { op: "APPLY_STATUS", status: "BURN", duration: 2 },
    ],
  },
  "BURN+HEAL": {
    key: "VITAL_ASHES",
    name: "Vital Ashes",
    namePt: "Cinzas Vitais",
    textPt: "Parte do dano de Burn desta janela vira cura. Sem loop.",
    effects: [
      { op: "DAMAGE", value: 10 },
      { op: "HEAL", value: 8 },
    ],
  },
  "BURN+CONTROL": {
    key: "INCANDESCENT_MARK",
    name: "Incandescent Mark",
    namePt: "Marca Incandescente",
    textPt: "Burn + Slow. Impede cleanse simples neste round.",
    effects: [
      { op: "APPLY_STATUS", status: "BURN", duration: 3 },
      { op: "APPLY_STATUS", status: "SLOW", duration: 2 },
    ],
  },
  "HEAL+TANK": {
    key: "LIVING_BASTION",
    name: "Living Bastion",
    namePt: "Bastião Vivo",
    textPt: "Escudo e cura nos aliados da frente.",
    effects: [
      { op: "SHIELD", value: 14 },
      { op: "HEAL", value: 10 },
    ],
  },
  "CONTROL+HEAL": {
    key: "CONTROLLED_REGENERATION",
    name: "Controlled Regeneration",
    namePt: "Regeneração Controlada",
    textPt: "Cura + mitigação. Protege contra o próximo controle.",
    effects: [
      { op: "HEAL", value: 12 },
      { op: "APPLY_STATUS", status: "WARD", duration: 2 },
    ],
  },
  "BURN+CRITICAL": {
    key: "MAGMA_CORE",
    name: "Magma Core",
    namePt: "Núcleo de Magma",
    textPt: "Fusão interruptível. Burn explode em dano genético.",
    effects: [
      { op: "DAMAGE", value: 16 },
      { op: "APPLY_STATUS", status: "BURN", duration: 2 },
    ],
  },
};

function pairKey(a: Typology, b: Typology): string {
  return [a, b].sort().join("+");
}

function generatedPairRecipe(a: Typology, b: Typology): FusionFamilyDef {
  const named = PAIR_NAMES[pairKey(a, b)];
  if (named) {
    return {
      key: named.key,
      name: named.name,
      namePt: named.namePt,
      typologies: [a, b].sort() as Typology[],
      condition: { minRound: 5, minResonance: 4 },
      effects: named.effects,
      textPt: named.textPt,
    };
  }
  return {
    key: `FUSION_${a}_${b}`,
    name: `${a} ${b} Core`,
    namePt: `Núcleo ${a} · ${b}`,
    typologies: [a, b],
    condition: { minRound: 5, minResonance: 4 },
    effects: [
      { op: "DAMAGE", value: 10 },
      { op: "APPLY_STATUS", status: "MARKED", duration: 2 },
    ],
    textPt: `Fusão ${a} + ${b}. Entra no mesmo resolver da Guerra Mágica.`,
  };
}

function allTypologyPairs(): FusionFamilyDef[] {
  const recipes: FusionFamilyDef[] = [];
  for (let i = 0; i < TYPOLOGIES.length; i += 1) {
    for (let j = i + 1; j < TYPOLOGIES.length; j += 1) {
      recipes.push(generatedPairRecipe(TYPOLOGIES[i]!, TYPOLOGIES[j]!));
    }
  }
  return recipes;
}

/** 105 pares únicos (C(15,2)). As 6 famílias históricas mantêm a chave canônica. */
export const fusionRecipesV23: readonly FusionFamilyDef[] = allTypologyPairs();

export const TRIPLE_FUSION_RECIPES: readonly FusionFamilyDef[] = [
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

export function fusionCatalogV23(): readonly FusionFamilyDef[] {
  return [...fusionRecipesV23, ...TRIPLE_FUSION_RECIPES];
}

export function locusTimingHint(locus: string): TimingClass {
  if (locus === "G1" || locus === "G2") return "ACTION";
  if (locus === "G3" || locus === "G4") return "ACTION";
  if (locus === "G5" || locus === "G6") return "IMPETUS";
  if (locus === "G7") return "REACTION";
  if (locus === "G8") return "CHANNEL";
  if (locus === "G9") return "ACTION";
  if (locus === "G10") return "RITUAL";
  return "ACTION";
}
