/** Combat V1.5 — MatchRules, registries e flags. Casual e Ranked compartilham o mesmo engine. */

export const COMBAT_V15_ENGINE = "gxr-combat-v1.5" as const;
export const RANKED_RULESET_VERSION = "S1.V1" as const;

export const combatV15Flags = {
  actionQueue: true,
  reactionSlot: true,
  resonance: true,
  rankedDraft: true,
  casualLab: false,
} as const;

export type MatchMode = "CASUAL" | "RANKED" | "PVE" | "LAB";

export type RetargetPolicy = "NONE" | "NEAREST_VALID" | "SAME_LINE" | "LOWEST_HP_VALID" | "MARKED_VALID";

export type ResonanceActionId = "RESONANCE_SHIFT" | "GENETIC_DRAW" | "RESONANCE_AMPLIFY";

export type VisibleRank = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND" | "MASTER" | "GENESIS";

export type BattlePressureTier = 0 | 1 | 2 | 3;

export type MatchRules = {
  mode: MatchMode;
  engineVersion: typeof COMBAT_V15_ENGINE;
  rulesVersion: string;
  turnTimerSec: number | null;
  timeBankSec: number | null;
  hintsEnabled: boolean;
  hintsVerbose: boolean;
  draftEnabled: boolean;
  mmrEnabled: boolean;
  labModifiers: string[];
  actionQueueEnabled: boolean;
  reactionSlotEnabled: boolean;
  resonanceEnabled: boolean;
  formationCollapse: boolean;
  battlePressure: { i: number; ii: number; iii: number };
  maxResonance: number;
  maxReactionDepth: number;
  surrenderMinRound: number;
  afkTurnLimit: number;
  afkWarningTurns: number;
};

export const combatV15Config = {
  engineVersion: COMBAT_V15_ENGINE,
  rankedRuleset: RANKED_RULESET_VERSION,
  maxResonance: 3,
  maxReactionDepth: 3,
  turnTimerSec: 45,
  timeBankSec: 120,
  pressureRounds: { i: 12, ii: 15, iii: 18 } as const,
  healEfficiency: [1, 0.75, 0.5, 0.35] as const,
  shieldEfficiency: [1, 0.8, 0.55, 0.35] as const,
  resolveDurationCut: [1, 0.5, 0.25] as const,
  hardControls: ["STUN", "FREEZE", "HARD_ROOT", "SILENCE"] as const,
  reactionTypes: ["REACTION", "COUNTER", "INTERCEPT"] as const,
  visibleRanks: ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND", "MASTER", "GENESIS"] as const,
  mmrBands: [0, 900, 1100, 1300, 1500, 1700, 1900] as const,
} as const;

export function matchRulesFor(mode: MatchMode, overrides: Partial<MatchRules> = {}): MatchRules {
  const ranked = mode === "RANKED";
  const lab = mode === "LAB";
  const base: MatchRules = {
    mode,
    engineVersion: COMBAT_V15_ENGINE,
    rulesVersion: ranked ? RANKED_RULESET_VERSION : mode === "PVE" ? "PVE.V1" : "CASUAL.V1",
    turnTimerSec: ranked ? combatV15Config.turnTimerSec : null,
    timeBankSec: ranked ? combatV15Config.timeBankSec : null,
    hintsEnabled: mode === "CASUAL" || mode === "PVE",
    hintsVerbose: mode === "CASUAL" || mode === "PVE",
    draftEnabled: ranked || lab,
    mmrEnabled: ranked,
    labModifiers: lab ? [] : [],
    actionQueueEnabled: combatV15Flags.actionQueue,
    reactionSlotEnabled: combatV15Flags.reactionSlot,
    resonanceEnabled: combatV15Flags.resonance,
    formationCollapse: true,
    battlePressure: { ...combatV15Config.pressureRounds },
    maxResonance: combatV15Config.maxResonance,
    maxReactionDepth: combatV15Config.maxReactionDepth,
    surrenderMinRound: ranked ? 2 : 0,
    afkTurnLimit: ranked ? 3 : 6,
    afkWarningTurns: ranked ? 2 : 4,
  };
  return { ...base, ...overrides, labModifiers: overrides.labModifiers ?? base.labModifiers };
}

export function pressureTier(round: number, rules: Pick<MatchRules, "battlePressure">): BattlePressureTier {
  if (round >= rules.battlePressure.iii) return 3;
  if (round >= rules.battlePressure.ii) return 2;
  if (round >= rules.battlePressure.i) return 1;
  return 0;
}

export function pressureHealMul(tier: BattlePressureTier): number {
  return combatV15Config.healEfficiency[tier] ?? 1;
}

export function pressureShieldMul(tier: BattlePressureTier): number {
  return combatV15Config.shieldEfficiency[tier] ?? 1;
}

