import type { TargetRule } from "@nexora/types";
import { defaultTargetRule } from "@nexora/config";
import { combatLineOf, exposedLine, lineRank, livingOnLine, type CombatLine } from "./formation-line";

export type TargetUnit = {
  id: string;
  slot: string;
  hp: number;
  name?: string;
  statuses?: Array<{ key: string }>;
  tags?: readonly string[];
};

export type TargetExplain = {
  rule: TargetRule;
  targetRule: string;
  frontlineBlocking: boolean;
  frontlineBypass: boolean;
  validTargets: string[];
  blockedTargets: Record<string, string>;
};

const ASSASSIN_TAGS = ["ASSASSIN", "BACKLINE_ACCESS", "IGNORE_FRONTLINE", "ASSASSIN_ACCESS", "EXECUTE", "PREDATOR"];
const PIERCE_TAGS = ["PIERCE", "PIERCE_FORMATION", "RANGED", "RANGED_ACCESS", "MOBILITY", "TRUE_PIERCE"];
const AOE_TAGS = ["AOE", "AOE_ALL_ENEMIES"];
const LOWEST_HP_TAGS = ["TARGET_LOWEST_HP"];

export function cardTargetRule(targetType: string, tags: readonly string[] = []): TargetRule {
  if (targetType === "ALL_ENEMIES" || tags.some((row) => AOE_TAGS.includes(row))) return "AOE_ALL";
  if (tags.some((row) => ASSASSIN_TAGS.includes(row)) || tags.includes("BACKLINE")) return "BACKLINE";
  if (tags.some((row) => PIERCE_TAGS.includes(row))) return "PIERCE_FRONT";
  return defaultTargetRule(targetType, tags);
}

function bypassFront(rule: TargetRule, tags: readonly string[]): boolean {
  return rule === "BACKLINE" || rule === "PIERCE_FRONT" || rule === "AOE_ALL" || tags.some((row) => ASSASSIN_TAGS.includes(row) || PIERCE_TAGS.includes(row));
}

function maxReach(rule: TargetRule, tags: readonly string[]): CombatLine {
  if (rule === "AOE_ALL") return "BACKLINE";
  if (rule === "BACKLINE" || tags.some((row) => ASSASSIN_TAGS.includes(row))) return "BACKLINE";
  if (rule === "PIERCE_FRONT" || tags.some((row) => PIERCE_TAGS.includes(row))) return "MID";
  return "FRONT";
}

function lineAllowed(line: CombatLine, exposed: CombatLine | null, rule: TargetRule, tags: readonly string[]): boolean {
  if (!exposed) return false;
  if (rule === "AOE_ALL") return true;
  if (line === exposed) return true;
  if (lineRank(line) < lineRank(exposed)) return false;
  return lineRank(line) <= lineRank(maxReach(rule, tags));
}

export function listFormationTargets<T extends TargetUnit>(input: {
  allies: readonly T[];
  enemies: readonly T[];
  targetType: string;
  tags?: readonly string[];
  preferredId?: string;
}): T[] {
  const tags = input.tags ?? [];
  const rule = cardTargetRule(input.targetType, tags);
  const livingAllies = input.allies.filter((row) => row.hp > 0);
  if (rule === "SELF" || input.targetType === "SELF") {
    return livingAllies.slice(0, 1);
  }
  if (rule === "ALLY" || input.targetType === "ALLY") {
    return preferredOrAll(livingAllies, input.preferredId);
  }
  if (rule === "ALL_ALLIES" || input.targetType === "ALL_ALLIES") {
    return [...livingAllies];
  }
  const livingEnemies = input.enemies.filter((row) => row.hp > 0);
  if (rule === "AOE_ALL" || input.targetType === "ALL_ENEMIES") {
    return [...livingEnemies];
  }
  const markedPrey = tags.includes("MARKED_PREY");
  const exposed = exposedLine(livingEnemies);
  let legal = livingEnemies.filter((row) => {
    if (markedPrey && row.statuses?.some((status) => status.key === "MARKED")) {
      return true;
    }
    return lineAllowed(combatLineOf(row.slot), exposed, rule, tags);
  });
  legal = applyStealth(legal);
  legal = applyTaunt(legal, tags);
  if (tags.some((row) => LOWEST_HP_TAGS.includes(row)) && legal.length > 1) {
    const lowest = [...legal].sort((a, b) => a.hp - b.hp)[0];
    return lowest ? [lowest] : [];
  }
  if (input.preferredId) {
    const preferred = legal.find((row) => row.id === input.preferredId);
    return preferred ? [preferred] : [];
  }
  return legal;
}

function applyStealth<T extends TargetUnit>(legal: T[]): T[] {
  const open = legal.filter((row) => !row.statuses?.some((status) => status.key === "STEALTH"));
  return open.length > 0 ? open : legal;
}

function applyTaunt<T extends TargetUnit>(legal: T[], tags: readonly string[]): T[] {
  if (tags.includes("IGNORE_TAUNT")) return legal;
  const taunt = legal.filter((row) => row.statuses?.some((status) => status.key === "TAUNT"));
  return taunt.length > 0 ? taunt : legal;
}

function preferredOrAll<T extends TargetUnit>(units: T[], preferredId?: string): T[] {
  if (preferredId) {
    const preferred = units.find((row) => row.id === preferredId);
    return preferred ? [preferred] : units;
  }
  return units;
}

export function explainTargets<T extends TargetUnit>(input: {
  allies: readonly T[];
  enemies: readonly T[];
  targetType: string;
  tags?: readonly string[];
}): TargetExplain {
  const tags = input.tags ?? [];
  const rule = cardTargetRule(input.targetType, tags);
  const valid = listFormationTargets(input);
  const validIds = new Set(valid.map((row) => row.id));
  const blocked: Record<string, string> = {};
  const exposed = exposedLine(input.enemies.filter((row) => row.hp > 0));
  for (const unit of input.enemies.filter((row) => row.hp > 0)) {
    if (validIds.has(unit.id)) continue;
    const line = combatLineOf(unit.slot);
    if (unit.statuses?.some((status) => status.key === "STEALTH")) {
      blocked[unit.id] = "STEALTH";
    } else if (exposed && lineRank(line) > lineRank(exposed)) {
      blocked[unit.id] = "FRONTLINE_BLOCKING";
    } else {
      blocked[unit.id] = "INVALID_TARGET";
    }
  }
  return {
    rule,
    targetRule: rule === "BACKLINE" ? "BACKLINE_ACCESS" : rule === "AOE_ALL" ? "AOE_ALL" : rule === "PIERCE_FRONT" ? "PIERCE_FORMATION" : "NEAREST_ENEMY",
    frontlineBlocking: Object.values(blocked).includes("FRONTLINE_BLOCKING"),
    frontlineBypass: bypassFront(rule, tags),
    validTargets: [...validIds],
    blockedTargets: blocked,
  };
}

export function guardRedirect<T extends TargetUnit>(target: T, allies: readonly T[], tags: readonly string[] = []): T {
  if (tags.some((row) => ASSASSIN_TAGS.includes(row) || row === "TRUE_PIERCE")) return target;
  if (combatLineOf(target.slot) === "FRONT") return target;
  const guard = allies.find(
    (row) =>
      row.hp > 0 &&
      combatLineOf(row.slot) === "FRONT" &&
      (row.statuses?.some((status) => status.key === "GUARD") || row.tags?.includes("GUARD")),
  );
  return (guard as T | undefined) ?? target;
}
