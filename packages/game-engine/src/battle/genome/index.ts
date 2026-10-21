export { rankIndex, rankOf, precisionPoints } from "./ranks";
export { hydrateGenomeProfile, type GenomeProfile } from "./profile";
export {
  advanceInitiative,
  cardSpeedBonus,
  conditionMet,
  delayInitiative,
  hitChance,
  initiativeOf,
  resolveStrike,
  scaledStatus,
  statusScale,
  type StrikeResult,
} from "./resolve";
export { detectCombatArchetype, type DetectedBuild } from "./archetype";
export { anatomicalAffordances, personalityLean, type AnatomyParts } from "./affordances";
export { analyzeCardSynergy, orderTimeline, type SynergyNote, type TimelineMark } from "./synergy";
export { simulateGenomeMatchups, type GenomeSimReport } from "./simulate";
