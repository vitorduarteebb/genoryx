import type { FormationSlot } from "@nexora/types";
import type { BattleVisualEvent } from "../battle/events";

/** Contrato de apresentação. Unity nunca calcula dano, RNG ou vitória. */
export type BattlePresentationCreature = {
  id: string;
  creatureId?: string;
  name: string;
  slot: FormationSlot;
  hp: number;
  maxHp: number;
  shield: number;
  statuses: Array<{ key: string; stacks: number }>;
  portraitUrl: string | null;
  modelUrl: string | null;
};

export type BattlePresentationSide = {
  displayName: string;
  energy: number;
  momentum: number;
  creatures: BattlePresentationCreature[];
};

export type BattlePresentationState = {
  battleId: string;
  yourSide: 0 | 1;
  yourTurn: boolean;
  round: number;
  status: string;
  shot: "wide" | "card" | "ultimate";
  sides: [BattlePresentationSide, BattlePresentationSide];
  events: BattleVisualEvent[];
  validTargets?: string[];
  middleWindow?: "OPEN" | "CLOSED";
  fusionAvailable?: string | null;
  convergenceAvailable?: string | null;
};

export type BattleIntent =
  | { type: "PLAY_CARD"; cardInstanceId: string; targetId?: string }
  | { type: "END_TURN" }
  | { type: "FLEE" }
  | { type: "CONCEDE" }
  | { type: "CAPTURE"; orbKey: string };
