import { creatureLifeStageConfig, maturationThresholdFor, nextLifeStage, xpConfig } from "@nexora/config";
import type { EvolutionStatus, LifeStage } from "@nexora/types";

export type CreatureProgress = {
  level: number;
  xp: number;
  lifeStage: LifeStage | string;
  evolutionStatus: EvolutionStatus | string;
  maturationXp?: number;
};

export function xpToReachLevel(level: number): number {
  if (level <= 1) {
    return 0;
  }
  let total = 0;
  for (let step = 1; step < level; step += 1) {
    total += Math.round(xpConfig.creatureBase * xpConfig.creatureGrowth ** (step - 1));
  }
  return total;
}

export function xpForNextLevel(level: number): number {
  return Math.round(xpConfig.creatureBase * xpConfig.creatureGrowth ** Math.max(0, level - 1));
}

export function calculateCreatureLevel(xp: number): number {
  let level = 1;
  while (level < creatureLifeStageConfig.maxLevel && xp >= xpToReachLevel(level + 1)) {
    level += 1;
  }
  return level;
}

export function canEvolve(progress: CreatureProgress): boolean {
  const next = nextLifeStage(progress.lifeStage);
  if (!next) {
    return false;
  }
  return progress.evolutionStatus === "READY_TO_EVOLVE" && progress.level >= creatureLifeStageConfig.minLevel[next];
}

export function meetsEvolutionThresholds(progress: CreatureProgress): boolean {
  const next = nextLifeStage(progress.lifeStage);
  if (!next) {
    return false;
  }
  const levelOk = progress.level >= creatureLifeStageConfig.minLevel[next];
  const maturationOk = (progress.maturationXp ?? 0) >= maturationThresholdFor(next);
  return levelOk && maturationOk;
}

/**
 * READY só com level + maturation.
 * Quem já está READY_TO_EVOLVE (Alpha antigo) não é resetado.
 */
export function evaluateEvolutionStatus(progress: CreatureProgress): EvolutionStatus | string {
  if (progress.lifeStage === "ADULT" || !nextLifeStage(progress.lifeStage)) {
    return progress.evolutionStatus === "EVOLVING" ? "EVOLVING" : "NONE";
  }
  if (progress.evolutionStatus === "EVOLVING") {
    return "EVOLVING";
  }
  if (progress.evolutionStatus === "READY_TO_EVOLVE") {
    return "READY_TO_EVOLVE";
  }
  return meetsEvolutionThresholds(progress) ? "READY_TO_EVOLVE" : "NONE";
}

export function applyCreatureXp(current: CreatureProgress, gained: number): CreatureProgress & { leveledUp: boolean } {
  const xp = Math.max(0, current.xp + Math.max(0, Math.round(gained)));
  const level = calculateCreatureLevel(xp);
  const next = {
    ...current,
    xp,
    level,
  };
  return {
    ...next,
    evolutionStatus: evaluateEvolutionStatus(next),
    leveledUp: level > current.level,
  };
}

export function applyMaturationXp(
  current: CreatureProgress,
  gained: number,
): CreatureProgress & { matured: boolean; becameReady: boolean } {
  const maturationXp = Math.max(0, (current.maturationXp ?? 0) + Math.max(0, Math.round(gained)));
  const next = {
    ...current,
    maturationXp,
  };
  const evolutionStatus = evaluateEvolutionStatus(next);
  return {
    ...next,
    evolutionStatus,
    matured: gained > 0,
    becameReady: current.evolutionStatus !== "READY_TO_EVOLVE" && evolutionStatus === "READY_TO_EVOLVE",
  };
}
