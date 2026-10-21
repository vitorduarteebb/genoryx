import { combatV23Config, convertEnergyToMana } from "@nexora/config";
import type { BattleSide } from "../types";
import { availableEnergy } from "../v15/action-queue";

export function ensureMana(side: BattleSide): BattleSide {
  if (typeof side.mana !== "number") {
    side.mana = combatV23Config.startingMana;
  }
  if (typeof side.maxMana !== "number") {
    side.maxMana = combatV23Config.maxMana;
  }
  return side;
}

export function reservePreview(side: BattleSide): { leftover: number; manaGain: number; overcommit: boolean } {
  ensureMana(side);
  const leftover = availableEnergy(side);
  const current = side.mana ?? combatV23Config.startingMana;
  const next = convertEnergyToMana(leftover, current);
  return {
    leftover,
    manaGain: next.converted,
    overcommit: leftover === 0 && (side.mana ?? 0) < 3,
  };
}

export function applyArcaneReserve(side: BattleSide): { converted: number; mana: number } {
  ensureMana(side);
  const leftover = availableEnergy(side);
  const next = convertEnergyToMana(leftover, side.mana ?? 0);
  side.mana = next.mana;
  return { converted: next.converted, mana: next.mana };
}

export function trySpendMana(
  side: BattleSide,
  amount: number,
): { ok: true; manaBefore: number; manaAfter: number } | { ok: false; reason: "INSUFFICIENT_MANA" } {
  ensureMana(side);
  const need = Math.max(0, Math.floor(amount));
  if ((side.mana ?? 0) < need) {
    return { ok: false, reason: "INSUFFICIENT_MANA" };
  }
  const manaBefore = side.mana ?? 0;
  side.mana = manaBefore - need;
  return { ok: true, manaBefore, manaAfter: side.mana };
}

export function impetusUsedOf(side: BattleSide, creatureId: string | undefined): number {
  if (!creatureId) return 0;
  return side.impetusUsed?.[creatureId] ?? 0;
}

export function markImpetusUsed(side: BattleSide, creatureId: string | undefined): void {
  if (!creatureId) return;
  side.impetusUsed = { ...(side.impetusUsed ?? {}), [creatureId]: (side.impetusUsed?.[creatureId] ?? 0) + 1 };
}

export function resetImpetusRound(side: BattleSide): void {
  side.impetusUsed = {};
}
