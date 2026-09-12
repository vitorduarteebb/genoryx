import type {
  CardEffectOp,
  CardRange,
  CardTargetType,
  Element,
  GeneticCardLocusRole,
  InterventionTrigger,
  Typology,
} from "@nexora/types";
import { speciesElements } from "./species";

export type AbilityCondition = {
  selfPosition?: string;
  targetHas?: string;
  resourceAtLeast?: number;
  targetHpBelow?: number;
};

export type CardEffectDef = {
  op: CardEffectOp | "GAIN_RESOURCE" | "CONSUME_RESOURCE";
  value?: number;
  status?: string;
  duration?: number;
  condition?: AbilityCondition;
  resource?: string;
};

export type CardDefinition = {
  key: string;
  name: string;
  type: "ATTACK" | "SKILL" | "REACTION" | "ULTIMATE" | "GENETIC" | "SYNERGY";
  cost: number;
  rank: number;
  element: Element;
  targetType: CardTargetType;
  locusRole?: GeneticCardLocusRole;
  tags: readonly string[];
  visualTags?: readonly string[];
  species: readonly string[];
  effects: readonly CardEffectDef[];
  ability?: {
    clauses: readonly CardEffectDef[];
    produces: readonly string[];
    consumes: readonly string[];
    reactsTo: readonly string[];
    positions: readonly string[];
  };
  /** Contrato da Guerra Mágica / Matrix V2. Ausente = derivado de type/tags. */
  range?: CardRange;
  momentumAltCost?: number | null;
  interventionTrigger?: InterventionTrigger;
  draftWeightBase?: number;
  typology?: Typology;
};

export function cardPowerRank(def: { locusRole?: GeneticCardLocusRole; cost: number }): number {
  switch (def.locusRole) {
    case "BASIC_ATTACK":
      return 1;
    case "SECONDARY_ATTACK":
      return 2;
    case "ELEMENTAL":
      return 3;
    case "DEFENSE":
    case "UTILITY":
    case "REACTION":
      return 2;
    case "CONTROL":
      return 4;
    case "SYNERGY":
      return 5;
    case "SIGNATURE":
      return 6;
    case "ULTIMATE":
      return def.cost >= 4 ? 10 : 8;
    default:
      return Math.min(10, Math.max(1, def.cost));
  }
}

const card = (def: Omit<CardDefinition, "rank">): CardDefinition => ({
  ...def,
  rank: cardPowerRank(def),
});

