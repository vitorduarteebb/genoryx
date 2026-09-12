import { geneticPowerConfig } from "@nexora/config";
import type { Typology } from "@nexora/types";

export type ResonanceState = {
  value: number;
  triggerDepth: number;
  oncePerRound: string[];
};

export function emptyResonance(): ResonanceState {
  return { value: 0, triggerDepth: 0, oncePerRound: [] };
}

export function addResonance(state: ResonanceState, amount: number): ResonanceState {
  return { ...state, value: state.value + amount };
}

export function resonanceForPlay(cardTags: readonly string[], partyTypologies: readonly Typology[]): number {
  const living = new Set(partyTypologies);
  const hit = cardTags.some((tag) => living.has(tag as Typology));
  return hit ? geneticPowerConfig.resonancePlay : 0;
}

export function resonanceForPlayCapped(
  cardTags: readonly string[],
  partyTypologies: readonly Typology[],
  alreadyThisRound: number,
  cap: number,
  diminishingAfter: number,
): number {
  const raw = resonanceForPlay(cardTags, partyTypologies);
  if (raw <= 0 || alreadyThisRound >= cap) {
    return 0;
  }
  if (alreadyThisRound >= diminishingAfter) {
    return 0;
  }
  return raw;
}

export function guardTrigger(state: ResonanceState, key: string): { ok: boolean; next: ResonanceState } {
  if (state.triggerDepth >= geneticPowerConfig.maxTriggerDepth) {
    return { ok: false, next: state };
  }
  if (state.oncePerRound.includes(key)) {
    return { ok: false, next: state };
  }
  return {
    ok: true,
    next: {
      ...state,
      triggerDepth: state.triggerDepth + 1,
      oncePerRound: [...state.oncePerRound, key],
    },
  };
}

export function resetRoundTriggers(state: ResonanceState): ResonanceState {
  return { ...state, triggerDepth: 0, oncePerRound: [] };
}
