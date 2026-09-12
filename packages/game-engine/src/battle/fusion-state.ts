import type { BattleFusionState } from "./types";

export function emptyFusion(): BattleFusionState {
  return {
    resonance: 0,
    triggerDepth: 0,
    pool: [],
    awakened: null,
    convergence: null,
    consumed: [],
    byTypology: {},
    telegraph: null,
  };
}

export function fusionOf(side: { fusion?: BattleFusionState }): BattleFusionState {
  if (!side.fusion) {
    side.fusion = emptyFusion();
  }
  return side.fusion;
}