export function visibleRankFromMmr(mmr: number): VisibleRank {
  const bands = combatV15Config.mmrBands;
  const ranks = combatV15Config.visibleRanks;
  let index = 0;
  for (let i = 0; i < bands.length; i += 1) {
    if (mmr >= bands[i]!) index = i;
  }
  return ranks[Math.min(index, ranks.length - 1)] ?? "BRONZE";
}

export type StatusStackMode = "STACK" | "REFRESH" | "BUILDUP" | "UNIQUE";

export type StatusDefinition = {
  key: string;
  namePt: string;
  stackMode: StatusStackMode;
  maxStacks: number;
  duration: number;
  tickTiming: "END_OF_TURN" | "START_OF_TURN" | "NONE";
  dispellable: boolean;
  resistible: boolean;
  family?: "FROST" | "CONTROL" | "DOT" | "MARK" | "GUARD" | "BUFF";
  buildupInto?: string;
  buildupAt?: number;
  hardControl?: boolean;
};

export const statusRegistry: readonly StatusDefinition[] = [
  { key: "BURN", namePt: "Queimadura", stackMode: "STACK", maxStacks: 5, duration: 2, tickTiming: "END_OF_TURN", dispellable: true, resistible: true, family: "DOT" },
  { key: "WET", namePt: "Molhado", stackMode: "REFRESH", maxStacks: 3, duration: 2, tickTiming: "NONE", dispellable: true, resistible: true },
  { key: "SHOCK", namePt: "Choque", stackMode: "STACK", maxStacks: 3, duration: 2, tickTiming: "NONE", dispellable: true, resistible: true },
  { key: "FROST", namePt: "Geada", stackMode: "BUILDUP", maxStacks: 3, duration: 3, tickTiming: "NONE", dispellable: true, resistible: true, family: "FROST", buildupInto: "FREEZE", buildupAt: 3 },
  { key: "FREEZE", namePt: "Congelado", stackMode: "UNIQUE", maxStacks: 1, duration: 1, tickTiming: "NONE", dispellable: true, resistible: true, family: "CONTROL", hardControl: true },
  { key: "POISON", namePt: "Veneno", stackMode: "STACK", maxStacks: 5, duration: 2, tickTiming: "END_OF_TURN", dispellable: true, resistible: true, family: "DOT" },
  { key: "BLEED", namePt: "Sangramento", stackMode: "STACK", maxStacks: 4, duration: 2, tickTiming: "END_OF_TURN", dispellable: true, resistible: true, family: "DOT" },
  { key: "CRACKED", namePt: "Rachado", stackMode: "REFRESH", maxStacks: 3, duration: 2, tickTiming: "NONE", dispellable: true, resistible: true },
  { key: "MARKED", namePt: "Marcado", stackMode: "REFRESH", maxStacks: 2, duration: 2, tickTiming: "NONE", dispellable: true, resistible: true, family: "MARK" },
  { key: "ROOTED", namePt: "Enraizado", stackMode: "REFRESH", maxStacks: 1, duration: 1, tickTiming: "NONE", dispellable: true, resistible: true },
  { key: "HARD_ROOT", namePt: "Raiz pesada", stackMode: "UNIQUE", maxStacks: 1, duration: 1, tickTiming: "NONE", dispellable: true, resistible: true, family: "CONTROL", hardControl: true },
  { key: "EXPOSED", namePt: "Exposto", stackMode: "REFRESH", maxStacks: 2, duration: 2, tickTiming: "NONE", dispellable: true, resistible: true },
  { key: "REGEN", namePt: "Regeneração", stackMode: "STACK", maxStacks: 3, duration: 2, tickTiming: "START_OF_TURN", dispellable: true, resistible: false, family: "BUFF" },
  { key: "SHIELD", namePt: "Escudo", stackMode: "STACK", maxStacks: 1, duration: 2, tickTiming: "NONE", dispellable: true, resistible: false, family: "GUARD" },
  { key: "BLIND", namePt: "Cegueira", stackMode: "REFRESH", maxStacks: 1, duration: 1, tickTiming: "NONE", dispellable: true, resistible: true },
  { key: "SLOW", namePt: "Lentidão", stackMode: "STACK", maxStacks: 3, duration: 2, tickTiming: "NONE", dispellable: true, resistible: true },
  { key: "HASTE", namePt: "Ímpeto", stackMode: "REFRESH", maxStacks: 2, duration: 2, tickTiming: "NONE", dispellable: true, resistible: false, family: "BUFF" },
  { key: "WEAKENED", namePt: "Enfraquecido", stackMode: "REFRESH", maxStacks: 2, duration: 2, tickTiming: "NONE", dispellable: true, resistible: true },
  { key: "FORTIFIED", namePt: "Fortificado", stackMode: "REFRESH", maxStacks: 2, duration: 2, tickTiming: "NONE", dispellable: true, resistible: false, family: "BUFF" },
  { key: "STUN", namePt: "Atordoado", stackMode: "UNIQUE", maxStacks: 1, duration: 1, tickTiming: "NONE", dispellable: true, resistible: true, family: "CONTROL", hardControl: true },
  { key: "SILENCE", namePt: "Silêncio", stackMode: "UNIQUE", maxStacks: 1, duration: 1, tickTiming: "NONE", dispellable: true, resistible: true, family: "CONTROL", hardControl: true },
  { key: "RESOLVE", namePt: "Resolve", stackMode: "STACK", maxStacks: 2, duration: 2, tickTiming: "END_OF_TURN", dispellable: false, resistible: false },
  { key: "MOLTEN", namePt: "Fundido", stackMode: "REFRESH", maxStacks: 2, duration: 2, tickTiming: "NONE", dispellable: true, resistible: false },
  { key: "CONDUCTIVE", namePt: "Condutivo", stackMode: "REFRESH", maxStacks: 2, duration: 2, tickTiming: "NONE", dispellable: true, resistible: false },
  { key: "MAGMA", namePt: "Magma", stackMode: "REFRESH", maxStacks: 2, duration: 2, tickTiming: "NONE", dispellable: true, resistible: false },
  { key: "HUNT", namePt: "Caçada", stackMode: "REFRESH", maxStacks: 2, duration: 2, tickTiming: "NONE", dispellable: true, resistible: false, family: "MARK" },
  { key: "GUARD", namePt: "Guarda", stackMode: "REFRESH", maxStacks: 1, duration: 2, tickTiming: "NONE", dispellable: true, resistible: false, family: "GUARD" },
  { key: "FOCUS", namePt: "Foco", stackMode: "STACK", maxStacks: 3, duration: 2, tickTiming: "NONE", dispellable: true, resistible: false, family: "BUFF" },
];

