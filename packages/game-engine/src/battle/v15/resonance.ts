import { combatV15Config, teamManifestRecipes } from "@nexora/config";
import type { BattleSide } from "../types";
import { emptyTeamResonance } from "./match-rules";
import { resolveMatchRules } from "./match-rules";
import type { BattleState } from "../types";

export function ensureResonance(side: BattleSide, state: BattleState) {
  if (!side.teamResonance) {
    side.teamResonance = emptyTeamResonance(resolveMatchRules(state));
  }
  return side.teamResonance;
}

export function gainTeamResonance(
  state: BattleState,
  side: BattleSide,
  producerId: string | undefined,
  consumerId: string | undefined,
  reason: string,
): boolean {
  if (!resolveMatchRules(state).resonanceEnabled) {
    return false;
  }
  if (!producerId || !consumerId || producerId === consumerId) {
    return false;
  }
  const current = ensureResonance(side, state);
  if (current.value >= current.max) {
    return false;
  }
  current.value += 1;
  current.gainedThisBattle += 1;
  current.ready = current.value >= current.max;
  state.log.push({
    type: "TEAM_RESONANCE",
    text: `+1 Resonance · ${current.value}/${current.max}${current.ready ? " · RESONANCE READY" : ""} · ${reason}`,
    value: current.value,
  });
  return true;
}

export function spendResonance(side: BattleSide, state: BattleState): boolean {
  const current = ensureResonance(side, state);
  if (current.value < (current.max || combatV15Config.maxResonance)) {
    return false;
  }
  current.value = 0;
  current.ready = false;
  return true;
}

export function evaluateManifestation(side: BattleSide): { key: string; namePt: string } | null {
  const tags = new Set<string>();
  for (const unit of side.creatures) {
    if (unit.hp <= 0) continue;
    tags.add(unit.element);
    for (const tag of unit.tags) tags.add(tag);
    if (unit.typology) tags.add(unit.typology);
  }
  for (const recipe of teamManifestRecipes) {
    if (recipe.tags.every((tag) => tags.has(tag))) {
      return { key: recipe.key, namePt: recipe.namePt };
    }
  }
  return null;
}
