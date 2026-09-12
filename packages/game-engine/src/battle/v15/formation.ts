import type { FormationSlot } from "@nexora/types";
import type { Combatant } from "../types";
import { combatLineOf, livingOnLine, swapSlots, type CombatLine } from "../formation-line";
import { collapseLinearFormation } from "../matrix/formation-linear";

const LINE_TO_CLASSIC: Record<CombatLine, FormationSlot> = {
  FRONT: "FRONT",
  MID: "BACK_LEFT",
  BACKLINE: "BACK_RIGHT",
};

export function collapseFormation(creatures: Combatant[]): { next: Combatant[]; collapsed: boolean; promotions: string[] } {
  const linear = creatures.some((row) => row.slot === "MIDDLE" || row.slot === "BACK");
  if (linear) {
    return collapseLinearFormation(creatures);
  }
  const front = livingOnLine(creatures, "FRONT")[0];
  if (front) {
    return { next: creatures, collapsed: false, promotions: [] };
  }
  const mid = livingOnLine(creatures, "MID")[0];
  const back = livingOnLine(creatures, "BACKLINE")[0];
  if (!mid && !back) {
    return { next: creatures, collapsed: false, promotions: [] };
  }
  const promotions: string[] = [];
  if (mid) {
    mid.slot = LINE_TO_CLASSIC.FRONT;
    promotions.push(`${mid.name}:MID→FRONT`);
  }
  if (back) {
    back.slot = mid ? LINE_TO_CLASSIC.MID : LINE_TO_CLASSIC.FRONT;
    promotions.push(`${back.name}:BACKLINE→${mid ? "MID" : "FRONT"}`);
  }
  return { next: creatures, collapsed: promotions.length > 0, promotions };
}

export function applyPositionEffect(
  creatures: Combatant[],
  actorId: string,
  op: "HOLD_POSITION" | "FORCED_ADVANCE" | "RETREAT" | "PULL" | "PUSH" | "SWAP" | "INTERCEPT",
  otherId?: string,
): { moved: boolean; text?: string } {
  const actor = creatures.find((row) => row.id === actorId && row.hp > 0);
  if (!actor || actor.tags.includes("HOLD_POSITION")) {
    return { moved: false };
  }
  if (op === "FORCED_ADVANCE" || op === "RETREAT") {
    const dest: CombatLine = op === "FORCED_ADVANCE" ? "FRONT" : "BACKLINE";
    const occupant = livingOnLine(creatures, dest)[0];
    if (occupant && occupant.id !== actor.id) {
      swapSlots(actor, occupant);
      return { moved: true, text: `${actor.name} ${op === "FORCED_ADVANCE" ? "avança" : "recua"}.` };
    }
  }
  if ((op === "PULL" || op === "PUSH" || op === "SWAP") && otherId) {
    const other = creatures.find((row) => row.id === otherId && row.hp > 0);
    if (other) {
      swapSlots(actor, other);
      return { moved: true, text: `${actor.name} troca posição com ${other.name}.` };
    }
  }
  return { moved: false };
}

export function interceptRedirect<T extends { id: string; hp: number; slot: string; tags?: readonly string[]; statuses?: Array<{ key: string }> }>(
  target: T,
  allies: readonly T[],
  tags: readonly string[],
): T {
  if (tags.includes("TRUE_PIERCE") || tags.includes("ASSASSIN") || tags.includes("BACKLINE_ACCESS")) {
    return target;
  }
  if (combatLineOf(target.slot) === "FRONT") {
    return target;
  }
  const guard = allies.find(
    (row) =>
      row.hp > 0 &&
      combatLineOf(row.slot) === "FRONT" &&
      (row.tags?.includes("INTERCEPT") ||
        row.tags?.includes("GUARD") ||
        row.tags?.includes("BODY_BLOCK") ||
        row.statuses?.some((status) => status.key === "GUARD")),
  );
  return guard ?? target;
}
