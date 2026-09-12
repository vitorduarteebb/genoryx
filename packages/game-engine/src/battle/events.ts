import type { BattleVisualEventType } from "@nexora/types";
import type { BattleEvent } from "./types";

export type BattleVisualEvent = {
  type: BattleVisualEventType;
  actorSide?: number;
  cardKey?: string;
  targetId?: string;
  value?: number;
  text: string;
};

const LOG_TO_VISUAL: Record<string, BattleVisualEventType> = {
  CARD_PLAYED: "CARD_PLAYED",
  DAMAGE: "DAMAGE",
  HEAL: "HEAL",
  SHIELD: "SHIELD",
  STATUS: "STATUS_APPLIED",
  STATUS_APPLIED: "STATUS_APPLIED",
  STATUS_REMOVED: "STATUS_REMOVED",
  CREATURE_KO: "CREATURE_KO",
  CREATURE_MOVED: "CREATURE_MOVED",
  SYNERGY_TRIGGERED: "SYNERGY_TRIGGERED",
  ULTIMATE_TRIGGERED: "ULTIMATE_TRIGGERED",
  ROSTER_LOCKED: "ROSTER_LOCKED",
  CREATURE_BANNED: "CREATURE_BANNED",
  ACTIVE_TEAM_SELECTED: "ACTIVE_TEAM_SELECTED",
  FORMATION_SET: "FORMATION_SET",
  MIDDLE_WINDOW_CHANGED: "MIDDLE_WINDOW_CHANGED",
  FORMATION_COLLAPSED: "FORMATION_COLLAPSED",
  DECK_RECYCLED: "DECK_RECYCLED",
  RESONANCE_GAINED: "RESONANCE_GAINED",
  FUSION_AVAILABLE: "FUSION_AVAILABLE",
  FUSION_PLAYED: "FUSION_PLAYED",
  CONVERGENCE_AVAILABLE: "CONVERGENCE_AVAILABLE",
  CONVERGENCE_PLAYED: "CONVERGENCE_PLAYED",
  RESOURCE_GAIN: "RESOURCE_GAIN",
  RESOURCE_SPEND: "RESOURCE_SPEND",
  RESOURCE_MAX: "RESOURCE_MAX",
  RESOURCE_THRESHOLD: "RESOURCE_THRESHOLD",
  GENETIC_CHAIN: "GENETIC_CHAIN",
  TEAM_RESONANCE: "TEAM_RESONANCE",
  REACTION_ARMED: "REACTION_ARMED",
  REACTION_RESOLVED: "REACTION_RESOLVED",
  REACTION_EXPIRED: "REACTION_EXPIRED",
  BATTLE_PRESSURE: "BATTLE_PRESSURE",
  SUPREME_READY: "SUPREME_READY",
  ACTION_QUEUED: "ACTION_QUEUED",
  ACTION_CANCELLED: "ACTION_CANCELLED",
};

/** O engine produz o log. O renderer só consome este mapeamento. */
export function presentBattleEvents(log: readonly BattleEvent[]): BattleVisualEvent[] {
  const events: BattleVisualEvent[] = [];
  for (const row of log) {
    const type = LOG_TO_VISUAL[row.type];
    if (!type) {
      continue;
    }
    events.push({
      type,
      actorSide: row.actorSide,
      cardKey: row.cardKey,
      targetId: row.targetId,
      value: row.value,
      text: row.text,
    });
  }
  return events;
}
