export const USER_ROLES = ["PLAYER", "ADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const CHARACTER_CLASSES = [
  "GUARDIAN",
  "ARCANIST",
  "HUNTER",
  "TAMER",
  "ALCHEMIST",
] as const;
export type CharacterClass = (typeof CHARACTER_CLASSES)[number];

export const ELEMENTS = [
  "FIRE",
  "WATER",
  "NATURE",
  "EARTH",
  "ELECTRIC",
  "ICE",
  "LIGHT",
  "DARK",
  "ARCANE",
] as const;
export type Element = (typeof ELEMENTS)[number];

export const GENE_RANKS = ["F", "E", "D", "C", "B", "A", "S", "SS"] as const;
export type GeneRank = (typeof GENE_RANKS)[number];

export const GENE_KEYS = [
  "HP",
  "ATK",
  "DEF",
  "MAG",
  "RES",
  "SPD",
  "CRIT",
  "CRIT_DAMAGE",
  "PRECISION",
  "EVASION",
  "STATUS",
] as const;
export type GeneKey = (typeof GENE_KEYS)[number];

export const BODY_PLANS = [
  "QUADRUPED",
  "BIPED",
  "SERPENT_WYRM",
  "FLOATING",
  "HUMANOID_BEAST",
  "AVIAN",
  "ARACHNID",
  "GOLEM",
  "AMPHIBIAN",
  "ABYSSAL",
  "CENTAUROID",
  "INSECTOID_BIPED",
] as const;
export type BodyPlan = (typeof BODY_PLANS)[number];

export const HEAD_TYPES = ["DRACONIC", "BEAST", "SERPENT", "EXOTIC"] as const;
export type HeadType = (typeof HEAD_TYPES)[number];

export const LIFE_STAGES = ["EGG", "BABY", "YOUNG", "ADULT"] as const;
export type LifeStage = (typeof LIFE_STAGES)[number];

/** Formação clássica Alpha (replay V1). */
export const CLASSIC_FORMATION_SLOTS = ["FRONT", "BACK_LEFT", "BACK_RIGHT"] as const;
export type ClassicFormationSlot = (typeof CLASSIC_FORMATION_SLOTS)[number];

/** Formação canônica do combate competitivo V2. Substitui BACK_LEFT / BACK_RIGHT. */
export const LINEAR_FORMATION_SLOTS = ["FRONT", "MIDDLE", "BACK"] as const;
export type LinearFormationSlot = (typeof LINEAR_FORMATION_SLOTS)[number];

export const FORMATION_SLOTS = LINEAR_FORMATION_SLOTS;
export const ALL_FORMATION_SLOTS = ["FRONT", "MIDDLE", "BACK", "BACK_LEFT", "BACK_RIGHT"] as const;
export type FormationSlot = (typeof ALL_FORMATION_SLOTS)[number];

export const BATTLE_RULES_VERSIONS = ["V1", "V2"] as const;
export type BattleRulesVersion = (typeof BATTLE_RULES_VERSIONS)[number];

export const BATTLE_DRAFT_PHASES = [
  "ROSTER_LOCK",
  "BAN_PHASE",
  "PICK_PHASE",
  "FORMATION_PHASE",
  "READY",
  "ACTIVE",
  "FINISHED",
] as const;
export type BattleDraftPhase = (typeof BATTLE_DRAFT_PHASES)[number];

/** Alcance espacial da carta. Mapeia para TargetRule no motor. */
export const CARD_RANGES = ["SHORT", "MEDIUM", "LONG", "AOE"] as const;
export type CardRange = (typeof CARD_RANGES)[number];

export const INTERVENTION_TRIGGERS = ["NONE", "ON_ENEMY_RESOLVE", "ON_STACK"] as const;
export type InterventionTrigger = (typeof INTERVENTION_TRIGGERS)[number];

export const COMBAT_STATUS_KEYS = [
  "BURN",
  "BLEED",
  "POISON",
  "STUN",
  "SHIELD",
  "MOLTEN",
] as const;
export type CombatStatusKey = (typeof COMBAT_STATUS_KEYS)[number];

