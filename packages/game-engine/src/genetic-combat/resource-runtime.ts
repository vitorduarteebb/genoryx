import type { PersonalResourceDefinition, ResourceDecay, ResourceGenerationRule, ResourceScope, ResourceTrigger } from "@nexora/config";
import type { BattleSide, BattleState, Combatant } from "../battle/types";
import { consumeResource, gainResource } from "./runtime";

export type ResourceEvent = {
  trigger: ResourceTrigger;
  actor?: Combatant;
  target?: Combatant;
  status?: string;
  shieldAmount?: number;
  damage?: number;
  targetHpRatioBefore?: number;
  crit?: boolean;
  cardGrade?: string;
};

function sideOf(state: BattleState, unit?: Combatant): number {
  if (!unit) return -1;
  return state.sides.findIndex((side) => side.creatures.some((row) => row.id === unit.id));
}

function subjectOf(trigger: ResourceTrigger, event: ResourceEvent): Combatant | undefined {
  if (trigger === "APPLY_STATUS" || trigger === "DEAL_DAMAGE" || trigger === "CRITICAL_HIT" || trigger === "PLAY_CARD") {
    return event.actor;
  }
  return event.target;
}

function scopeBetween(owner: Combatant, subject: Combatant | undefined, state: BattleState): ResourceScope | null {
  if (!subject) return null;
  if (subject.id === owner.id) return "SELF";
  const left = sideOf(state, owner);
  const right = sideOf(state, subject);
  if (left < 0 || right < 0) return null;
  return left === right ? "ALLY" : "ENEMY";
}

export function generationRuleMatches(
  rule: ResourceGenerationRule,
  event: ResourceEvent,
  owner: Combatant,
  state: BattleState,
): boolean {
  if (rule.trigger !== event.trigger) return false;
  if (rule.status && rule.status !== event.status) return false;
  if (rule.minimumShield != null && (event.shieldAmount ?? 0) < rule.minimumShield) return false;
  if (rule.targetHpBelow != null && (event.targetHpRatioBefore ?? 1) >= rule.targetHpBelow) return false;
  if (rule.condition?.selfPosition && owner.slot !== rule.condition.selfPosition) return false;
  if (rule.trigger === "PLAY_CARD" && rule.condition?.selfPosition && owner.slot !== rule.condition.selfPosition) return false;
  const want = rule.scope ?? "SELF";
  const got = scopeBetween(owner, subjectOf(rule.trigger, event), state);
  if (!got) return false;
  return want === "ANY" || want === got;
}

function pushLog(
  state: BattleState,
  type: string,
  owner: Combatant,
  text: string,
  value?: number,
  extra?: Partial<BattleState["log"][number]>,
) {
  state.log.push({
    type,
    targetId: owner.id,
    value,
    text,
    ownerCreatureId: owner.creatureId,
    resourceId: owner.resourceDef?.id,
    amount: value,
    sourceCreatureId: extra?.sourceCreatureId ?? extra?.ownerCreatureId ?? owner.creatureId,
    reason: extra?.reason ?? extra?.triggerRuleId ?? type,
    triggerRuleId: extra?.triggerRuleId,
    sourceEventId: extra?.sourceEventId,
    sourceCardId: extra?.sourceCardId,
    ...extra,
  });
}

export function applyResourceEvent(state: BattleState, event: ResourceEvent) {
  for (const side of state.sides) {
    for (const owner of side.creatures) {
      if (owner.hp <= 0 || !owner.resourceDef) continue;
      const def = owner.resourceDef;
      const matched: ResourceGenerationRule[] = [];
      const once = new Set<string>();
      for (const rule of def.generationRules) {
        if (!generationRuleMatches(rule, event, owner, state)) continue;
        const key = `${rule.trigger}:${rule.status ?? ""}:${rule.condition?.selfPosition ?? ""}`;
        if (rule.oncePerEvent && once.has(key)) continue;
        if (rule.oncePerEvent) once.add(key);
        matched.push(rule);
      }
      const gained = matched.reduce((sum, rule) => sum + rule.amount, 0);
      if (gained <= 0) continue;
      const before = owner.resources?.[def.id] ?? 0;
      gainResource(owner, def.id, gained);
      const after = owner.resources?.[def.id] ?? 0;
      if (after === before) continue;
      pushLog(
        state,
        "RESOURCE_GAIN",
        owner,
        `${owner.name} ganha +${after - before} ${def.displayName}${owner.identityName ? ` (${owner.identityName})` : ""}.`,
        after - before,
        {
          resourceId: def.id,
          triggerRuleId: matched.map((row) => `${row.trigger}:${row.status ?? "*"}`).join(","),
          sourceCreatureId: event.actor?.creatureId ?? owner.creatureId,
          reason: event.trigger,
        },
      );
      if (after >= def.maxStacks) {
        pushLog(state, "RESOURCE_MAX", owner, `${def.displayName.toUpperCase()} MÁXIMO`);
      }
      for (const row of def.thresholdEffects) {
        if (before < row.stacks && after >= row.stacks) {
          pushLog(state, "RESOURCE_THRESHOLD", owner, row.textPt);
        }
      }
      if (def.risk && after >= def.maxStacks && before < def.maxStacks) {
        owner.hp = Math.max(0, owner.hp - 8);
        pushLog(state, "RESOURCE_RISK", owner, def.risk.textPt, 8);
      }
    }
  }
}

export function decayPersonalResources(state: BattleState, side: BattleSide, when: ResourceDecay) {
  for (const owner of side.creatures) {
    const def = owner.resourceDef;
    if (!def || def.decayRule !== when) continue;
    const have = owner.resources?.[def.id] ?? 0;
    if (have <= 0) continue;
    owner.resources = { ...(owner.resources ?? {}), [def.id]: have - 1 };
    pushLog(state, "RESOURCE_DECAY", owner, `−1 ${def.displayName.toUpperCase()}`, 1);
  }
}

export function requiredResource(def: PersonalResourceDefinition, locus?: string): { need: number; amount: number | "ALL"; upTo?: boolean } | null {
  const rule = def.consumptionRules.find((row) => row.cardGrade === locus);
  if (!rule) return null;
  const need = rule.require ?? (rule.amount === "ALL" ? def.maxStacks : rule.upTo ? 1 : rule.amount);
  return { need, amount: rule.amount, upTo: rule.upTo };
}

export function spendPersonalResource(state: BattleState, actor: Combatant, locus?: string): boolean {
  const def = actor.resourceDef;
  if (!def) return true;
  const gate = requiredResource(def, locus);
  if (!gate) return true;
  const have = actor.resources?.[def.id] ?? 0;
  if (have < gate.need) return false;
  const spent = gate.amount === "ALL" ? have : gate.upTo ? Math.min(have, gate.amount) : gate.amount;
  if (!consumeResource(actor, def.id, spent)) return false;
  pushLog(state, "RESOURCE_SPEND", actor, `−${spent} ${def.displayName.toUpperCase()}`, spent);
  return true;
}
