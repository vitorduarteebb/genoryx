export { brandConfig } from "./brand";
export { combatConfig, energyForRound } from "./combat";
export {
  GENOME_ENGINE,
  genomeCardSpeeds,
  genomeConditions,
  genomeDomains,
  genomeHooks,
  genomeV2,
  type GenomeCardSpeed,
  type GenomeCondition,
  type GenomeDomain,
  type GenomeHook,
} from "./combat-genome";
export { combatEngineConfig, rangeToTargetRule } from "./combat-engine";
export { combatMatrixConfig, defaultTargetRule, isCombatMatrixEnabled } from "./combat-matrix";
export {
  COMBAT_V15_ENGINE,
  RANKED_RULESET_VERSION,
  assassinProperties,
  combatV15Config,
  combatV15Flags,
  geneticReactionRegistry,
  matchRulesFor,
  pressureHealMul,
  pressureShieldMul,
  pressureTier,
  statusDefinition,
  statusRegistry,
  tankProperties,
  teamManifestRecipes,
  visibleRankFromMmr,
  type BattlePressureTier,
  type GeneticReactionRule,
  type MatchMode,
  type MatchRules,
  type ResonanceActionId,
  type RetargetPolicy,
  type StatusDefinition,
  type TeamManifestRecipe,
  type VisibleRank,
} from "./combat-v15";
export {
  COMBAT_V23_ENGINE,
  TIMING_CLASSES,
  TIMING_LABEL_PT,
  combatV23Config,
  convertEnergyToMana,
  defaultResolutionProfile,
  fusionCatalogV23,
  fusionRecipesV23,
  interventionSurchargeV23,
  locusTimingHint,
  type EffectDomain,
  type InterventionOp,
  type ResolutionMode,
  type ResolutionProfile,
  type ResponseWindow,
  type StackSpeed,
  type TimingClass,
  type TimingStyle,
} from "./combat-v23";

