import { combatV15Config, matchRulesFor, type MatchMode, type MatchRules } from "@nexora/config";
import type { BattleState } from "../types";

export function resolveMatchRules(state: Pick<BattleState, "type" | "matchRules" | "mapKey">): MatchRules {
  if (state.matchRules) {
    return state.matchRules;
  }
  if (state.mapKey === "lab") {
    return matchRulesFor("LAB");
  }
  if (state.mapKey === "ranked") {
    return matchRulesFor("RANKED");
  }
  return matchRulesFor(state.type === "PVP" ? "CASUAL" : "PVE");
}

export function defaultClock(rules: MatchRules, now = Date.now()): BattleState["clock"] {
  const bank = rules.timeBankSec ?? 0;
  return {
    turnStartedAt: now,
    timeBank: [bank, bank],
    consecutiveAuto: [0, 0],
  };
}

export function emptyTeamResonance(rules: MatchRules): NonNullable<BattleState["sides"][0]["teamResonance"]> {
  return {
    value: 0,
    max: rules.maxResonance ?? combatV15Config.maxResonance,
    ready: false,
    amplifyPending: false,
    gainedThisBattle: 0,
  };
}

export function emptyChain(): NonNullable<BattleState["sides"][0]["geneticChain"]> {
  return { links: [], maxLength: 0, lastTokens: [] };
}

export function inferMatchMode(state: Pick<BattleState, "type" | "matchRules" | "mapKey">): MatchMode {
  return resolveMatchRules(state).mode;
}
