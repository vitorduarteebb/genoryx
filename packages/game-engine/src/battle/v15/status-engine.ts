import { combatV15Config, statusDefinition } from "@nexora/config";
import type { Combatant, CombatStatus } from "../types";

export function applyStructuredStatus(target: Combatant, key: string, duration?: number): { applied: string; extra?: string } {
  const def = statusDefinition(key);
  const rounds = duration ?? def.duration;
  const existing = target.statuses.find((row) => row.key === key);
  if (def.stackMode === "UNIQUE") {
    if (existing) {
      existing.remainingRounds = Math.max(existing.remainingRounds, rounds);
      existing.stacks = 1;
    } else {
      target.statuses.push({ key, stacks: 1, remainingRounds: rounds });
    }
    return maybeHardControl(target, key);
  }
  if (existing) {
    if (def.stackMode === "REFRESH") {
      existing.remainingRounds = Math.max(existing.remainingRounds, rounds);
      existing.stacks = Math.min(def.maxStacks, Math.max(existing.stacks, 1));
    } else {
      existing.stacks = Math.min(def.maxStacks, existing.stacks + 1);
      existing.remainingRounds = Math.max(existing.remainingRounds, rounds);
    }
  } else {
    target.statuses.push({ key, stacks: 1, remainingRounds: rounds });
  }
  if (def.stackMode === "BUILDUP" && def.buildupInto && def.buildupAt) {
    const row = target.statuses.find((status) => status.key === key);
    if (row && row.stacks >= def.buildupAt) {
      target.statuses = target.statuses.filter((status) => status.key !== key);
      applyStructuredStatus(target, def.buildupInto, statusDefinition(def.buildupInto).duration);
      return { applied: key, extra: def.buildupInto };
    }
  }
  return maybeHardControl(target, key);
}

function maybeHardControl(target: Combatant, key: string): { applied: string; extra?: string } {
  const def = statusDefinition(key);
  if (!def.hardControl) {
    return { applied: key };
  }
  const resolve = target.statuses.find((row) => row.key === "RESOLVE");
  const stacks = resolve?.stacks ?? 0;
  const cut = combatV15Config.resolveDurationCut[Math.min(stacks, combatV15Config.resolveDurationCut.length - 1)] ?? 1;
  const applied = target.statuses.find((row) => row.key === key);
  if (applied && cut < 1) {
    applied.remainingRounds = Math.max(1, Math.floor(applied.remainingRounds * cut));
  }
  const nextResolve = Math.min(2, stacks + 1);
  const existing = target.statuses.find((row) => row.key === "RESOLVE");
  if (existing) {
    existing.stacks = nextResolve;
    existing.remainingRounds = 2;
  } else {
    target.statuses.push({ key: "RESOLVE", stacks: nextResolve, remainingRounds: 2 });
  }
  return { applied: key };
}

export function tickStructuredStatuses(
  creature: Combatant,
  when: "END_OF_TURN" | "START_OF_TURN",
  onDot: (key: string, stacks: number) => void,
) {
  for (const status of creature.statuses) {
    const def = statusDefinition(status.key);
    if (def.tickTiming === when && (status.key === "BURN" || status.key === "POISON" || status.key === "BLEED")) {
      onDot(status.key, status.stacks);
    }
    if (def.tickTiming === when || when === "END_OF_TURN") {
      if (status.key === "RESOLVE" && when === "END_OF_TURN") {
        status.stacks = Math.max(0, status.stacks - 1);
      }
      status.remainingRounds -= 1;
    }
  }
  creature.statuses = creature.statuses.filter((row) => row.remainingRounds > 0 && row.stacks > 0);
}

export function hasHardControl(creature: Combatant): boolean {
  return creature.statuses.some((row) => statusDefinition(row.key).hardControl);
}

export function statusSnapshot(statuses: CombatStatus[]) {
  return statuses.map((row) => ({
    key: row.key,
    stacks: row.stacks,
    remainingRounds: row.remainingRounds,
    def: statusDefinition(row.key),
  }));
}
