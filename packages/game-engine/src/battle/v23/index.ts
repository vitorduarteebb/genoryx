export {
  COMBAT_V23_ENGINE,
  TIMING_LABEL_PT,
  combatV23Config,
  convertEnergyToMana,
  defaultResolutionProfile,
  fusionCatalogV23,
  fusionRecipesV23,
  interventionSurchargeV23,
  locusTimingHint,
} from "@nexora/config";

export { hydrateResolutionProfile, inferTimingClass, inferEffectDomain, canAnswerSpeed, domainAllowsCounter, timingPowerTax } from "./timing";
export { applyArcaneReserve, ensureMana, reservePreview, trySpendMana, resetImpetusRound } from "./mana";
export { graphFromCard, activeNodes, mitigateDamage, suppressStatus, cancelGraph } from "./graph";
export { emptyMagicWar, payStackMana, pushFrame, resolveLifo, nextSurcharge } from "./stack";
export { eligibleResponses, shouldOpenWindow, autoPassSides } from "./windows";
export { applyIntervention, applyLastStand } from "./interventions";
export { armPreparation, startChannel, tickChannels, tickPreparations, activatePreparations } from "./zones";
export { fusionManifestation, geneticPowerManifestation, matchFusionRecipe } from "./virtual";
export {
  announceForStack,
  beginChannelFromCard,
  collapseStack,
  convertReserveOnConfirm,
  ensureV23,
  isMagicWarOpen,
  openFusionWindow,
  passPriority,
  stackRespond,
  tickV23Turn,
  triggerPreparations,
} from "./resolve";
export { rollTimingStyle, summarizeTiming, timingFingerprintTokens } from "./identity";
export { simulateCombatV23 } from "./simulate";
export type { CombatV23Metrics, EffectGraph, MagicWarState, PreparedEffect, StackFrame, VirtualManifestation } from "./types";
