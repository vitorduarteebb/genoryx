import { combatV15Config } from "@nexora/config";
import type { BattleSide, BattleState, CardInstance, PlayableCard } from "../types";
import { isReactionCard } from "./card-meta";
import { resolveMatchRules } from "./match-rules";

export function canArmReaction(card: PlayableCard | null | undefined): boolean {
  return isReactionCard(card);
}

export function armReaction(state: BattleState, side: BattleSide, card: CardInstance, cost: number): boolean {
  if (!resolveMatchRules(state).reactionSlotEnabled) {
    return false;
  }
  if (side.reactionSlot) {
    return false;
  }
  side.reactionSlot = {
    card,
    paidCost: cost,
    armedRound: state.round,
    armedBySide: state.activeSide,
  };
  state.log.push({
    type: "REACTION_ARMED",
    actorSide: state.activeSide,
    text: `${side.displayName} arma uma reação.`,
  });
  return true;
}

export function expireReaction(state: BattleState, side: BattleSide) {
  if (!side.reactionSlot) {
    return;
  }
  side.discard.push(side.reactionSlot.card);
  state.log.push({
    type: "REACTION_EXPIRED",
    text: `Reação de ${side.displayName} expirou. Sem reembolso.`,
  });
  side.reactionSlot = null;
}

export function reactionPriority(
  card: PlayableCard | undefined,
  actor: { spd: number; slot: string; id: string } | undefined,
): number[] {
  const cardPri = card?.type === "REACTION" ? 3 : card?.tags.includes("COUNTER") ? 2 : 1;
  const reactionPri = card?.tags.includes("INTERCEPT") ? 3 : 1;
  const spd = actor?.spd ?? 0;
  const position = actor?.slot === "FRONT" ? 3 : actor?.slot === "MIDDLE" || actor?.slot === "BACK_LEFT" ? 2 : 1;
  return [cardPri, reactionPri, spd, position, actor?.id ?? ""].map((row) => (typeof row === "number" ? row : 0));
}

export function sortByReactionPriority<T extends { card?: PlayableCard; actor?: { spd: number; slot: string; id: string } }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const left = reactionPriority(a.card, a.actor);
    const right = reactionPriority(b.card, b.actor);
    for (let i = 0; i < 4; i += 1) {
      if (left[i] !== right[i]) return (right[i] ?? 0) - (left[i] ?? 0);
    }
    return (a.actor?.id ?? "").localeCompare(b.actor?.id ?? "");
  });
}

const reacted = new WeakMap<BattleState, Set<string>>();

export function canReactToEvent(state: BattleState, effectId: string, eventId: string): boolean {
  const key = `${effectId}:${eventId}`;
  const seen = reacted.get(state) ?? new Set<string>();
  if (seen.has(key)) {
    return false;
  }
  seen.add(key);
  reacted.set(state, seen);
  return true;
}

export function reactionDepthOk(depth: number, max = combatV15Config.maxReactionDepth): boolean {
  return depth < max;
}

export function opponentSeesArmed(side: BattleSide): boolean {
  return Boolean(side.reactionSlot);
}
