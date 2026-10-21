import type { GeneRank } from "@nexora/types";

/** Combat Genome V2 + camada V2.4. Números só aqui. Resolver único. */
export const GENOME_ENGINE = "gxr-genome-v2.4" as const;

export const genomeCardSpeeds = ["VERY_FAST", "FAST", "NORMAL", "HEAVY"] as const;
export type GenomeCardSpeed = (typeof genomeCardSpeeds)[number];

export const genomeDomains = ["PHYSICAL", "MAGIC", "HYBRID", "UTILITY"] as const;
export type GenomeDomain = (typeof genomeDomains)[number];

export const genomeHooks = [
  "ON_TARGETED",
  "BEFORE_HIT",
  "ON_HIT",
  "AFTER_HIT",
  "ON_CRIT",
  "ON_DODGE",
  "ON_GUARD",
  "ON_GUARD_BREAK",
  "ON_STATUS_APPLIED",
  "ON_STATUS_REMOVED",
  "ON_ALLY_HIT",
  "ON_ALLY_LOW_HP",
  "ON_POSITION_CHANGED",
  "ON_RESOURCE_GAINED",
] as const;
export type GenomeHook = (typeof genomeHooks)[number];

export const genomeConditions = [
  "IF_TARGET_BURNING",
  "IF_TARGET_SHOCKED",
  "IF_TARGET_MARKED",
  "IF_SELF_FRONT",
  "IF_SELF_BACK",
  "IF_ACTS_BEFORE_TARGET",
  "IF_ACTS_AFTER_TARGET",
  "IF_CRIT",
  "IF_DODGED",
  "IF_TARGET_GUARDED",
  "IF_GUARD_BROKEN",
  "IF_ALLY_LOW_HP",
  "IF_SELF_LOW_HP",
  "IF_RESOURCE_AT_LEAST",
  "IF_PREC_GREATER_THAN_TARGET_EVA",
  "IF_MAG_GREATER_THAN_TARGET_RES",
  "IF_ATK_GREATER_THAN_TARGET_DEF",
  "IF_ALLY_APPLIED_STATUS_THIS_ROUND",
  "IF_TARGET_ALREADY_HIT_THIS_ROUND",
] as const;
export type GenomeCondition = (typeof genomeConditions)[number];

export const genomeV2 = {
  cardSpeedBonus: {
    VERY_FAST: 40,
    FAST: 20,
    NORMAL: 0,
    HEAVY: -25,
  } satisfies Record<GenomeCardSpeed, number>,
  hit: {
    base: 0.9,
    perPoint: 0.0025,
    floor: 0.72,
    ceiling: 0.99,
    perfectAimFloor: 0.97,
    aimBonus: 10,
    perfectAimBonus: 25,
    pointsPerRank: 10,
  },
  damage: {
    mitigationRate: 0.25,
    hybridWeight: 0.55,
    legacyScale: 0.35,
    predatorBonus: 1.2,
    healScale: 0.25,
    shieldScale: 0.25,
    frontShieldBonus: 0.3,
  },
  critDamageByRank: {
    F: 1.3,
    E: 1.4,
    D: 1.5,
    C: 1.6,
    B: 1.75,
    A: 1.9,
    S: 2.1,
    SS: 2.35,
  } satisfies Record<GeneRank, number>,
  breakpoints: {
    spdSOpening: 15,
    spdSsOpening: 20,
    atkSShieldIgnore: 0.25,
    magSOvercharge: 1.15,
    defSHeavyRatio: 0.25,
    defSReduction: 0.35,
    evaSCounterInitiative: 15,
    staEvolvedShieldTick: 0.5,
    staEvolvedShockDelay: 10,
    staEvolvedMarkBonus: 0.1,
    staEvolvedBuffShield: 0.1,
    staEvolvedPoisonStack: 1,
    statusRankGap: 2,
  },
  limits: {
    maxReactionDepth: 4,
    maxResourceGainPerPlay: 3,
    maxDrawPerPlay: 2,
    maxRepeatPerCard: 1,
    maxStatusDuration: 6,
    maxStatusPotency: 12,
    maxShieldFromCard: 80,
    lowHpRatio: 0.35,
    executeHpRatio: 0.35,
  },
  counterplay: {
    markEvaPenalty: 8,
  },
  speedLabel: {
    VERY_FAST: "Muito rápida",
    FAST: "Rápida",
    NORMAL: "Normal",
    HEAVY: "Pesada",
  } satisfies Record<GenomeCardSpeed, string>,
  domainLabel: {
    PHYSICAL: "Físico",
    MAGIC: "Mágico",
    HYBRID: "Híbrido",
    UTILITY: "Utilidade",
  } satisfies Record<GenomeDomain, string>,
} as const;