export const cardCatalog: readonly CardDefinition[] = [
  card({
    key: "ember_strike",
    name: "Ember Strike",
    type: "ATTACK",
    cost: 1,
    element: "FIRE",
    targetType: "ENEMY",
    locusRole: "BASIC_ATTACK",
    tags: ["BURN"],
    species: ["pyron", "drakor"],
    effects: [
      { op: "DAMAGE", value: 14 },
      { op: "APPLY_STATUS", status: "BURN", duration: 2 },
    ],
  }),
  card({
    key: "flame_rush",
    name: "Flame Rush",
    type: "ATTACK",
    cost: 2,
    element: "FIRE",
    targetType: "ENEMY",
    locusRole: "SECONDARY_ATTACK",
    tags: ["BURN"],
    species: ["pyron", "drakor"],
    effects: [{ op: "DAMAGE", value: 22 }],
  }),
  card({
    key: "cinder_bolt",
    name: "Cinder Bolt",
    type: "ATTACK",
    cost: 2,
    element: "FIRE",
    targetType: "ENEMY",
    locusRole: "ELEMENTAL",
    tags: ["BURN", "FIRE"],
    species: ["pyron"],
    effects: [
      { op: "DAMAGE", value: 18 },
      { op: "APPLY_STATUS", status: "BURN", duration: 3 },
    ],
  }),
  card({
    key: "heat_plate",
    name: "Heat Plate",
    type: "SKILL",
    cost: 1,
    element: "FIRE",
    targetType: "SELF",
    locusRole: "DEFENSE",
    tags: ["TANK"],
    species: ["pyron"],
    effects: [{ op: "SHIELD", value: 16 }],
  }),
  card({
    key: "spark_step",
    name: "Spark Step",
    type: "SKILL",
    cost: 1,
    element: "FIRE",
    targetType: "SELF",
    locusRole: "UTILITY",
    tags: ["FIRE"],
    species: ["pyron"],
    effects: [
      { op: "DRAW", value: 1 },
      { op: "GAIN_ENERGY", value: 1 },
    ],
  }),
  card({
    key: "ash_snare",
    name: "Ash Snare",
    type: "SKILL",
    cost: 2,
    element: "FIRE",
    targetType: "ENEMY",
    locusRole: "CONTROL",
    tags: ["CONTROL"],
    species: ["pyron"],
    effects: [
      { op: "DAMAGE", value: 8 },
      { op: "APPLY_STATUS", status: "STUN", duration: 1 },
    ],
  }),
  card({
    key: "flare_guard",
    name: "Flare Guard",
    type: "REACTION",
    cost: 1,
    element: "FIRE",
    targetType: "SELF",
    locusRole: "REACTION",
    tags: ["TANK"],
    species: ["pyron"],
    effects: [{ op: "SHIELD", value: 12 }],
  }),
  card({
    key: "kindling_pact",
    name: "Kindling Pact",
    type: "SKILL",
    cost: 1,
    element: "FIRE",
    targetType: "SELF",
    locusRole: "SYNERGY",
    tags: ["BURN", "FIRE"],
    species: ["pyron"],
    effects: [{ op: "GAIN_MOMENTUM", value: 2 }],
  }),
  card({
    key: "crimson_roar",
    name: "Crimson Roar",
    type: "ATTACK",
    cost: 3,
    element: "FIRE",
    targetType: "ALL_ENEMIES",
    locusRole: "SIGNATURE",
    tags: ["BURN", "FIRE"],
    visualTags: ["EMBER_RIDGE_SUBTLE"],
    species: ["pyron", "drakor"],
    effects: [
      { op: "DAMAGE", value: 16 },
      { op: "APPLY_STATUS", status: "BURN", duration: 2 },
    ],
  }),
  card({
    key: "inferno_burst",
    name: "Inferno Burst",
    type: "ULTIMATE",
    cost: 4,
    element: "FIRE",
    targetType: "ENEMY",
    locusRole: "ULTIMATE",
    tags: ["BURN", "FIRE"],
    visualTags: ["WARM_CORE_GLOW"],
    species: ["pyron", "drakor"],
    effects: [{ op: "DAMAGE", value: 38 }],
  }),
  card({
    key: "aqua_jab",
    name: "Aqua Jab",
    type: "ATTACK",
    cost: 1,
    element: "WATER",
    targetType: "ENEMY",
    locusRole: "BASIC_ATTACK",
    tags: ["WATER"],
    species: ["nympha", "aqualis"],
    effects: [{ op: "DAMAGE", value: 13 }],
  }),
  card({
    key: "tide_slam",
    name: "Tide Slam",
    type: "ATTACK",
    cost: 2,
    element: "WATER",
    targetType: "ENEMY",
    locusRole: "SECONDARY_ATTACK",
    tags: ["WATER"],
    species: ["nympha"],
    effects: [{ op: "DAMAGE", value: 20 }],
  }),
  card({
    key: "water_jet",
    name: "Water Jet",
    type: "ATTACK",
    cost: 2,
    element: "WATER",
    targetType: "ENEMY",
    locusRole: "ELEMENTAL",
    tags: ["WATER"],
    species: ["nympha", "aqualis"],
    effects: [{ op: "DAMAGE", value: 19 }],
  }),
  card({
    key: "bubble_film",
    name: "Bubble Film",
    type: "SKILL",
    cost: 1,
    element: "WATER",
    targetType: "SELF",
    locusRole: "DEFENSE",
    tags: ["WATER"],
    species: ["nympha"],
    effects: [{ op: "SHIELD", value: 14 }],
  }),
  card({
    key: "mend_current",
    name: "Mend Current",
    type: "SKILL",
    cost: 2,
    element: "WATER",
    targetType: "ALLY",
    locusRole: "UTILITY",
    tags: ["HEAL", "WATER"],
    species: ["nympha"],
    effects: [{ op: "HEAL", value: 22 }],
  }),
  card({
    key: "bind_kelp",
    name: "Bind Kelp",
    type: "SKILL",
    cost: 2,
    element: "WATER",
    targetType: "ENEMY",
    locusRole: "CONTROL",
    tags: ["CONTROL", "WATER"],
    species: ["nympha"],
    effects: [
      { op: "DAMAGE", value: 6 },
      { op: "APPLY_STATUS", status: "SLEEP", duration: 1 },
    ],
  }),
  card({
    key: "ripple_ward",
    name: "Ripple Ward",
    type: "REACTION",
    cost: 1,
    element: "WATER",
    targetType: "SELF",
    locusRole: "REACTION",
    tags: ["WATER"],
    species: ["nympha"],
    effects: [
      { op: "SHIELD", value: 10 },
      { op: "REMOVE_STATUS" },
    ],
  }),
  card({
    key: "tidal_pact",
    name: "Tidal Pact",
    type: "SKILL",
    cost: 1,
    element: "WATER",
    targetType: "SELF",
    locusRole: "SYNERGY",
    tags: ["WATER", "NATURE"],
    species: ["nympha", "florune"],
    effects: [
      { op: "DRAW", value: 1 },
      { op: "GAIN_MOMENTUM", value: 1 },
    ],
  }),
  card({
    key: "moon_tide",
    name: "Moon Tide",
    type: "ATTACK",
    cost: 3,
    element: "WATER",
    targetType: "ALL_ENEMIES",
    locusRole: "SIGNATURE",
    tags: ["WATER"],
    species: ["nympha"],
    effects: [
      { op: "DAMAGE", value: 14 },
      { op: "HEAL", value: 10 },
    ],
  }),
  card({
    key: "abyss_surge",
    name: "Abyss Surge",
    type: "ULTIMATE",
    cost: 4,
    element: "WATER",
    targetType: "ENEMY",
    locusRole: "ULTIMATE",
    tags: ["WATER"],
    visualTags: ["VOID_DEPTH_HINT"],
    species: ["nympha", "aqualis"],
    effects: [{ op: "DAMAGE", value: 34 }],
  }),
  card({
    key: "vine_tap",
    name: "Vine Tap",
    type: "ATTACK",
    cost: 1,
    element: "NATURE",
    targetType: "ENEMY",
    locusRole: "BASIC_ATTACK",
    tags: ["NATURE"],
    species: ["florune"],
    effects: [{ op: "DAMAGE", value: 12 }],
  }),
  card({
    key: "thorn_spike",
    name: "Thorn Spike",
    type: "ATTACK",
    cost: 2,
    element: "NATURE",
    targetType: "ENEMY",
    locusRole: "SECONDARY_ATTACK",
    tags: ["NATURE"],
    species: ["florune"],
    effects: [
      { op: "DAMAGE", value: 18 },
      { op: "APPLY_STATUS", status: "POISON", duration: 2 },
    ],
  }),
  card({
    key: "bloom_burst",
    name: "Bloom Burst",
    type: "ATTACK",
    cost: 2,
    element: "NATURE",
    targetType: "ENEMY",
    locusRole: "ELEMENTAL",
    tags: ["NATURE"],
    species: ["florune"],
    effects: [{ op: "DAMAGE", value: 20 }],
  }),
  card({
    key: "bark_guard",
    name: "Bark Guard",
    type: "SKILL",
    cost: 1,
    element: "NATURE",
    targetType: "SELF",
    locusRole: "DEFENSE",
    tags: ["TANK", "NATURE"],
    species: ["florune"],
    effects: [{ op: "SHIELD", value: 18 }],
  }),
  card({
    key: "pollen_drift",
    name: "Pollen Drift",
    type: "SKILL",
    cost: 1,
    element: "NATURE",
    targetType: "SELF",
    locusRole: "UTILITY",
    tags: ["NATURE"],
    species: ["florune"],
    effects: [
      { op: "HEAL", value: 10 },
      { op: "DRAW", value: 1 },
    ],
  }),
  card({
    key: "root_snare",
    name: "Root Snare",
    type: "SKILL",
    cost: 2,
    element: "NATURE",
    targetType: "ENEMY",
    locusRole: "CONTROL",
    tags: ["CONTROL", "NATURE"],
    species: ["florune"],
    effects: [
      { op: "DAMAGE", value: 7 },
      { op: "APPLY_STATUS", status: "STUN", duration: 1 },
    ],
  }),
  card({
    key: "leaf_veil",
    name: "Leaf Veil",
    type: "REACTION",
    cost: 1,
    element: "NATURE",
    targetType: "SELF",
    locusRole: "REACTION",
    tags: ["NATURE"],
    species: ["florune"],
    effects: [{ op: "SHIELD", value: 11 }],
  }),
  card({
    key: "grove_pact",
    name: "Grove Pact",
    type: "SKILL",
    cost: 1,
    element: "NATURE",
    targetType: "SELF",
    locusRole: "SYNERGY",
    tags: ["NATURE", "WATER"],
    species: ["florune"],
    effects: [{ op: "GAIN_MOMENTUM", value: 2 }],
  }),
  card({
    key: "sunpetal",
    name: "Sunpetal",
    type: "SKILL",
    cost: 3,
    element: "NATURE",
    targetType: "ALL_ALLIES",
    locusRole: "SIGNATURE",
    tags: ["HEAL", "NATURE"],
    species: ["florune"],
    effects: [{ op: "HEAL", value: 16 }],
  }),
  card({
    key: "verdant_bloom",
    name: "Verdant Bloom",
    type: "ULTIMATE",
    cost: 4,
    element: "NATURE",
    targetType: "ENEMY",
    locusRole: "ULTIMATE",
    tags: ["NATURE"],
    visualTags: ["LIVING_GROWTH_MARKS"],
    species: ["florune"],
    effects: [
      { op: "DAMAGE", value: 28 },
      { op: "HEAL", value: 12 },
    ],
  }),
  card({
    key: "stone_guard",
    name: "Stone Guard",
    type: "SKILL",
    cost: 1,
    element: "EARTH",
    targetType: "SELF",
    locusRole: "DEFENSE",
    tags: ["TANK"],
    species: ["terranox", "grumak"],
    effects: [{ op: "SHIELD", value: 20 }],
  }),
  card({
    key: "quake_stomp",
    name: "Quake Stomp",
    type: "ATTACK",
    cost: 2,
    element: "EARTH",
    targetType: "ENEMY",
    locusRole: "BASIC_ATTACK",
    tags: ["TANK", "EARTH"],
    species: ["terranox", "grumak"],
    effects: [{ op: "DAMAGE", value: 17 }],
  }),
  card({
    key: "granite_wall",
    name: "Granite Wall",
    type: "SKILL",
    cost: 2,
    element: "EARTH",
    targetType: "SELF",
    locusRole: "DEFENSE",
    tags: ["TANK"],
    species: ["terranox"],
    effects: [{ op: "SHIELD", value: 26 }],
  }),
  card({
    key: "dust_cloud",
    name: "Dust Cloud",
    type: "SKILL",
    cost: 1,
    element: "EARTH",
    targetType: "ENEMY",
    locusRole: "CONTROL",
    tags: ["CONTROL"],
    species: ["terranox"],
    effects: [{ op: "APPLY_STATUS", status: "BLIND", duration: 2 }],
  }),
  card({
    key: "titan_growl",
    name: "Titan Growl",
    type: "ATTACK",
    cost: 3,
    element: "EARTH",
    targetType: "ENEMY",
    locusRole: "SIGNATURE",
    tags: ["TANK"],
    species: ["terranox"],
    effects: [{ op: "DAMAGE", value: 24 }],
  }),
  card({
    key: "molten_armor",
    name: "Molten Armor",
    type: "SYNERGY",
    cost: 2,
    element: "FIRE",
    targetType: "SELF",
    tags: ["BURN", "TANK", "LIVING_FURNACE"],
    species: ["pyron", "drakor"],
    effects: [{ op: "SHIELD", value: 18 }],
  }),
  card({
    key: "plasma_arc",
    name: "Plasma Arc",
    type: "SYNERGY",
    cost: 2,
    element: "ELECTRIC",
    targetType: "ENEMY",
    tags: ["FIRE", "ELECTRIC"],
    species: ["pyron", "voltaris"],
    effects: [
      { op: "DAMAGE", value: 21 },
      { op: "APPLY_STATUS", status: "SHOCK", duration: 2 },
    ],
  }),
  card({
    key: "overgrowth",
    name: "Overgrowth",
    type: "SYNERGY",
    cost: 2,
    element: "NATURE",
    targetType: "ALLY",
    tags: ["WATER", "NATURE"],
    species: ["nympha", "florune"],
    effects: [
      { op: "HEAL", value: 14 },
      { op: "SHIELD", value: 10 },
    ],
  }),
  card({
    key: "boulder_toss",
    name: "Boulder Toss",
    type: "ATTACK",
    cost: 2,
    element: "EARTH",
    targetType: "ENEMY",
    locusRole: "SECONDARY_ATTACK",
    tags: ["TANK", "EARTH"],
    species: ["terranox", "grumak"],
    effects: [{ op: "DAMAGE", value: 19 }],
  }),
  card({
    key: "tremor_pulse",
    name: "Tremor Pulse",
    type: "SKILL",
    cost: 2,
    element: "EARTH",
    targetType: "ENEMY",
    locusRole: "ELEMENTAL",
    tags: ["EARTH"],
    species: ["terranox"],
    effects: [{ op: "DAMAGE", value: 16 }],
  }),
  card({
    key: "stone_brace",
    name: "Stone Brace",
    type: "SKILL",
    cost: 1,
    element: "EARTH",
    targetType: "SELF",
    locusRole: "UTILITY",
    tags: ["TANK"],
    species: ["terranox"],
    effects: [
      { op: "SHIELD", value: 10 },
      { op: "DRAW", value: 1 },
    ],
  }),
  card({
    key: "rumble_guard",
    name: "Rumble Guard",
    type: "REACTION",
    cost: 1,
    element: "EARTH",
    targetType: "SELF",
    locusRole: "REACTION",
    tags: ["TANK"],
    species: ["terranox"],
    effects: [{ op: "SHIELD", value: 14 }],
  }),
  card({
    key: "bedrock_pact",
    name: "Bedrock Pact",
    type: "SYNERGY",
    cost: 1,
    element: "EARTH",
    targetType: "SELF",
    locusRole: "SYNERGY",
    tags: ["TANK", "EARTH"],
    species: ["terranox", "grumak"],
    effects: [{ op: "GAIN_MOMENTUM", value: 2 }],
  }),
  card({
    key: "mountain_crash",
    name: "Mountain Crash",
    type: "ULTIMATE",
    cost: 4,
    element: "EARTH",
    targetType: "ENEMY",
    locusRole: "ULTIMATE",
    tags: ["TANK", "EARTH"],
    species: ["terranox"],
    effects: [{ op: "DAMAGE", value: 32 }],
  }),
  card({
    key: "spark_jolt",
    name: "Spark Jolt",
    type: "ATTACK",
    cost: 1,
    element: "ELECTRIC",
    targetType: "ENEMY",
    locusRole: "ELEMENTAL",
    tags: ["ELECTRIC"],
    species: ["voltaris", "sparkyn"],
    effects: [
      { op: "DAMAGE", value: 15 },
      { op: "APPLY_STATUS", status: "SHOCK", duration: 1 },
    ],
  }),
  card({
    key: "abyss_needle",
    name: "Abyss Needle",
    type: "ATTACK",
    cost: 2,
    element: "DARK",
    targetType: "ENEMY",
    locusRole: "CONTROL",
    tags: ["CONTROL", "BACKLINE"],
    species: ["noctyr"],
    effects: [{ op: "DAMAGE", value: 16 }],
  }),
];

const byKey = new Map(cardCatalog.map((row) => [row.key, row]));

export function getCardDefinition(key: string): CardDefinition | undefined {
  return byKey.get(key);
}

export function cardsForSpecies(speciesKey: string): CardDefinition[] {
  return cardCatalog.filter((row) => row.species.includes(speciesKey));
}

export function cardBelongsToSpecies(card: CardDefinition, speciesKey: string): boolean {
  if (card.species.includes(speciesKey)) {
    return true;
  }
  const element = speciesElements[speciesKey];
  return Boolean(element) && card.element === element;
}

export function cardsForLocus(speciesKey: string, role: GeneticCardLocusRole): CardDefinition[] {
  const ofSpecies = cardCatalog.filter((row) => row.species.includes(speciesKey) && row.locusRole === role);
  if (ofSpecies.length > 0) {
    return ofSpecies;
  }
  const element = speciesElements[speciesKey];
  if (!element) {
    return [];
  }
  return cardCatalog.filter((row) => row.element === element && row.locusRole === role);
}
