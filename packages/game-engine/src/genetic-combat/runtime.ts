import { geneticCombatConfig, reactionRegistry } from "@nexora/config";
import type { Combatant } from "../battle/types";

export type RuntimeEffect = {
  op: string;
  value?: number;
  status?: string;
  duration?: number;
  condition?: { selfPosition?: string; targetHas?: string; resourceAtLeast?: number; targetHpBelow?: number };
  resource?: string;
};

export function clauseReady(effect: RuntimeEffect, actor: Combatant | undefined, target: Combatant | undefined): boolean {
  const condition = effect.condition;
  if (!condition) return true;
  if (condition.selfPosition && actor?.slot !== condition.selfPosition) return false;
  if (condition.targetHas && !target?.statuses.some((row) => row.key === condition.targetHas)) return false;
  if (condition.resourceAtLeast && actor) {
    const id = effect.resource ?? Object.keys(actor.resources ?? [])[0];
    if (!id || (actor.resources?.[id] ?? 0) < condition.resourceAtLeast) return false;
  }
  if (condition.targetHpBelow && target) {
    const pct = target.maxHp <= 0 ? 0 : target.hp / target.maxHp;
    if (pct >= condition.targetHpBelow) return false;
  }
  return true;
}

export function gainResource(actor: Combatant, id: string, amount: number) {
  const cap = actor.resourceCap?.[id] ?? 3;
  actor.resources = { ...(actor.resources ?? {}), [id]: Math.min(cap, (actor.resources?.[id] ?? 0) + amount) };
}

export function consumeResource(actor: Combatant, id: string, amount: number): boolean {
  const have = actor.resources?.[id] ?? 0;
  if (have < amount) return false;
  actor.resources = { ...(actor.resources ?? {}), [id]: have - amount };
  return true;
}

export function applyStatusReactions(target: Combatant, applied: Set<string>, depth: { value: number }) {
  if (depth.value >= geneticCombatConfig.maxReactionDepth) return;
  const keys = new Set(target.statuses.map((row) => row.key));
  for (const rule of reactionRegistry) {
    if (applied.has(rule.output)) continue;
    if (!rule.inputs.every((row) => keys.has(row))) continue;
    if ("shield" in rule && rule.shield && target.shield <= 0) continue;
    depth.value += 1;
    const existing = target.statuses.find((row) => row.key === rule.output);
    if (existing) {
      existing.stacks += 1;
      existing.remainingRounds = Math.max(existing.remainingRounds, 2);
    } else {
      target.statuses.push({ key: rule.output, stacks: 1, remainingRounds: 2 });
    }
    applied.add(rule.output);
    keys.add(rule.output);
    applyStatusReactions(target, applied, depth);
    depth.value -= 1;
  }
}
