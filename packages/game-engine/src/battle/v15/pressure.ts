import { pressureHealMul, pressureShieldMul, pressureTier } from "@nexora/config";
import type { BattleState } from "../types";
import { resolveMatchRules } from "./match-rules";

export function currentPressure(state: BattleState) {
  const rules = resolveMatchRules(state);
  const tier = pressureTier(state.round, rules);
  return {
    tier,
    healMul: pressureHealMul(tier),
    shieldMul: pressureShieldMul(tier),
    label: tier === 0 ? null : (`PRESSURE ${"I".repeat(tier)}` as const),
  };
}

export function scaleSustain(state: BattleState, amount: number, kind: "HEAL" | "SHIELD"): number {
  const pressure = currentPressure(state);
  const mul = kind === "HEAL" ? pressure.healMul : pressure.shieldMul;
  return Math.max(0, Math.round(amount * mul));
}

export function announcePressure(state: BattleState) {
  const pressure = currentPressure(state);
  if (!pressure.label) {
    return;
  }
  const already = state.log.some((row) => row.type === "BATTLE_PRESSURE" && row.text.includes(pressure.label!));
  if (already) {
    return;
  }
  state.log.push({
    type: "BATTLE_PRESSURE",
    text: `${pressure.label} · cura e escudo enfraquecem.`,
    value: pressure.tier,
  });
}