export const TARGET_RULES = [
  "FRONT_ONLY",
  "ANY_TARGETABLE",
  "MIDDLE_ALLOWED",
  "BACKLINE",
  "PIERCE_FRONT",
  "AOE_ALL",
  "AOE_ADJACENT",
  "SELF",
  "ALLY",
  "ALL_ALLIES",
  "RANDOM_VALID",
] as const;
export type TargetRule = (typeof TARGET_RULES)[number];

export const EVOLUTION_STATUSES = ["NONE", "READY_TO_EVOLVE", "EVOLVING"] as const;
export type EvolutionStatus = (typeof EVOLUTION_STATUSES)[number];

export const BATTLE_VISUAL_EVENTS = [
  "CARD_PLAYED",
  "DAMAGE",
  "HEAL",
  "SHIELD",
  "STATUS_APPLIED",
  "STATUS_REMOVED",
  "CREATURE_KO",
  "CREATURE_MOVED",
  "SYNERGY_TRIGGERED",
  "ULTIMATE_TRIGGERED",
  "ROSTER_LOCKED",
  "CREATURE_BANNED",
  "ACTIVE_TEAM_SELECTED",
  "FORMATION_SET",
  "MIDDLE_WINDOW_CHANGED",
  "FORMATION_COLLAPSED",
  "DECK_RECYCLED",
  "RESONANCE_GAINED",
  "FUSION_AVAILABLE",
  "FUSION_PLAYED",
  "CONVERGENCE_AVAILABLE",
  "CONVERGENCE_PLAYED",
  "RESOURCE_GAIN",
  "RESOURCE_SPEND",
  "RESOURCE_MAX",
  "RESOURCE_THRESHOLD",
  "GENETIC_CHAIN",
  "TEAM_RESONANCE",
  "REACTION_ARMED",
  "REACTION_RESOLVED",
  "REACTION_EXPIRED",
  "BATTLE_PRESSURE",
  "SUPREME_READY",
  "ACTION_QUEUED",
  "ACTION_CANCELLED",
] as const;
export type BattleVisualEventType = (typeof BATTLE_VISUAL_EVENTS)[number];

export const TEMPERAMENTS = ["FRIENDLY", "NOBLE", "WILD", "FERAL", "MENACING", "ABYSSAL"] as const;
export type Temperament = (typeof TEMPERAMENTS)[number];

export const EYE_TYPES = ["PREDATOR", "ARCANE", "VOID", "CRYSTAL", "GENESIS"] as const;
export type EyeType = (typeof EYE_TYPES)[number];

export const HORN_TYPES = ["NONE", "DRACONIC", "PREDATOR", "CURVED_RAM", "CROWN", "CRYSTAL_GENESIS"] as const;
export type HornType = (typeof HORN_TYPES)[number];

export const FRONT_LIMB_TYPES = ["CLAWED", "HEAVY_GUARDIAN", "RAPTOR_AGILE", "MANTIS_BLADE"] as const;
export type FrontLimbType = (typeof FRONT_LIMB_TYPES)[number];

export const REAR_LIMB_TYPES = ["BALANCED", "RAPTOR_SPRINTER", "HEAVY_COLOSSAL", "LEAPER_EXOTIC"] as const;
export type RearLimbType = (typeof REAR_LIMB_TYPES)[number];

export const TAIL_TYPES = ["NONE", "PREDATOR", "HEAVY_CLUB", "BLADE", "SERPENT_TENTACLE", "GENESIS_SPLIT"] as const;
export type TailType = (typeof TAIL_TYPES)[number];

export const BACK_TRAITS = ["NONE", "DORSAL_SPINES", "DRACONIC_WINGS", "FEATHERED_WINGS", "SHELL_CARAPACE"] as const;
export type BackTrait = (typeof BACK_TRAITS)[number];

export const PATTERN_TYPES = ["NONE", "STRIPES", "SPOTS", "RUNES", "CRACKS", "ENERGY_VEINS", "GENESIS"] as const;
export type PatternType = (typeof PATTERN_TYPES)[number];

export const AURA_TYPES = ["NONE", "EMBER_FIRE", "ELECTRIC_PLASMA", "VOID_ARCANE", "GENESIS"] as const;
export type AuraType = (typeof AURA_TYPES)[number];

