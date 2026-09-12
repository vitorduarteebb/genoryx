import type { RetargetPolicy } from "@nexora/config";
import type { BattleSide, CardInstance, Combatant, QueuedAction } from "../types";

export function availableEnergy(side: BattleSide): number {
  return Math.max(0, side.energy - (side.reservedEnergy ?? 0));
}

export function nextQueueId(side: BattleSide): string {
  return `q-${side.actionQueue?.length ?? 0}-${side.id}`;
}

export function queueCard(
  side: BattleSide,
  card: CardInstance,
  cost: number,
  targetId: string | undefined,
  retargetPolicy: RetargetPolicy,
): QueuedAction {
  const action: QueuedAction = {
    id: nextQueueId(side),
    cardInstanceId: card.instanceId,
    card,
    targetId,
    reservedEnergy: cost,
    retargetPolicy,
    sourceCreatureId: card.sourceCreatureId,
  };
  side.actionQueue = [...(side.actionQueue ?? []), action];
  side.reservedEnergy = (side.reservedEnergy ?? 0) + cost;
  return action;
}

export function removeQueued(side: BattleSide, queueId: string): QueuedAction | null {
  const list = side.actionQueue ?? [];
  const index = list.findIndex((row) => row.id === queueId || row.cardInstanceId === queueId);
  if (index < 0) {
    return null;
  }
  const [removed] = list.splice(index, 1);
  if (!removed) return null;
  side.actionQueue = list;
  side.reservedEnergy = Math.max(0, (side.reservedEnergy ?? 0) - removed.reservedEnergy);
  side.hand.push(removed.card);
  return removed;
}

export function reorderQueue(side: BattleSide, order: string[]): boolean {
  const list = side.actionQueue ?? [];
  if (list.length === 0) return false;
  const next: QueuedAction[] = [];
  for (const id of order) {
    const row = list.find((item) => item.id === id || item.cardInstanceId === id);
    if (row) next.push(row);
  }
  if (next.length !== list.length) return false;
  side.actionQueue = next;
  return true;
}

export function retargetQueued(side: BattleSide, queueId: string, targetId: string): boolean {
  const row = (side.actionQueue ?? []).find((item) => item.id === queueId || item.cardInstanceId === queueId);
  if (!row) return false;
  row.targetId = targetId;
  return true;
}

export function cancelQueued(side: BattleSide, action: QueuedAction, reason: string): { released: number; reason: string } {
  side.actionQueue = (side.actionQueue ?? []).filter((row) => row.id !== action.id);
  side.reservedEnergy = Math.max(0, (side.reservedEnergy ?? 0) - action.reservedEnergy);
  if (!side.hand.some((card) => card.instanceId === action.card.instanceId)) {
    side.hand.push(action.card);
  }
  return { released: action.reservedEnergy, reason };
}

export function spendReserved(side: BattleSide, action: QueuedAction) {
  side.reservedEnergy = Math.max(0, (side.reservedEnergy ?? 0) - action.reservedEnergy);
  side.energy = Math.max(0, side.energy - action.reservedEnergy);
}

export function clearQueue(side: BattleSide) {
  for (const row of [...(side.actionQueue ?? [])]) {
    cancelQueued(side, row, "CLEAR");
  }
  side.actionQueue = [];
  side.reservedEnergy = 0;
}

export function chooseRetarget(
  policy: RetargetPolicy,
  legal: Combatant[],
  previousId?: string,
  lineOf?: (id: string) => string | undefined,
): Combatant | undefined {
  if (legal.length === 0 || policy === "NONE") {
    return undefined;
  }
  if (policy === "LOWEST_HP_VALID") {
    return [...legal].sort((a, b) => a.hp - b.hp || a.id.localeCompare(b.id))[0];
  }
  if (policy === "MARKED_VALID") {
    return legal.find((row) => row.statuses.some((status) => status.key === "MARKED")) ?? undefined;
  }
  if (policy === "SAME_LINE" && previousId && lineOf) {
    const line = lineOf(previousId);
    const same = legal.filter((row) => lineOf(row.id) === line);
    return same.sort((a, b) => a.id.localeCompare(b.id))[0] ?? legal[0];
  }
  return [...legal].sort((a, b) => a.id.localeCompare(b.id))[0];
}
