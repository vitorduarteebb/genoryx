import { activeEconomy, type EncounterTier, type PvpEconomyMode } from "@nexora/config";
import type { RandomService } from "../random/random-service";

export function rollPveGold(tier: EncounterTier, rng: RandomService): number {
  const range = activeEconomy().pveGold[tier];
  return rng.nextInt(range.min, range.max);
}

export function pvpGoldReward(mode: PvpEconomyMode): number {
  const pvp = activeEconomy().pvp;
  return mode === "COMPETITIVE" ? pvp.competitiveGoldPerWin : pvp.casualGold;
}

export function clampRewardToBudget(rolled: number, remaining: number): number {
  if (remaining <= 0 || rolled <= 0) {
    return 0;
  }
  return Math.min(Math.floor(rolled), Math.floor(remaining));
}

export function rollPveCatalyst(tier: EncounterTier, rng: RandomService): boolean {
  return rng.chance(activeEconomy().pveCatalystChance[tier]);
}