export const MATERIAL_TYPES = [
  "SOFT_SKIN",
  "FUR",
  "SCALES",
  "CHITIN",
  "STONE",
  "CRYSTAL",
  "PLANT",
  "ETHEREAL",
] as const;
export type MaterialType = (typeof MATERIAL_TYPES)[number];

export const SKIN_TYPES = ["SMOOTH", "PLATED", "RIDGED", "TRANSLUCENT"] as const;
export type SkinType = (typeof SKIN_TYPES)[number];

export const MUTATION_TYPES = ["NONE", "PLASMA", "MAGMA", "VOID", "ANCIENT"] as const;
export type MutationType = (typeof MUTATION_TYPES)[number];

export const MUTATION_INTENSITIES = ["LOW", "MEDIUM", "HIGH"] as const;
export type MutationIntensity = (typeof MUTATION_INTENSITIES)[number];

export const SIZE_GENES = ["SMALL", "MEDIUM", "LARGE"] as const;
export type SizeGene = (typeof SIZE_GENES)[number];

export const VISUAL_ASSET_STATUSES = [
  "PENDING",
  "GENERATING",
  "VALIDATING",
  "READY",
  "FAILED",
  "FAILED_REVIEW",
] as const;
export type VisualAssetStatus = (typeof VISUAL_ASSET_STATUSES)[number];

export const VISUAL_IMAGE_PROVIDERS = ["MOCK", "OPENAI"] as const;
export type VisualImageProvider = (typeof VISUAL_IMAGE_PROVIDERS)[number];

export const MODEL_ASSET_STATUSES = ["PENDING", "PREPARING", "READY", "FAILED"] as const;
export type ModelAssetStatus = (typeof MODEL_ASSET_STATUSES)[number];

export const TURNAROUND_VIEWS = ["THREE_QUARTER", "FRONT", "SIDE", "BACK"] as const;
export type TurnaroundView = (typeof TURNAROUND_VIEWS)[number];

export const CREATURE_REVEAL_STATUSES = [
  "NOT_REQUIRED",
  "PENDING_VISUAL",
  "READY_TO_REVEAL",
  "REVEALED",
] as const;
export type CreatureRevealStatus = (typeof CREATURE_REVEAL_STATUSES)[number];

export const CREATURE_ORIGINS = ["STARTER", "WILD", "BRED"] as const;
export type CreatureOrigin = (typeof CREATURE_ORIGINS)[number];

export const CARD_EFFECT_OPS = [
  "DAMAGE",
  "HEAL",
  "SHIELD",
  "APPLY_STATUS",
  "REMOVE_STATUS",
  "DRAW",
  "GAIN_ENERGY",
  "GAIN_MOMENTUM",
] as const;
export type CardEffectOp = (typeof CARD_EFFECT_OPS)[number];

export const CARD_TARGET_TYPES = ["SELF", "ALLY", "ENEMY", "ALL_ENEMIES", "ALL_ALLIES"] as const;
export type CardTargetType = (typeof CARD_TARGET_TYPES)[number];

export const BATTLE_ACTIONS = [
  "SUBMIT_ROSTER",
  "BAN_CREATURE",
  "SELECT_ACTIVE_CREATURES",
  "SET_FORMATION",
  "PLAY_CARD",
  "QUEUE_CARD",
  "UNQUEUE_CARD",
  "REORDER_QUEUE",
  "RETARGET_QUEUE",
  "CONFIRM_TURN",
  "ARM_REACTION",
  "RESONANCE_ACTION",
  "END_TURN",
  "FLEE",
  "CONCEDE",
  "CAPTURE",
  "SELECT_FUSION",
  "PLAY_FUSION",
  "PLAY_CONVERGENCE",
  "TIMEOUT",
] as const;
export type BattleActionType = (typeof BATTLE_ACTIONS)[number];

export const ALPHA_MUTATION_KEYS = ["PLASMA", "MAGMA", "ANCIENT", "VOID"] as const;
export type AlphaMutationKey = (typeof ALPHA_MUTATION_KEYS)[number];

export const GENDERS = ["MALE", "FEMALE"] as const;
export type Gender = (typeof GENDERS)[number];

