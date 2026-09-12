import { geneticCombatConfig, type CardKitTier } from "@nexora/config";
import type { RandomService } from "../random/random-service";
import type { BirthRolls } from "./types";

export type LuckVariant = "STABLE" | "EFFICIENT" | "UNSTABLE" | "CONDITIONAL";

export function luckVariant(rolls: BirthRolls, rng: RandomService): LuckVariant {
  if (rolls.efficiency >= 78 && rng.chance(0.45)) return "EFFICIENT";
  if (rolls.efficiency < 38 || rolls.stability < 32) return rng.chance(0.55) ? "UNSTABLE" : "CONDITIONAL";
  if (rolls.coherence < 40) return "CONDITIONAL";
  return "STABLE";
}

export function cardPowerBudget(tier: CardKitTier, energy: number, luck: LuckVariant): number {
  const base = { FOUNDATION: 14, SPECIALIZATION: 20, SYNERGY: 16, ADVANCED: 20, SIGNATURE: 28, SUPREME: 36 }[tier];
  const conditionCredit = luck === "CONDITIONAL" ? 6 : 0;
  const drawbackCredit = luck === "UNSTABLE" ? 4 : 0;
  const flexTax = luck === "EFFICIENT" ? 3 : 0;
  return base + energy * 2 + conditionCredit + drawbackCredit - flexTax;
}

export function clampMagnitude(tier: CardKitTier, kind: "DAMAGE" | "SHIELD" | "HEAL", potency: number): number {
  const table = kind === "DAMAGE" ? geneticCombatConfig.damageByTier : kind === "SHIELD" ? geneticCombatConfig.shieldByTier : geneticCombatConfig.healByTier;
  const [min, max] = table[tier];
  const t = Math.max(0, Math.min(1, (potency - 10) / 80));
  return Math.round(min + (max - min) * t);
}

export function clampIdentityEffects(effects: readonly import("@nexora/config").CardEffectDef[], budget: number): import("@nexora/config").CardEffectDef[] {
  const next = effects.map((row) => ({ ...row }));
  const used = () =>
    next.reduce((sum, effect) => {
      const weight = effect.op === "DAMAGE" || effect.op === "HEAL" ? 1 : effect.op === "SHIELD" ? 0.9 : effect.op === "APPLY_STATUS" ? 6 : effect.op === "GAIN_RESOURCE" ? 4 : effect.op === "CONSUME_RESOURCE" ? 0 : 8;
      return sum + weight * (effect.value ?? (effect.status ? 1 : 1));
    }, 0);
  while (used() > budget) {
    const damage = next.find((row) => row.op === "DAMAGE" && (row.value ?? 0) > 8);
    if (damage?.value) {
      damage.value -= 1;
      continue;
    }
    const extra = [...next].reverse().find((row) => row.op !== "CONSUME_RESOURCE" && row.op !== "DAMAGE" && row.op !== "SHIELD" && row.op !== "HEAL");
    if (extra) {
      next.splice(next.indexOf(extra), 1);
      continue;
    }
    break;
  }
  return next;
}
