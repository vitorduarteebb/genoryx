import { combatEngineConfig } from "@nexora/config";
import type { RandomService } from "../../random/random-service";
import type { BattleUsageEntry } from "./usage";

function entryHasTypology(entry: BattleUsageEntry, typology: string): boolean {
  return entry.typology === typology || entry.mechanicTags.includes(typology);
}

export type TypologyWeight = {
  typology: string;
  weight: number;
  sameTurnPlays: number;
  previousTurnPlays: number;
};

/** 1 carta por criatura viva, teto 3. Presença no tabuleiro, não no deck. */
export function presenceDrawCount(livingCreatures: number): number {
  return Math.max(0, Math.min(combatEngineConfig.presenceDrawMax, Math.floor(livingCreatures)));
}

/**
 * Memória tática: tipo não usado = 1; cada play em T soma +3; cada play em T-1 soma +1.
 * Acúmulo: duas BURN no turno atual = 1 + 3 + 3 = 7.
 */
export function typologyDraftWeight(
  typology: string,
  history: readonly BattleUsageEntry[],
  side: 0 | 1,
  currentRound: number,
  base: number = combatEngineConfig.draftWeightUnused,
): TypologyWeight {
  let sameTurnPlays = 0;
  let previousTurnPlays = 0;
  for (const entry of history) {
    if (entry.side !== side) {
      continue;
    }
    if (!entryHasTypology(entry, typology)) {
      continue;
    }
    if (entry.round === currentRound) {
      sameTurnPlays += 1;
    } else if (entry.round === currentRound - 1) {
      previousTurnPlays += 1;
    }
  }
  const weight =
    base +
    sameTurnPlays * combatEngineConfig.draftWeightSameTurn +
    previousTurnPlays * combatEngineConfig.draftWeightPreviousTurn;
  return { typology, weight, sameTurnPlays, previousTurnPlays };
}

export function refreshDraftWeights(
  typologies: readonly string[],
  history: readonly BattleUsageEntry[],
  side: 0 | 1,
  currentRound: number,
): TypologyWeight[] {
  return typologies.map((typology) => typologyDraftWeight(typology, history, side, currentRound));
}

export type WeightedCard = {
  instanceId: string;
  typology?: string;
  draftWeightBase?: number;
};

/** Saca `count` cartas com peso da tipologia. Sem tipologia = peso 1. RNG só via RandomService. */
export function drawWeighted<T extends WeightedCard>(
  deck: T[],
  count: number,
  history: readonly BattleUsageEntry[],
  side: 0 | 1,
  currentRound: number,
  rng: RandomService,
): { drawn: T[]; deck: T[] } {
  const next = [...deck];
  const drawn: T[] = [];
  const want = Math.max(0, Math.floor(count));
  while (drawn.length < want && next.length > 0) {
    const weights = next.map((card) =>
      card.typology
        ? typologyDraftWeight(card.typology, history, side, currentRound, card.draftWeightBase).weight
        : combatEngineConfig.draftWeightUnused,
    );
    const index = pickWeightedIndex(weights, rng);
    drawn.push(next.splice(index, 1)[0]!);
  }
  return { drawn, deck: next };
}

export function pickWeightedIndex(weights: readonly number[], rng: RandomService): number {
  const safe = weights.map((row) => Math.max(0, row));
  const total = safe.reduce((sum, row) => sum + row, 0);
  if (total <= 0) {
    return Math.min(safe.length - 1, Math.floor(rng.next() * Math.max(1, safe.length)));
  }
  let cursor = rng.next() * total;
  for (let i = 0; i < safe.length; i += 1) {
    cursor -= safe[i]!;
    if (cursor <= 0) {
      return i;
    }
  }
  return safe.length - 1;
}
