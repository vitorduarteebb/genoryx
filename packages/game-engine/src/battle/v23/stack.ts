import { combatV23Config, interventionSurchargeV23 } from "@nexora/config";
import type { BattleSide } from "../types";
import type { StackFrame } from "./types";
import { trySpendMana } from "./mana";

export function emptyMagicWar(): import("./types").MagicWarState {
  return {
    open: false,
    window: null,
    frames: [],
    prioritySide: 0,
    passes: [false, false],
    priorityDeadline: combatV23Config.priorityDeadlineMs,
    autoPass: [false, false],
    remainingQueue: [],
    lock: false,
  };
}

export function stackDepth(frames: readonly StackFrame[]): number {
  return frames.length;
}

export function nextSurcharge(frames: readonly StackFrame[], modifier = 0): number {
  return interventionSurchargeV23(frames.length, modifier);
}

export function payStackMana(
  side: BattleSide,
  baseMana: number,
  frames: readonly StackFrame[],
  surchargeModifier = 0,
): { ok: true; paid: number; surcharge: number; manaBefore: number; manaAfter: number } | { ok: false; reason: "INSUFFICIENT_MANA" } {
  const surcharge = nextSurcharge(frames, surchargeModifier);
  const need = Math.max(0, baseMana + surcharge);
  const paid = trySpendMana(side, need);
  if (!paid.ok) return paid;
  return { ok: true, paid: need, surcharge, manaBefore: paid.manaBefore, manaAfter: paid.manaAfter };
}

export function pushFrame(frames: readonly StackFrame[], frame: StackFrame): StackFrame[] | { ok: false; reason: string } {
  if (frames.length >= combatV23Config.maxStackDepth) {
    return { ok: false, reason: "STACK_CAP" };
  }
  return [...frames, frame];
}

export function resolveLifo(frames: readonly StackFrame[]): StackFrame[] {
  return [...frames].reverse();
}

export function bothPassed(passes: [boolean, boolean]): boolean {
  return passes[0] && passes[1];
}
