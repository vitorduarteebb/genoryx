import type { Typology } from "@nexora/types";
import { isFunctionalTypology } from "./combat-tags";

export type BattleUsageEntry = {
  sequence: number;
  round: number;
  side: 0 | 1;
  cardKey: string;
  sourceCreatureId?: string;
  typology?: string;
  element?: string;
  mechanicTags: string[];
};

export function typologyContribution(entry: BattleUsageEntry): Typology[] {
  if (isFunctionalTypology(entry.typology)) {
    return [entry.typology];
  }
  return [];
}

export function contributedTypologies(history: readonly BattleUsageEntry[], side: 0 | 1): Typology[] {
  const found = new Set<Typology>();
  for (const entry of history) {
    if (entry.side !== side) {
      continue;
    }
    for (const typology of typologyContribution(entry)) {
      found.add(typology);
    }
  }
  return [...found];
}

export function playsOfTypology(
  history: readonly BattleUsageEntry[],
  side: 0 | 1,
  typology: string,
  round?: number,
): number {
  return history.filter((entry) => {
    if (entry.side !== side) {
      return false;
    }
    if (round !== undefined && entry.round !== round) {
      return false;
    }
    return typologyContribution(entry).includes(typology as Typology);
  }).length;
}
