import type { BattleState } from "../types";
import { resolveMatchRules } from "./match-rules";

export function startTurnClock(state: BattleState, now = Date.now()) {
  state.clock = state.clock ?? {
    turnStartedAt: now,
    timeBank: [resolveMatchRules(state).timeBankSec ?? 0, resolveMatchRules(state).timeBankSec ?? 0],
    consecutiveAuto: [0, 0],
  };
  state.clock.turnStartedAt = now;
}

export type TimeoutDecision = "WAIT" | "AUTO_CONFIRM" | "PASS" | "AFK_WARNING" | "AUTO_SURRENDER";

export function evaluateTimeout(state: BattleState, now = Date.now()): TimeoutDecision {
  const rules = resolveMatchRules(state);
  if (!rules.turnTimerSec) {
    return "WAIT";
  }
  const clock = state.clock;
  if (!clock) {
    return "WAIT";
  }
  const elapsed = Math.floor((now - clock.turnStartedAt) / 1000);
  if (elapsed < rules.turnTimerSec) {
    return "WAIT";
  }
  const extra = elapsed - rules.turnTimerSec;
  const bank = clock.timeBank[state.activeSide] ?? 0;
  if (extra < bank) {
    return "WAIT";
  }
  clock.timeBank[state.activeSide] = 0;
  const side = state.sides[state.activeSide];
  const hasQueue = (side.actionQueue?.length ?? 0) > 0;
  clock.consecutiveAuto[state.activeSide] += 1;
  const autos = clock.consecutiveAuto[state.activeSide] ?? 0;
  if (autos >= rules.afkTurnLimit) {
    return "AUTO_SURRENDER";
  }
  if (autos >= rules.afkWarningTurns) {
    return hasQueue ? "AUTO_CONFIRM" : "AFK_WARNING";
  }
  return hasQueue ? "AUTO_CONFIRM" : "PASS";
}

export function resetAutoTurns(state: BattleState, side: 0 | 1) {
  if (state.clock) {
    state.clock.consecutiveAuto[side] = 0;
  }
}

export function consumeTimeBank(state: BattleState, now = Date.now()) {
  const rules = resolveMatchRules(state);
  if (!rules.turnTimerSec || !state.clock) {
    return;
  }
  const elapsed = Math.floor((now - state.clock.turnStartedAt) / 1000);
  if (elapsed > rules.turnTimerSec) {
    const used = elapsed - rules.turnTimerSec;
    state.clock.timeBank[state.activeSide] = Math.max(0, (state.clock.timeBank[state.activeSide] ?? 0) - used);
  }
}
