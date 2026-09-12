import { LINEAR_FORMATION_SLOTS, type LinearFormationSlot } from "@nexora/types";

export type LinearOccupant = {
  id: string;
  slot: string;
  hp: number;
};

export function isLinearSlot(slot: string | null | undefined): slot is LinearFormationSlot {
  return Boolean(slot && (LINEAR_FORMATION_SLOTS as readonly string[]).includes(slot));
}

export function occupantInSlot<T extends LinearOccupant>(creatures: readonly T[], slot: LinearFormationSlot): T | undefined {
  return creatures.find((row) => row.slot === slot && row.hp > 0);
}

/** FRONT morre: MIDDLE → FRONT, BACK → MIDDLE. MIDDLE ou BACK mortos não promovem. */
export function collapseLinearFormation<T extends LinearOccupant>(creatures: T[]): { next: T[]; collapsed: boolean; promotions: string[] } {
  const front = occupantInSlot(creatures, "FRONT");
  if (front) {
    return { next: creatures, collapsed: false, promotions: [] };
  }
  const middle = occupantInSlot(creatures, "MIDDLE");
  const back = occupantInSlot(creatures, "BACK");
  if (!middle && !back) {
    return { next: creatures, collapsed: false, promotions: [] };
  }
  const promotions: string[] = [];
  const next = creatures.map((row) => {
    if (middle && row.id === middle.id) {
      promotions.push(`${row.id}:MIDDLE→FRONT`);
      return { ...row, slot: "FRONT" };
    }
    if (back && row.id === back.id) {
      promotions.push(`${row.id}:BACK→MIDDLE`);
      return { ...row, slot: "MIDDLE" };
    }
    return row;
  });
  return { next, collapsed: promotions.length > 0, promotions };
}

export function applyPositionMove<T extends LinearOccupant>(
  creatures: T[],
  creatureId: string,
  dest: LinearFormationSlot,
): T[] {
  const moving = creatures.find((row) => row.id === creatureId && row.hp > 0);
  if (!moving || moving.slot === dest) {
    return creatures;
  }
  const occupant = occupantInSlot(creatures, dest);
  return creatures.map((row) => {
    if (row.id === moving.id) {
      return { ...row, slot: dest };
    }
    if (occupant && row.id === occupant.id) {
      return { ...row, slot: moving.slot };
    }
    return row;
  });
}
