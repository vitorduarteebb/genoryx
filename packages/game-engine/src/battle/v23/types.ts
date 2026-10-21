import type {
  EffectDomain,
  InterventionOp,
  ResolutionProfile,
  ResponseWindow,
  StackSpeed,
  TimingClass,
} from "@nexora/config";

export type EffectNode = {
  id: string;
  op: string;
  value?: number;
  status?: string;
  duration?: number;
  resource?: string;
  counterable: boolean;
  tags: string[];
  domain: EffectDomain;
  priority: number;
  suppressed: boolean;
  cancelled: boolean;
  amplified: number;
};

export type EffectGraph = {
  nodes: EffectNode[];
};

export type StackFrame = {
  id: string;
  side: 0 | 1;
  cardInstanceId?: string;
  cardKey: string;
  cardName: string;
  sourceCreatureId?: string;
  targetId?: string;
  timingClass: TimingClass;
  stackSpeed: StackSpeed;
  domain: EffectDomain;
  interventionOp?: InterventionOp;
  graph: EffectGraph;
  manaPaid: number;
  surcharge: number;
  responseIndex: number;
  virtual?: "FUSION" | "GENETIC_POWER";
  recipeId?: string;
  cancelled: boolean;
  delayed: boolean;
  sealed: "NONE" | "NORMAL_LOCK";
  redirectedTo?: string;
};

export type PreparedEffect = {
  id: string;
  side: 0 | 1;
  sourceCreatureId?: string;
  cardKey: string;
  cardName: string;
  trigger: string;
  remainingRounds: number;
  visibility: "PUBLIC" | "HIDDEN";
  graph: EffectGraph;
  profile: ResolutionProfile;
};

export type ChannelState = {
  id: string;
  side: 0 | 1;
  sourceCreatureId: string;
  cardKey: string;
  cardName: string;
  current: number;
  required: number;
  interruptConditions: string[];
  graph: EffectGraph;
  profile: ResolutionProfile;
};

export type MagicWarState = {
  open: boolean;
  window: ResponseWindow | null;
  frames: StackFrame[];
  prioritySide: 0 | 1;
  passes: [boolean, boolean];
  priorityDeadline: number;
  autoPass: [boolean, boolean];
  remainingQueue: Array<{ cardInstanceId: string; targetId?: string }>;
  lock: boolean;
  rootFrameId?: string;
};

export type VirtualManifestation = {
  id: string;
  kind: "FUSION" | "GENETIC_POWER";
  namePt: string;
  recipeId: string;
  profile: ResolutionProfile;
  graph: EffectGraph;
  stackBehavior: "INTERRUPTIBLE" | "RESOLVE";
  tokens: string[];
};

export type MagicWarDebug = {
  rootFrame?: string;
  responses: string[];
  passes: number;
  surcharge: number[];
  manaBefore: [number, number];
  manaAfter: [number, number];
  resolutionOrder: string[];
  cancelledNodes: string[];
  suppressedNodes: string[];
  redirects: string[];
};

export type CombatV23Metrics = {
  impetusUsage: number;
  reactionUsage: number;
  counterUsage: number;
  preparationActivation: number;
  channelInterruption: number;
  magicWarCount: number;
  magicWarDepth: number;
  actionsOpenedStack: number;
  actionsResolvedDirect: number;
  manaGained: number;
  manaSpent: number;
  manaStarvation: number;
  fusionInterrupt: number;
  stackCancel: number;
};
