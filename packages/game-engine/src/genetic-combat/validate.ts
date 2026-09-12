import { clampCardCost, geneticCombatConfig } from "@nexora/config";
import type { GeneticCardManifest } from "./types";

export function validateCard(card: GeneticCardManifest): string | null {
  if (card.cost < 1 || card.cost > 4) return "energy";
  if (card.effects.length === 0) return "empty";
  const damage = card.effects.filter((row) => row.op === "DAMAGE").reduce((sum, row) => sum + (row.value ?? 0), 0);
  const cap = geneticCombatConfig.damageByTier[card.tier][1] + 8;
  if (damage > cap) return "power";
  if (card.locus === "G10" && card.cost !== clampCardCost(card.cost)) return "energy";
  if (card.locus === "G10" && !card.ability.requires.length && !card.effects.some((row) => row.condition)) {
    return "supreme-unconditional";
  }
  return null;
}

export function validateKit(cards: readonly GeneticCardManifest[]): string | null {
  if (cards.length !== 10) return "count";
  if (new Set(cards.map((row) => row.namePt)).size < 8) return "duplicate-names";
  if (cards.every((row) => row.cost >= 4)) return "all-expensive";
  if (!cards.some((row) => row.cost <= 2 && row.effects.some((effect) => effect.op === "DAMAGE" || effect.op === "SHIELD" || effect.op === "HEAL"))) {
    return "unplayable";
  }
  const g9 = cards.find((row) => row.locus === "G9");
  const g10 = cards.find((row) => row.locus === "G10");
  if (!g9 || g9.tier !== "SIGNATURE") return "signature";
  if (!g10 || g10.tier !== "SUPREME") return "supreme";
  return null;
}