export const CURRENCIES = ["GOLD", "NEX"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const TRANSACTION_TYPES = ["CREDIT", "DEBIT"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const ITEM_RARITIES = [
  "COMMON",
  "UNCOMMON",
  "RARE",
  "EPIC",
  "LEGENDARY",
  "ANCIENT",
  "MYTHIC",
] as const;
export type ItemRarity = (typeof ITEM_RARITIES)[number];

export const INVENTORY_CATEGORIES = [
  "EQUIPMENT",
  "MATERIALS",
  "CONSUMABLES",
  "QUEST",
  "BREEDING",
  "EGGS",
  "COSMETICS",
] as const;
export type InventoryCategory = (typeof INVENTORY_CATEGORIES)[number];

export const CHARACTER_EQUIP_SLOTS = [
  "WEAPON",
  "HELMET",
  "ARMOR",
  "GLOVES",
  "BOOTS",
  "RING",
  "AMULET",
  "RELIC",
] as const;
export type CharacterEquipSlot = (typeof CHARACTER_EQUIP_SLOTS)[number];

export const CREATURE_EQUIP_SLOTS = ["RUNE", "ARTIFACT", "CHARM"] as const;
export type CreatureEquipSlot = (typeof CREATURE_EQUIP_SLOTS)[number];

export const TRAIT_SLOTS = ["DOMINANT", "RECESSIVE"] as const;
export type TraitSlot = (typeof TRAIT_SLOTS)[number];

export const ASSET_LOCKS = ["NONE", "MARKET", "BATTLE", "BREEDING"] as const;
export type AssetLock = (typeof ASSET_LOCKS)[number];

export const SKILL_TYPES = [
  "PHYSICAL",
  "MAGIC",
  "SUPPORT",
  "HEAL",
  "BUFF",
  "DEBUFF",
  "CONTROL",
  "SHIELD",
  "DOT",
  "AOE",
] as const;
export type SkillType = (typeof SKILL_TYPES)[number];

export const STATUS_EFFECTS = [
  "BURN",
  "POISON",
  "FREEZE",
  "SHOCK",
  "SLEEP",
  "BLEED",
  "SILENCE",
  "BLIND",
  "STUN",
  "FEAR",
] as const;
export type StatusEffect = (typeof STATUS_EFFECTS)[number];

export const STARTER_SPECIES = ["pyron", "nympha", "florune"] as const;
export type StarterSpecies = (typeof STARTER_SPECIES)[number];

export const PVP_RANKS = [
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "DIAMOND",
  "MASTER",
  "GRANDMASTER",
  "LEGEND",
] as const;
export type PvpRank = (typeof PVP_RANKS)[number];

export const PROFESSIONS = [
  "GENETICIST",
  "BLACKSMITH",
  "ALCHEMIST",
  "COOK",
  "ENCHANTER",
  "MINER",
  "EXPLORER",
  "BREEDER",
] as const;
export type Profession = (typeof PROFESSIONS)[number];

export const GENETIC_CARD_LOCI = [
  { key: "G1", role: "BASIC_ATTACK" },
  { key: "G2", role: "SECONDARY_ATTACK" },
  { key: "G3", role: "ELEMENTAL" },
  { key: "G4", role: "DEFENSE" },
  { key: "G5", role: "UTILITY" },
  { key: "G6", role: "CONTROL" },
  { key: "G7", role: "REACTION" },
  { key: "G8", role: "SYNERGY" },
  { key: "G9", role: "SIGNATURE" },
  { key: "G10", role: "ULTIMATE" },
] as const;

/** Papel do locus como manifestação do GeneticPower (ADR 0021). */
export const POWER_LOCUS_ROLES = [
  { key: "G1", role: "CORE_ATTACK" },
  { key: "G2", role: "SECONDARY_APPLICATION" },
  { key: "G3", role: "ELEMENTAL_EXPRESSION" },
  { key: "G4", role: "DEFENSIVE_EXPRESSION" },
  { key: "G5", role: "UTILITY" },
  { key: "G6", role: "CONTROL_PRESSURE" },
  { key: "G7", role: "REACTION" },
  { key: "G8", role: "SYNERGY_ENABLER" },
  { key: "G9", role: "SIGNATURE" },
  { key: "G10", role: "ULTIMATE" },
] as const;

export const TYPOLOGIES = [
  "AGGRO",
  "CONTROL",
  "TANK",
  "SUSTAIN",
  "BURN",
  "POISON",
  "BLEED",
  "CRITICAL",
  "SPEED",
  "SHIELD",
  "COMBO",
  "COUNTER",
  "SUMMON",
  "HEAL",
  "BURST",
] as const;
export type Typology = (typeof TYPOLOGIES)[number];

export const GENETIC_POWER_ORIGINS = [
  "GENESIS",
  "INHERITED_FATHER",
  "INHERITED_MOTHER",
  "MUTATED_NEW",
] as const;
export type GeneticPowerOrigin = (typeof GENETIC_POWER_ORIGINS)[number];
export type GeneticCardLocusKey = (typeof GENETIC_CARD_LOCI)[number]["key"];
export type GeneticCardLocusRole = (typeof GENETIC_CARD_LOCI)[number]["role"];

export const GENESIS_GRADES = ["COMMON", "REFINED", "RARE", "EXCEPTIONAL", "GENESIS"] as const;
export type GenesisGrade = (typeof GENESIS_GRADES)[number];

export const CROSS_POTENTIAL_BANDS = ["LOW", "GOOD", "HIGH", "EXCELLENT", "UNSTABLE", "UNKNOWN"] as const;
export type CrossPotentialBand = (typeof CROSS_POTENTIAL_BANDS)[number];

export const EGG_SHELL_SHAPES = ["OVOID", "PLATED", "ORGANIC", "CRYSTALLINE", "RIDGED"] as const;
export type EggShellShape = (typeof EGG_SHELL_SHAPES)[number];

export const EGG_SURFACE_PATTERNS = ["SMOOTH", "VEINS", "PLATES", "MOSS", "CRACKLE", "MARBLE"] as const;
export type EggSurfacePattern = (typeof EGG_SURFACE_PATTERNS)[number];

export const EGG_SIZE_CLASSES = ["SMALL", "MEDIUM", "LARGE"] as const;
export type EggSizeClass = (typeof EGG_SIZE_CLASSES)[number];

export const POWER_INHERITANCE_HINTS = ["PARENT_A", "PARENT_B", "NEW"] as const;
export type PowerInheritanceHint = (typeof POWER_INHERITANCE_HINTS)[number];

/** Expressão de um alelo. Sem fórmula nesta entrega — só o modelo. */
export type GeneticCardExpression = {
  cardFamily: string;
  variant: string;
  element: string;
  powerExpression: string;
  energyExpression: string;
  speedExpression: string;
  statusExpression: string;
  targetExpression: string;
  modifierGenes: readonly string[];
  mutationState: string;
};

export type GeneticCardLocusAlleles = {
  expressed: GeneticCardExpression;
  recessive: GeneticCardExpression;
};

export const WORLD_MAP_KEYS = ["haven", "verdantis"] as const;
export type WorldMapKey = (typeof WORLD_MAP_KEYS)[number];

export const WORLD_MESSAGES = {
  MOVE_INPUT: "MOVE_INPUT",
  INTERACT: "INTERACT",
  ENTER_MAP: "ENTER_MAP",
  NPC_DIALOGUE: "NPC_DIALOGUE",
  MAP_TRANSFER: "MAP_TRANSFER",
  WILD_ENCOUNTER: "WILD_ENCOUNTER",
} as const;

export type WildEncounterMessage = {
  offerId: string;
  speciesKey: string;
  speciesName: string;
  level: number;
  expiresAt: string;
  family?: string;
  spawnKey?: string;
  cinematic?: boolean;
};

export type PlayCardMessage = {
  cardInstanceId: string;
  targetId?: string;
};

export type CaptureMessage = {
  orbKey: string;
};

export type MoveInputMessage = {
  sequence: number;
  directionX: number;
  directionY: number;
};

export type InteractMessage = {
  npcKey?: string;
  spawnKey?: string;
};

export type EnterMapMessage = {
  targetMap: WorldMapKey;
};

export type NpcDialogueMessage = {
  npcKey: string;
  name: string;
  text: string;
};

export type MapTransferMessage = {
  mapKey: WorldMapKey;
  x: number;
  y: number;
};
