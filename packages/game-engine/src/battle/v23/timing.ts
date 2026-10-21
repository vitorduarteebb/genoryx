import {
  defaultResolutionProfile,
  locusTimingHint,
  type EffectDomain,
  type InterventionOp,
  type ResolutionProfile,
  type TimingClass,
} from "@nexora/config";
import type { CardInstance, PlayableCard } from "../types";

const PHYSICAL_OPS = new Set(["DAMAGE"]);
const ARCANE_STATUS = new Set(["SLOW", "SILENCE", "WARD", "STUN"]);
const ELEMENTAL_STATUS = new Set(["BURN", "WET", "FROST", "SHOCK", "POISON"]);

export function inferTimingClass(card: PlayableCard | null | undefined, locus?: string | null): TimingClass {
  const tags = card?.tags ?? [];
  // Kits G7/COUNTER viram type REACTION + tag COUNTER. Manter REACTION para
  // abrir PRE_IMPACT (ataques/ações). COUNTER puro fica só com a tag COUNTER.
  if (card?.type === "REACTION") return "REACTION";
  if (tags.includes("REACTION") && !tags.includes("COUNTER")) return "REACTION";
  if (tags.includes("COUNTER") || card?.locusRole === "REACTION") return "COUNTER";
  if (tags.includes("REACTION")) return "REACTION";
  if (tags.includes("CHANNEL") || tags.includes("CHANNELLED")) return "CHANNEL";
  if (tags.includes("PREPARATION") || tags.includes("TRAP")) return "PREPARATION";
  if (tags.includes("RITUAL") || card?.type === "ULTIMATE" || card?.locusRole === "ULTIMATE") return "RITUAL";
  if (tags.includes("IMPETUS") || tags.includes("MOBILITY") || tags.includes("INTERCEPT") || tags.includes("DODGE")) {
    return "IMPETUS";
  }
  if (tags.includes("PASSIVE")) return "PASSIVE";
  if (locus === "G7") return "REACTION";
  if (locus === "G10" && (card?.cost ?? 0) >= 4) return "RITUAL";
  if (locus === "G5" || locus === "G6") {
    if (tags.includes("MOBILITY") || card?.type === "SKILL") return "IMPETUS";
  }
  if (locus === "G3" || locus === "G4") {
    if (tags.includes("SHIELD") || tags.includes("DEFENSE")) return "PREPARATION";
  }
  return locus ? locusTimingHint(locus) : "ACTION";
}

export function inferEffectDomain(card: PlayableCard | null | undefined): EffectDomain {
  const element = card?.element;
  const tags = card?.tags ?? [];
  if (tags.includes("GENETIC") || card?.type === "GENETIC") return "GENETIC";
  if (tags.includes("HYBRID")) return "HYBRID";
  if (element === "ARCANE" || tags.includes("ARCANE")) return "ARCANE";
  if (element === "FIRE" || element === "WATER" || element === "NATURE" || element === "ELECTRIC" || element === "EARTH") {
    return "ELEMENTAL";
  }
  const hasStatus = (card?.effects ?? []).some((row) => row.op === "APPLY_STATUS");
  if (hasStatus && !PHYSICAL_OPS.has("DAMAGE")) return "ELEMENTAL";
  return card?.type === "ATTACK" ? "PHYSICAL" : "ELEMENTAL";
}

export function inferInterventionOp(card: PlayableCard | null | undefined): InterventionOp | undefined {
  const tags = card?.tags ?? [];
  if (tags.includes("INTERCEPT")) return "INTERCEPT";
  if (tags.includes("DODGE")) return "DODGE";
  if (tags.includes("LAST_STAND") || tags.includes("SAVE")) return "LAST_STAND";
  if (tags.includes("SUPPRESS") || tags.includes("CLEANSE")) return "SUPPRESS";
  if (tags.includes("MITIGATE") || tags.includes("GUARD") || tags.includes("SHIELD")) return "MITIGATE";
  if (tags.includes("REDIRECT")) return "REDIRECT";
  if (tags.includes("AMPLIFY")) return "AMPLIFY";
  if (tags.includes("TRANSFORM")) return "TRANSFORM";
  if (tags.includes("ECHO") || tags.includes("COPY")) return "ECHO";
  if (tags.includes("DELAY")) return "DELAY";
  if (tags.includes("SEAL")) return "SEAL";
  if (tags.includes("COUNTER") || card?.type === "REACTION") return "CANCEL";
  return undefined;
}

export function hydrateResolutionProfile(
  card: PlayableCard | null | undefined,
  locus?: string | null,
): ResolutionProfile {
  const timing = inferTimingClass(card, locus);
  const domain = inferEffectDomain(card);
  const op = inferInterventionOp(card);
  const tags = card?.tags ?? [];
  const extras: Partial<ResolutionProfile> = {
    effectDomain: domain,
    interventionOp: op,
    manaCost: timing === "ACTION" || timing === "PREPARATION" || timing === "PASSIVE" || timing === "RITUAL" || timing === "CHANNEL" ? 0 : 1,
    stackable: timing === "RITUAL" || timing === "IMPETUS" || timing === "REACTION" || timing === "COUNTER",
    opensStack: timing === "RITUAL" || timing === "CHANNEL" || tags.includes("STACKABLE"),
    universalCounter: tags.includes("COUNTER_ANY"),
    counterDomains: tags.includes("COUNTER_ANY")
      ? ["PHYSICAL", "ELEMENTAL", "ARCANE", "GENETIC", "HYBRID"]
      : timing === "COUNTER"
        ? ["PHYSICAL", "ELEMENTAL", "ARCANE", "GENETIC", "HYBRID"]
        : ["ARCANE", "ELEMENTAL", "GENETIC", "HYBRID"],
  };
  if (timing === "REACTION" && tags.includes("LAST_STAND")) {
    extras.responseWindows = ["LETHAL"];
    extras.interventionOp = "LAST_STAND";
  } else if (timing === "REACTION") {
    extras.responseWindows = ["DECLARE", "PRE_IMPACT", "POST_IMPACT", "STATUS"];
  }
  return defaultResolutionProfile(timing, extras);
}

export function playableWithTiming(card: PlayableCard, locus?: string | null): PlayableCard {
  return card;
}

export function cardLocusOf(instance: CardInstance, card?: PlayableCard | null): string | undefined {
  return instance.locus ?? card?.locusRole ?? undefined;
}

export function canAnswerSpeed(responder: ResolutionProfile, target: ResolutionProfile): boolean {
  if (target.stackSpeed === "NORMAL") return true;
  return responder.stackSpeed === "FAST" || responder.stackSpeed === "COUNTER_FAST" || responder.timingClass === "IMPETUS";
}

export function domainAllowsCounter(counter: ResolutionProfile, targetDomain: EffectDomain): boolean {
  if (counter.universalCounter) return true;
  return counter.counterDomains.includes(targetDomain);
}

export function timingPowerTax(profile: ResolutionProfile): number {
  if (profile.universalCounter) return 14;
  if (profile.timingClass === "IMPETUS") return 6;
  if (profile.timingClass === "COUNTER") return 4;
  if (profile.timingClass === "REACTION") return -3;
  if (profile.timingClass === "RITUAL") return -5;
  if (profile.timingClass === "CHANNEL") return -4;
  if (profile.timingClass === "PREPARATION") return 1;
  return 0;
}

void ELEMENTAL_STATUS;
void ARCANE_STATUS;