export { breedingConfig } from "./breeding";
export {
  activeEconomy,
  economyConfig,
  economyFaucetSources,
  economyLedgerSources,
  economyProfileName,
  economyProfiles,
  economySystemEmail,
  genomeCatalystKey,
  type EconomyLedgerSource,
  type EconomyNumbers,
  type EconomyProfileName,
  type EncounterTier,
  type PvpEconomyMode,
} from "./economy";
export { captureConfig } from "./capture";
export { xpConfig } from "./xp";
export {
  creatureLifeStageConfig,
  lifeStageStatMultiplier,
  nextLifeStage,
  usableLociForStage,
} from "./life-stage";
export {
  resolveCanonicalCardArt,
  versionedCardArtUrl,
  type CardArtHint,
  type ResolvedCardArt,
} from "./resolve-card-art";
export {
  battlePresentationConfig,
  speciesBattleVisuals,
} from "./species-battle-visual";
export {
  resolveBattleCreatureVisual,
  type BattleCreatureVisual,
  type BattleRenderMode,
  type BattleVisualHints,
} from "./resolve-battle-visual";
export { authConfig, parseDurationMs } from "./auth";
export { geneticCardConfig, GENETIC_CARD_LOCI } from "./genetic-cards";
export {
  CARD_GEN_VERSION,
  cardKitConfig,
  cardKitSlots,
  clampCardCost,
  type CardKitFunction,
  type CardKitTier,
} from "./card-kit";
export {
  GENETIC_ENGINE_VERSION,
  anatomyVocabulary,
  elementResource,
  elementStatus,
  expressionTraits,
  geneticCombatConfig,
  identityLexicon,
  personalResourceCatalog,
  quirkCatalog,
  reactionRegistry,
  universalStatuses,
  type ExpressionTrait,
  type UniversalStatus,
} from "./genetic-combat";
export {
  PERSONAL_RESOURCE_VERSION,
  explainPersonalResource,
  formatConsumptionRule,
  formatDecay,
  formatGenerationRule,
  resourceChipFromEffect,
  resourcePlayGate,
  resourceVisuals,
  type PersonalResourceDefinition,
  type ResourceConsumptionRule,
  type ResourceDecay,
  type ResourceGenerationRule,
  type ResourceHelpView,
  type ResourceLocale,
  type ResourceScope,
  type ResourceThreshold,
  type ResourceTrigger,
} from "./personal-resource";
export {
  effectBudgetByLocus,
  effectBudgetWeights,
  existingCardsForSpecies,
  fusionFamilies,
  geneticPowerConfig,
  seedGeneticPowers,
  seedPowerForSpecies,
  type FusionFamilyDef,
  type GeneticPowerGenome,
  type PowerMechanic,
  type SeedPower,
} from "./genetic-powers";
export { alphaConfig } from "./alpha";
export { incubationConfig, incubationMinutesForGrade, incubationProfile, type IncubationProfile } from "./incubation";
export { genesisComplexityConfig, genesisGradeFromScore } from "./genesis-complexity";
export {
  eggAiArtEnabled,
  eggMaterialLexicon,
  eggPatternLexicon,
  eggShellLexicon,
  eggVisualGenerationConfig,
} from "./egg-visual";
export { forbiddenShopKeys, shopCatalog } from "./shop";
export { speciesElements, speciesVisuals, type SpeciesVisual } from "./species";
export {
  CHASSIS_BODY_ID,
  CHASSIS_ID,
  CHASSIS_RIG_ID,
  chassisAccentColorIds,
  chassisAuras,
  chassisBacks,
  chassisBodyColorIds,
  chassisCombinationCount,
  chassisCoreAura,
  chassisCoreColor,
  chassisCores,
  chassisEmissiveColorIds,
  chassisEyes,
  chassisHeads,
  chassisHorns,
  chassisLimbs,
  chassisPaletteCss,
  chassisPaletteRgb,
  chassisPatterns,
  chassisTails,
  type ChassisAlleleView,
  type ChassisGrowthStage,
  type ChassisView,
} from "./chassis";
export {
  CATALOG_PART_RELS,
  PART_PUBLIC_BASE,
  assemblePhenotype,
  partSrc,
  phenotypePartRels,
  type CreaturePhenotype,
  type PhenotypeInput,
} from "./phenotype";
export { synergyDefinitions, type SynergyDefinition } from "./synergies";
export {
  cardCatalog,
  cardBelongsToSpecies,
  cardPowerRank,
  cardsForLocus,
  cardsForSpecies,
  getCardDefinition,
  type CardDefinition,
  type CardEffectDef,
} from "./cards";
export {
  cardElementLabel,
  cardLabel,
  cardTypeLabel,
  describeCardEffects,
  describeEffects,
  presentCard,
  presentPlayableCard,
  type CardPresentation,
} from "./card-text";
export {
  buildCardReadout,
  CARD_KEYWORD_HELP,
  inferDomainFromFantasy,
  resourceGateCopy,
  type CardEffectLike,
  type CardFaceLine,
  type CardKeywordKey,
  type CardReadout,
} from "./card-readout";
export { resolveCardFrameSrc, resolveElementPresentation, type ElementPresentation } from "./element-presentation";
export {
  creatureLocusArtDirection,
  geneticCardArtAllowlist,
  geneticCardArtConfig,
  geneticCardArtPolicy,
  isCreatureCardArtAllowed,
  terranoxCreatureArtDirections,
  terranoxProofCardKeys,
  type CardArtScope,
  type GeneticCardArtPolicyMode,
} from "./genetic-card-art";
export {
  CARD_ART_BASE_VARIANT,
  cardArtGenerationConfig,
  cardTypeComposition,
  elementVisualLanguage,
  floruneCardArtDirections,
  floruneProofCardKeys,
  floruneSpeciesReference,
  getCardArtDirection,
  hasApprovedCardArtDirection,
  locusKeyForCard,
  mechanicsFromDefinition,
  type CardArtDirection,
  type CardArtIllustrationType,
} from "./card-art";
export { getWorldMap, worldConfig, worldMaps, type Rect, type WorldMapDefinition, type WorldNpc } from "./world";
export {
  ENCOUNTER_FAMILIES,
  MATURATION_STATES,
  maturationConfig,
  maturationProgress,
  maturationThresholdFor,
  maturationThresholdOf,
  type EncounterFamily,
  type MaturationState,
} from "./maturation";
export {
  presentationConfig,
  isUnityBattle,
  isUnityWorld,
  type BattleRenderer,
  type WorldRenderer,
} from "./presentation";
export {
  verdantisLandmarks,
  verdantisMobSpawns,
  worldRespawnConfig,
  type MobAggro,
  type WorldLandmark,
  type WorldMobSpawnDef,
} from "./world-encounters";
export {
  resolveCreatureGameAsset,
  type CreatureGameAsset,
} from "./resolve-creature-game-asset";
export {
  isRevealHidden,
  resolveCreatureVisual,
  versionedVisualUrl,
  visualProviderOf,
  type ResolvedCreatureVisual,
  type VisualAssetHint,
} from "./resolve-creature-visual";
export {
  characterBackIds,
  characterBeardIds,
  characterBodyTypes,
  characterBootsIds,
  characterCapeIds,
  characterChestIds,
  characterCreatorCategories,
  characterEyeColors,
  characterEyebrowIds,
  characterFaceIds,
  characterGlovesIds,
  characterHairColorRgb,
  characterHairColors,
  characterHairIds,
  characterLegsIds,
  characterSkinToneRgb,
  characterSkinTones,
  characterSlots,
  defaultCharacterAppearance,
  meshyCharacterConfig,
  parseCharacterAppearance,
  phase1UnlockedIds,
  randomCharacterAppearance,
  type CharacterAppearance,
  type CharacterSlot,
} from "./character-appearance";
export {
  paletteForSpecies,
  speciesPalettes,
  meshyGenerationConfig,
  visualGenerationConfig,
  visualTagLexicon,
  type GeneticPalette,
} from "./visual-generation";
export {
  auraLexicon,
  backLexicon,
  bodyPlanLexicon,
  eyeLexicon,
  frontLimbLexicon,
  headLexicon,
  hornLexicon,
  lifeStageLexicon,
  materialLexicon,
  mutationIntensityLexicon,
  mutationLexicon,
  patternLexicon,
  rearLimbLexicon,
  skinLexicon,
  tailLexicon,
  temperamentLexicon,
} from "./visual-lexicon";
export {
  ELEMENT_ADVANTAGE,
  ELEMENT_MULTIPLIER_NEUTRAL,
  ELEMENT_MULTIPLIER_STRONG,
  ELEMENT_MULTIPLIER_WEAK,
} from "./elements";
export {
  havenPalette,
  verdantisPalette,
  worldAssetStatus,
  worldDisplayScale,
  worldGroundAnchor,
  worldLighting,
  worldQualityPresets,
  worldVfxProfiles,
  type WorldArtHex,
  type WorldAssetStatus,
  type WorldQualityPresetId,
} from "./world-art";
export {
  WORLD_ART_PUBLIC_ROOT,
  WORLD_LAYERS,
  npcArchetypeFromRole,
  npcAssetId,
  worldAssetById,
  worldAssetCatalog,
  worldAssetForProp,
  worldAssetsForArea,
  worldPlate,
  type NpcArchetype,
  type WorldAssetArea,
  type WorldAssetDef,
  type WorldAssetKind,
  type WorldLayer,
} from "./world-assets";
export { captureZones, getCaptureZone, type CaptureZone, type CaptureZoneId } from "./capture-zones";
