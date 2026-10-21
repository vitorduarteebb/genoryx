import type { ChassisView } from "@nexora/config";
import type { BattleTeamSide } from "@nexora/game-engine";
import type { EggVisualInput } from "./egg-visual-controller";

export type CreatureVisualContext = "PROFILE" | "MARKET" | "BREEDING" | "BATTLE" | "HATCH" | "WORLD" | "CARD";
export type CreatureVisualState = "IDLE" | "BATTLE_IDLE" | "WALK" | "RUN" | "ATTACK" | "CAST" | "HIT" | "DEFEND" | "STATUS" | "DEATH" | "KO" | "VICTORY" | "HATCH" | "CLAW_SWIPE" | "TAIL_WHIP";
export type CreatureVisualInput = {
  chassis?: ChassisView | null; element?: string | null; lifeStage?: string | null;
  temperament?: string | null; visualSeed?: string | null; creatureId?: string | null;
  context?: CreatureVisualContext; animationState?: CreatureVisualState;
  animationKey?: string | number; modelUrl?: string | null; aura?: string | null;
  reducedMotion?: boolean; facing?: number;
  teamSide?: BattleTeamSide;
  bodyPlan?: string | null;
  egg?: EggVisualInput;
};
export const contextQuality = {
  PROFILE: { fps: 30, pixels: 680, priority: 3, aura: 18 },
  MARKET: { fps: 12, pixels: 240, priority: 1, aura: 0 },
  BREEDING: { fps: 20, pixels: 360, priority: 2, aura: 8 },
  BATTLE: { fps: 30, pixels: 420, priority: 3, aura: 10 },
  HATCH: { fps: 30, pixels: 520, priority: 3, aura: 18 },
  WORLD: { fps: 20, pixels: 280, priority: 2, aura: 6 },
  CARD: { fps: 8, pixels: 220, priority: 0, aura: 0 },
} as const;
export function visualGrowth(stage?: string | null) {
  switch (stage?.toUpperCase()) {
    case "BABY": return { stage: "BABY", scale: .72, head: 1.14, breathPeriod: 3.65, actionGain: .72 };
    case "YOUNG": case "JUVENILE": return { stage: "YOUNG", scale: .88, head: 1.015, breathPeriod: 4.05, actionGain: .88 };
    default: return { stage: "ADULT", scale: 1, head: .88, breathPeriod: 4.6, actionGain: 1 };
  }
}
export function visualIdentity(input: CreatureVisualInput) {
  // An identity for cache invalidation, never a genome generator or reroll.
  return JSON.stringify([input.chassis, input.modelUrl, input.element, input.lifeStage, input.temperament, input.visualSeed, input.creatureId, input.aura, input.teamSide, input.bodyPlan, input.facing]);
}
export const sourceClip: Partial<Record<CreatureVisualState, string>> = {
  IDLE: "GXR_Idle", BATTLE_IDLE: "GXR_Idle", WALK: "GXR_Walk", RUN: "GXR_Run",
  ATTACK: "GXR_Attack", CLAW_SWIPE: "GXR_ClawSwipe", TAIL_WHIP: "GXR_TailWhip",
  HIT: "GXR_Hit", CAST: "GXR_Roar", VICTORY: "GXR_Roar", HATCH: "GXR_Rest",
};