export function statusDefinition(key: string): StatusDefinition {
  return (
    statusRegistry.find((row) => row.key === key) ?? {
      key,
      namePt: key,
      stackMode: "STACK",
      maxStacks: 5,
      duration: 2,
      tickTiming: "END_OF_TURN",
      dispellable: true,
      resistible: true,
    }
  );
}

export type GeneticReactionRule = {
  key: string;
  inputs: readonly string[];
  output: string;
  textPt: string;
  requiresAuth?: readonly string[];
  advanced?: string;
  shield?: boolean;
};

export const geneticReactionRegistry: readonly GeneticReactionRule[] = [
  { key: "CONDUCTIVE", inputs: ["WET", "SHOCK"], output: "CONDUCTIVE", textPt: "Umidade conduz o choque.", advanced: "CHAIN_LIGHTNING" },
  { key: "MAGMA", inputs: ["BURN", "CRACKED"], output: "MAGMA", textPt: "Brasa + pedra rachada viram magma.", advanced: "ERUPT" },
  { key: "SHATTER", inputs: ["FROST", "CRACKED"], output: "EXPOSED", textPt: "Gelo sobre armadura quebrada estilhaça.", advanced: "SHATTER_BURST" },
  { key: "HUNT", inputs: ["MARKED", "EXPOSED"], output: "HUNT", textPt: "Marca + exposição viram caçada.", advanced: "EXECUTE_MARK" },
  { key: "RETALIATION", inputs: ["FOCUS"], output: "MARKED", textPt: "Escudo com foco devolve a marca.", shield: true, advanced: "THORNS" },
  { key: "WET_ELECTRIC", inputs: ["WET", "ELECTRIC"], output: "CONDUCTIVE", textPt: "Água + elétrico → condutivo.", requiresAuth: ["SPARK", "TIDE"] },
];

export type TeamManifestRecipe = {
  key: string;
  namePt: string;
  tags: readonly string[];
  textPt: string;
};

export const teamManifestRecipes: readonly TeamManifestRecipe[] = [
  { key: "VOLCANIC_RESONANCE", namePt: "Ressonância Vulcânica", tags: ["FIRE", "EARTH", "TANK", "BURN"], textPt: "Fogo, terra e tanque exploram queimadura." },
  { key: "STORM_CONTROL", namePt: "Controle da Tempestade", tags: ["WATER", "ELECTRIC", "CONTROL"], textPt: "Água e elétrico abrem condutivo." },
];

export const assassinProperties = ["BACKLINE_ACCESS", "MARKED_PREY", "SHADOW_ENTRY", "ESCAPE_ROUTE"] as const;
export const tankProperties = ["INTERCEPT", "BODY_BLOCK", "RETALIATION", "LAST_BASTION"] as const;
