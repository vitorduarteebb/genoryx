import type { BattleAction, BattleState } from "../types";
import { resolveMatchRules } from "./match-rules";

export function appendReplay(state: BattleState, action: BattleAction) {
  state.replay = state.replay ?? {
    matchSeed: state.seed,
    rulesVersion: resolveMatchRules(state).rulesVersion,
    actions: [],
    eventSequence: 0,
  };
  state.replay.rulesVersion = resolveMatchRules(state).rulesVersion;
  state.replay.matchSeed = state.seed;
  state.replay.actions.push({
    seq: state.replay.actions.length + 1,
    side: state.activeSide,
    round: state.round,
    action,
  });
}

export function nextEventId(state: BattleState): string {
  state.eventSeq = (state.eventSeq ?? 0) + 1;
  if (state.replay) {
    state.replay.eventSequence = state.eventSeq;
  }
  return `evt-${state.eventSeq}`;
}

export function replayFoundation(state: BattleState) {
  return {
    matchSeed: state.seed,
    rulesVersion: resolveMatchRules(state).rulesVersion,
    initialRound: 1,
    deckOrder: state.sides.map((side) => ({
      id: side.id,
      deck: side.deck.map((card) => card.instanceId),
      hand: side.hand.map((card) => card.instanceId),
    })),
    actions: state.replay?.actions ?? [],
    eventSequence: state.eventSeq ?? 0,
    rngIndex: state.rngIndex,
  };
}
