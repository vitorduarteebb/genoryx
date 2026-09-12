import type { MatchRules, RetargetPolicy } from "@nexora/config";
import type {
  BattleActionType,
  BattleDraftPhase,
  BattleRulesVersion,
  Element,
  FormationSlot,
  TargetRule,
} from "@nexora/types";
import type { BattleUsageEntry } from "./matrix/usage";
import type { DraftState } from "./matrix/draft";

export type QueuedAction = {
  id: string;
  cardInstanceId: string;
  card: CardInstance;
  targetId?: string;
  reservedEnergy: number;
  retargetPolicy: RetargetPolicy;
  sourceCreatureId?: string;
};

export type TeamResonanceState = {
  value: number;
  max: number;
  ready: boolean;
  amplifyPending: boolean;
  gainedThisBattle: number;
};

export type ReactionSlotState = {
  card: CardInstance;
  paidCost: number;
  armedRound: number;
  armedBySide: 0 | 1;
};

export type GeneticChainLink = {
  creatureId: string;
  creatureName: string;
  cardKey: string;
  cardName: string;
  produces: string[];
  consumes: string[];
  reactsTo: string[];
  transforms: string[];
};

export type GeneticChainState = {
  links: GeneticChainLink[];
  maxLength: number;
  lastTokens: string[];
};

export type BattleClock = {
  turnStartedAt: number;
  timeBank: [number, number];
  consecutiveAuto: [number, number];
};

export type ReplayAction = {
  seq: number;
  side: 0 | 1;
  round: number;
  action: BattleAction;
};

export type BattleReplay = {
  matchSeed: number;
  rulesVersion: string;
  actions: ReplayAction[];
  eventSequence: number;
};

export type CombatStatus = {
  key: string;
  stacks: number;
  remainingRounds: number;
};

export type Combatant = {
  id: string;
  creatureId?: string;
  name: string;
  speciesKey: string;
  element: Element;
  hp: number;
  maxHp: number;
  shield: number;
  atk: number;
  def: number;
  mag: number;
  res: number;
  spd: number;
  crit: number;
  tags: string[];
  statuses: CombatStatus[];
  slot: FormationSlot;
  typology?: string;
  powerId?: string;
  powerLineageId?: string;
  resources?: Record<string, number>;
  resourceCap?: Record<string, number>;
  resourceDef?: import("@nexora/config").PersonalResourceDefinition;
  identityName?: string;
  supremeReady?: boolean;
  resolveStacks?: number;
};

export type PlayableCard = {
  key: string;
  name: string;
  type: "ATTACK" | "SKILL" | "REACTION" | "ULTIMATE" | "GENETIC" | "SYNERGY";
  cost: number;
  element: Element;
  targetType: string;
  locusRole?: string;
  typology?: string;
  tags: readonly string[];
  visualTags?: readonly string[];
  effects: ReadonlyArray<{
    op: string;
    value?: number;
    status?: string;
    duration?: number;
    condition?: { selfPosition?: string; targetHas?: string; resourceAtLeast?: number; targetHpBelow?: number };
    resource?: string;
  }>;
  ability?: {
    clauses: PlayableCard["effects"];
    produces: readonly string[];
    consumes: readonly string[];
    reactsTo: readonly string[];
    transforms?: readonly string[];
    requires?: readonly string[];
    positions: readonly string[];
    retargetPolicy?: RetargetPolicy;
  };
};

export type CardInstance = {
  instanceId: string;
  definitionKey: string;
  sourceCreatureId?: string;
  sourceSlot?: import("@nexora/types").FormationSlot;
  geneticPowerId?: string;
  typology?: string;
  element?: string;
  locus?: string;
  cardDefinitionId?: string;
  variant?: string;
  resolved?: PlayableCard;
};

export type BattleSide = {
  id: string;
  characterId?: string;
  displayName: string;
  energy: number;
  momentum: number;
  deck: CardInstance[];
  hand: CardInstance[];
  discard: CardInstance[];
  exile: CardInstance[];
  creatures: Combatant[];
  rosterIds?: string[];
  bannedCreatureId?: string | null;
  selectedIds?: string[];
  benchedCreatureId?: string | null;
  activeTypologies?: string[];
  fusion?: BattleFusionState;
  reservedEnergy?: number;
  actionQueue?: QueuedAction[];
  reactionSlot?: ReactionSlotState | null;
  teamResonance?: TeamResonanceState;
  geneticChain?: GeneticChainState;
  reactionArmedVisible?: boolean;
};

