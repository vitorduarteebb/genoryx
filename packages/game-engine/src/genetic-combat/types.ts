import type { CardEffectDef, CardKitFunction, CardKitTier, PersonalResourceDefinition } from "@nexora/config";
import type { CardTargetType, Element, GeneticCardLocusKey } from "@nexora/types";

export type PersonalResource = PersonalResourceDefinition;

export type BirthRolls = {
  potency: number;
  efficiency: number;
  expression: number;
  coherence: number;
  stability: number;
  mutation: number;
  quirk: number;
  novelty: number;
  adaptability: number;
};

export type GeneticExpression = Record<string, number>;

export type CombatQuirk = {
  key: string;
  namePt: string;
  textPt: string;
};

export type CombatIdentity = {
  key: string;
  namePt: string;
  stylePt: string;
  archetype: string;
  resource: PersonalResource;
  verbs: string[];
  strengths: string[];
  weaknesses: string[];
  synergyTags: string[];
  quirks: CombatQuirk[];
  anomaly: { key: string; textPt: string } | null;
};

export type AbilityGraph = {
  trigger: "PLAYED";
  target: CardTargetType;
  clauses: CardEffectDef[];
  produces: string[];
  consumes: string[];
  reactsTo: string[];
  requires: string[];
  positions: string[];
  sourceGenes: string[];
};

export type GeneticCardManifest = {
  locus: GeneticCardLocusKey;
  tier: CardKitTier;
  function: CardKitFunction;
  namePt: string;
  cost: number;
  element: Element;
  targetType: CardTargetType;
  effects: CardEffectDef[];
  ability: AbilityGraph;
  text: string;
  sourceGenes: string[];
  luckVariant: "STABLE" | "EFFICIENT" | "UNSTABLE" | "CONDITIONAL";
};

export type GeneticCombatManifest = {
  engineVersion: string;
  birthSeed: number;
  rolls: BirthRolls;
  expression: GeneticExpression;
  identity: CombatIdentity;
  cards: GeneticCardManifest[];
  fingerprint: string;
  similarityHint: number;
};
