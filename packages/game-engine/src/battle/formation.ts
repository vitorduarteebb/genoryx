import {
  ALL_FORMATION_SLOTS,
  CLASSIC_FORMATION_SLOTS,
  LINEAR_FORMATION_SLOTS,
  type BattleRulesVersion,
  type FormationSlot,
  type LinearFormationSlot,
} from "@nexora/types";

export function formationSlotFromIndex(index: number, version: BattleRulesVersion = "V1"): FormationSlot {
  const slots = version === "V2" ? LINEAR_FORMATION_SLOTS : CLASSIC_FORMATION_SLOTS;
  return slots[Math.min(Math.max(index, 0), slots.length - 1)] ?? "FRONT";
}

export function isKnownFormationSlot(slot: string | null | undefined): slot is FormationSlot {
  return Boolean(slot && (ALL_FORMATION_SLOTS as readonly string[]).includes(slot));
}

export function assignFormationSlots<T extends { slot?: FormationSlot | string | null }>(
  creatures: T[],
  version: BattleRulesVersion = "V1",
): T[] {
  return creatures.map((creature, index) => ({
    ...creature,
    slot: isKnownFormationSlot(creature.slot) ? creature.slot : formationSlotFromIndex(index, version),
  }));
}

export function linearSlotFromIndex(index: number): LinearFormationSlot {
  return LINEAR_FORMATION_SLOTS[Math.min(Math.max(index, 0), LINEAR_FORMATION_SLOTS.length - 1)] ?? "FRONT";
}

export function usesLinearFormation(input: {
  rulesVersion?: BattleRulesVersion;
  creatures?: Array<{ slot?: string | null }>;
}): boolean {
  if (input.rulesVersion === "V2") {
    return true;
  }
  return Boolean(input.creatures?.some((row) => row.slot === "MIDDLE" || row.slot === "BACK"));
}