export type BattleEvent = {
  type: string;
  actorSide?: number;
  cardKey?: string;
  targetId?: string;
  value?: number;
  text: string;
  eventId?: string;
  parentEventId?: string;
  reactionDepth?: number;
  ownerCreatureId?: string;
  resourceId?: string;
  amount?: number;
  triggerRuleId?: string;
  sourceEventId?: string;
  sourceCardId?: string;
  sourceCreatureId?: string;
  reason?: string;
  damageBreakdown?: Record<string, number>;
};

export type FusionPoolEntry = {
  familyKey: string;
  namePt: string;
  ready: boolean;
  triple: boolean;
  kind: "FUSION" | "CONVERGENCE";
  textPt: string;
  reason: string;
};

export type BattleFusionState = {
  resonance: number;
  triggerDepth: number;
  pool: FusionPoolEntry[];
  awakened: string | null;
  convergence: string | null;
  consumed?: string[];
  byTypology?: Record<string, number>;
  windowAnnounced?: boolean;
  convergenceAnnounced?: boolean;
  telegraph?: "HIGH_RESONANCE" | null;
};

export type BattleState = {
  id: string;
  type: "PVE" | "PVP";
  status: "ACTIVE" | "FINISHED" | "FLED";
  rulesVersion: BattleRulesVersion;
  phase?: BattleDraftPhase;
  seed: number;
  rngIndex: number;
  round: number;
  activeSide: 0 | 1;
  sides: [BattleSide, BattleSide];
  winnerSide?: 0 | 1;
  wildSpeciesKey?: string;
  mapKey?: string;
  matchRules?: MatchRules;
  clock?: BattleClock;
  replay?: BattleReplay;
  eventSeq?: number;
  draft?: DraftState;
  log: BattleEvent[];
  usageHistory: BattleUsageEntry[];
  /** Espelho do lado ativo. A fonte da verdade é `sides[n].fusion`. */
  fusion?: BattleFusionState;
};

export type BattleAction =
  | { type: Extract<BattleActionType, "PLAY_CARD">; cardInstanceId: string; targetId?: string }
  | { type: Extract<BattleActionType, "QUEUE_CARD">; cardInstanceId: string; targetId?: string }
  | { type: Extract<BattleActionType, "UNQUEUE_CARD">; queueId: string }
  | { type: Extract<BattleActionType, "REORDER_QUEUE">; order: string[] }
  | { type: Extract<BattleActionType, "RETARGET_QUEUE">; queueId: string; targetId: string }
  | { type: Extract<BattleActionType, "CONFIRM_TURN"> }
  | { type: Extract<BattleActionType, "ARM_REACTION">; cardInstanceId: string }
  | { type: Extract<BattleActionType, "RESONANCE_ACTION">; action: "RESONANCE_SHIFT" | "GENETIC_DRAW" | "RESONANCE_AMPLIFY"; creatureId?: string; destSlot?: string; discardInstanceId?: string }
  | { type: Extract<BattleActionType, "TIMEOUT"> }
  | { type: Extract<BattleActionType, "END_TURN"> }
  | { type: Extract<BattleActionType, "FLEE"> }
  | { type: Extract<BattleActionType, "CONCEDE">; side: 0 | 1 }
  | { type: Extract<BattleActionType, "CAPTURE">; orbKey: string }
  | { type: Extract<BattleActionType, "SELECT_FUSION">; familyKey: string }
  | { type: Extract<BattleActionType, "PLAY_FUSION">; familyKey: string; targetId?: string }
  | { type: Extract<BattleActionType, "PLAY_CONVERGENCE">; familyKey?: string; targetId?: string }
  | { type: Extract<BattleActionType, "SET_FORMATION">; slots: Partial<Record<FormationSlot, string>> };

export type { TargetRule };
