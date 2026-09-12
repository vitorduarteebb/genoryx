import { combatMatrixConfig } from "@nexora/config";
import type { TargetRule } from "@nexora/types";
import { cardTargetRule, listFormationTargets, type TargetUnit } from "../targeting-resolve";
import { combatLineOf, exposedLine } from "../formation-line";

export type TargetableUnit = TargetUnit;

export function middleWindowOpen(round: number): boolean {
  if (!combatMatrixConfig.middleVulnerableOnEvenRounds) {
    return true;
  }
  return round % 2 === 0;
}

export function isSlotTargetable(slot: string, _round: number, rule: TargetRule, enemies: readonly TargetableUnit[] = []): boolean {
  const line = combatLineOf(slot);
  if (rule === "SELF" || rule === "ALLY" || rule === "ALL_ALLIES") return false;
  if (rule === "AOE_ALL") return true;
  const exposed = enemies.length > 0 ? exposedLine(enemies.filter((row) => row.hp > 0)) : "FRONT";
  if (rule === "FRONT_ONLY") return line === "FRONT" && (exposed === "FRONT" || !exposed);
  if (rule === "BACKLINE") return line === "BACKLINE" || line === exposed;
  if (rule === "PIERCE_FRONT" || rule === "MIDDLE_ALLOWED") return line === "FRONT" || line === "MID";
  return line === exposed;
}

export function listValidTargets<T extends TargetableUnit>(input: {
  allies: readonly T[];
  enemies: readonly T[];
  round: number;
  rule: TargetRule;
}): T[] {
  const targetType =
    input.rule === "SELF" ? "SELF" : input.rule === "ALLY" ? "ALLY" : input.rule === "ALL_ALLIES" ? "ALL_ALLIES" : input.rule === "AOE_ALL" ? "ALL_ENEMIES" : "ENEMY";
  const tags =
    input.rule === "BACKLINE" ? ["BACKLINE"] : input.rule === "PIERCE_FRONT" ? ["PIERCE"] : input.rule === "AOE_ALL" ? ["AOE"] : [];
  void input.round;
  return listFormationTargets({ allies: input.allies, enemies: input.enemies, targetType, tags });
}

export function validTargets<T extends TargetableUnit>(input: {
  allies: readonly T[];
  enemies: readonly T[];
  round: number;
  rule: TargetRule;
  preferredId?: string;
}): T[] {
  const targetType =
    input.rule === "SELF" ? "SELF" : input.rule === "ALLY" ? "ALLY" : input.rule === "ALL_ALLIES" ? "ALL_ALLIES" : input.rule === "AOE_ALL" ? "ALL_ENEMIES" : "ENEMY";
  const tags =
    input.rule === "BACKLINE" ? ["BACKLINE"] : input.rule === "PIERCE_FRONT" ? ["PIERCE"] : input.rule === "AOE_ALL" ? ["AOE"] : [];
  const listed = listFormationTargets({
    allies: input.allies,
    enemies: input.enemies,
    targetType,
    tags,
    preferredId: input.preferredId,
  });
  if (input.rule === "AOE_ALL" || input.rule === "AOE_ADJACENT" || input.rule === "ALL_ALLIES") {
    return listed;
  }
  if (input.preferredId) {
    const preferred = listed.find((row) => row.id === input.preferredId);
    return preferred ? [preferred] : [];
  }
  return listed;
}

export function ruleFromCard(targetType: string, tags: readonly string[] = []): TargetRule {
  return cardTargetRule(targetType, tags);
}
