export { createSeededRandom, type RandomService } from "./random/random-service";
export { calculateElementMultiplier } from "./elements/element-multiplier";
export {
  applyMoveIntent,
  clampToBounds,
  distance,
  facingFromInput,
  findPortal,
  isInsideRect,
  normalizeInput,
  resolveColliders,
} from "./world/movement";
export { geneticHash, seedFromParts } from "./genes/hash";
export {
  breedChassisDna,
  chassisSignature,
  expressed as chassisExpressed,
  growthFromLifeStage,
  parseChassisDna,
  rollChassisDna,
  rollChassisWith,
  withUniqueChassis,
  type ChassisAllele,
  type ChassisDna,
} from "./chassis/dna";
export {
  blueprintFromParents,
  expressionFromCard,
  generateCreatureBlueprint,
  rollGene,
  type CreatureBlueprint,
  type LocusBlueprint,
} from "./genes/generate";
export { deriveCombatStats, type SpeciesBases } from "./stats/derive";
export { collectCardPool, collectCardContributions, collectCreatureManifestations, buildBattleDeck, dealOpeningHand } from "./cards/deck";
export { combatLineOf, exposedLine, type CombatLine } from "./battle/formation-line";
export { explainTargets, listFormationTargets, cardTargetRule } from "./battle/targeting-resolve";
export { resolveSynergies } from "./synergy/resolve";
export { createBattleState, livingCreatures, type FighterInput } from "./battle/create";
export { battleFusionEnabled, pickAiAction, reduceBattle } from "./battle/reduce";
export {
  PIPELINE_STEPS,
  casualHints,
  casualSummary,
  draftCreatureSummary,
  evaluateTimeout,
  replayFoundation,
  resolveMatchRules,
  availableEnergy,
  currentPressure,
  type CombatHint,
  type DraftCreatureSummary,
} from "./battle/v15";
export { simulateCombatV15 } from "./battle/v15/simulate";
export { assignFormationSlots, formationSlotFromIndex, linearSlotFromIndex, usesLinearFormation } from "./battle/formation";
export { presentBattleEvents, type BattleVisualEvent } from "./battle/events";
export type { BattleAction, BattleState, BattleSide, BattleFusionState, Combatant, CardInstance, FusionPoolEntry } from "./battle/types";
export { createDraftState, reduceDraft, activeTypologies, type DraftState, type DraftAction, type DraftCreature } from "./battle/matrix/draft";
export { collapseLinearFormation, applyPositionMove } from "./battle/matrix/formation-linear";
export { middleWindowOpen, validTargets, listValidTargets, ruleFromCard, isSlotTargetable } from "./battle/matrix/targeting";
export { canonicalPlayTypology, combatMechanicTags, isFunctionalTypology } from "./battle/matrix/combat-tags";
export { recycleDiscard } from "./battle/matrix/recycle";
export { evaluateMatrixFusion, livingTypologies } from "./battle/matrix/fusion-v2";
export {
  drawWeighted,
  presenceDrawCount,
  refreshDraftWeights,
  typologyDraftWeight,
} from "./battle/matrix/draft-weights";
export {
  interventionSurcharge,
  pushStack,
  resolveStackLifo,
  stackPayCost,
  tryPayStack,
  type PaidStackEntry,
  type StackIntent,
  type Wallet,
} from "./battle/matrix/magic-stack";
export { fusionEnergyCost, fusionPower } from "./battle/matrix/fusion-formula";
export { combatDraftProof, combatMatrixProof } from "./battle/matrix/proof";
export { aiBanTarget, aiFormation, aiLabCatalog, aiPickThree } from "./battle/matrix/lab-ai";
export { resolveValidTargets, listLegalTargets } from "./battle/reduce";
export {
  applyCreatureXp,
  applyMaturationXp,
  calculateCreatureLevel,
  canEvolve,
  evaluateEvolutionStatus,
  meetsEvolutionThresholds,
  xpForNextLevel,
  xpToReachLevel,
  type CreatureProgress,
} from "./progress/creature-progress";
export {
  computeMaturationGrant,
  diversityShare,
  familyFromKey,
  participationScore,
  type MaturationGrantInput,
  type MaturationGrantResult,
  type ParticipationBreakdown,
} from "./progress/maturation";
export { calculateCaptureChance, rollCapture } from "./capture/chance";
export {
  breedingCostGold,
  calculateBreeding,
  eggRarity,
  incubationMs,
  incubationMsForGrade,
  priorBreedsFromFertility,
} from "./breeding/calculate";
export {
  calculateCrossPotential,
  crossPotentialHasNoChild,
  isCloseLineage,
  parentPotentialFromBlueprint,
  typologyFromTags,
  type CrossPotential,
  type ParentPotentialInput,
} from "./breeding/cross-potential";
export {
  complexityIgnoresCombatStats,
  elementHintLabel,
  genesisGradeFromLegacyRarity,
  rarityFromGenesisGrade,
  scoreGenesisComplexity,
  type GenesisComplexity,
  type PowerOriginKind,
} from "./breeding/genesis-complexity";
export {
  deriveEggVisualGenome,
  eggVisualExposesSecrets,
  type EggVisualGenome,
} from "./breeding/egg-visual";
export {
  buildEggImagePrompt,
  eggPromptExposesSecrets,
  eggSpecFromGenome,
  type EggVisualGenerationSpec,
} from "./breeding/egg-prompt";
export { rollWildEncounter, type SpawnRow } from "./encounter/roll";
export { marketFeeGold, marketListingFeeGold } from "./economy/market";
export { clampRewardToBudget, pvpGoldReward, rollPveCatalyst, rollPveGold } from "./economy/rewards";
export {
  assembleVisualGenome,
  deriveVisualSeed,
  type AssembleVisualGenomeInput,
  type CreatureVisualGenome,
  type VisualAllele,
} from "./visual/genome";
export {
  buildCreatureImagePrompt,
  buildTurnaroundPrompt,
  visualSpecFromGenome,
  type BuildPromptOptions,
  type CreatureVisualGenerationSpec,
} from "./visual/prompt";
export {
  composeMotionProfile,
  formatGeneticHash,
  type MotionProfile,
} from "./presentation/motion-profiles";
export { CreaturePresenceController, type PresenceInput, type PresenceSample } from "./presentation/presence";
export { frameCreatureCamera, type CreatureFraming, type FramingInput } from "./presentation/framing";
export {
  ART04_CANONICAL_FORWARD,
  battleActorYaw,
  battleCameraHeight,
  battleDepthPresentation,
  battleGroundOffset,
  detectCanonicalForward,
  frameBattleCamera,
  isLevitatingPlan,
  resolveBattleDepth,
  type BattleDepth,
  type BattleTeamSide,
  type CanonicalCreatureForward,
} from "./presentation/battle-pose";
export {
  normalizeClipName,
  pickNamedClip,
  resolveAnimationCapability,
  type AnimationCapability,
} from "./presentation/animation-capabilities";
export { presentationVfx, type PresentationVfx } from "./presentation/presentation-vfx";
export type {
  BattleIntent,
  BattlePresentationCreature,
  BattlePresentationSide,
  BattlePresentationState,
} from "./presentation/battle-contract";
export {
  backfillGeneticPower,
  generateNewPower,
  type PowerAssignment,
} from "./powers/generate-power";
export { inheritGeneticPower, rollPowerInheritance, seedForInheritanceRoll } from "./powers/inherit";
export { generatePowerCards, type GeneticCardManifestation } from "./powers/cards";
export {
  applyKitToLoci,
  assembleCreatureCardKit,
  isCardKitManifest,
  kitCardType,
  kitSeed,
  kitToDefinition,
  type CardKitDerived,
  type CardKitManifest,
  type CreatureCardKit,
  type ParentKitHint,
} from "./cards/kit";
export { assembleGeneticCombat, type AssembleCombatInput } from "./genetic-combat/assemble";
export { buildPersonalResource, hydratePersonalResource } from "./genetic-combat/resource";
export { applyResourceEvent, generationRuleMatches, requiredResource } from "./genetic-combat/resource-runtime";
export { explainPersonalResource } from "@nexora/config";
export { partySynergyLinks, type SynergyLink } from "./genetic-combat/synergy";
export { collectCombatGallery, type CombatSample, type CombatTeamSample } from "./genetic-combat/sample";
export { simulateCombatPopulation, type CombatSimStats } from "./genetic-combat/simulate";
export { GENETIC_ENGINE_VERSION } from "@nexora/config";
export type { GeneticCombatManifest, CombatIdentity } from "./genetic-combat/types";
export { evaluateFusionAvailability, familyFor, fusionIdentity, type FusionCandidate } from "./powers/fusion";
export { addResonance, emptyResonance, guardTrigger, resonanceForPlay, resonanceForPlayCapped, resetRoundTriggers } from "./powers/resonance";
export { budgetUsed, clampEffectsToBudget, withinBudget } from "./powers/budget";
export { powerHash, powerSignature, powerSimilarity, deterministicUuid } from "./powers/hash";
export { battleFusionProof, breedingPowerProof, creaturePowerProof } from "./powers/proof";
export { presentEffects } from "./powers/present-effects";
export {
  buildCardArtPrompt,
  buildCreatureCardArtPrompt,
  cardArtSpecFromCatalog,
  cardArtSpecFromDirection,
  creatureCardArtDirection,
  type CardArtGenerationSpec,
} from "./card-art/prompt";
