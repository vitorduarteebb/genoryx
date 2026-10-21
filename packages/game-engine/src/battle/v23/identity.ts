import type { TimingClass, TimingStyle } from "@nexora/config";
import { hydrateResolutionProfile, inferTimingClass } from "./timing";
import type { PlayableCard } from "../types";

export function rollTimingStyle(seedMod: number, archetype?: string): TimingStyle {
  const styles: TimingStyle[] = ["AGGRESSIVE", "REACTIVE", "SETUP", "CONTROL"];
  const biased =
    archetype === "PREDATOR" || archetype === "SKIRMISHER"
      ? (["AGGRESSIVE", "AGGRESSIVE", "REACTIVE", "SETUP"] as TimingStyle[])
      : archetype === "TANK"
        ? (["REACTIVE", "CONTROL", "SETUP", "AGGRESSIVE"] as TimingStyle[])
        : archetype === "CONTROL"
          ? (["CONTROL", "SETUP", "REACTIVE", "AGGRESSIVE"] as TimingStyle[])
          : styles;
  return biased[Math.abs(seedMod) % biased.length]!;
}

export function timingWeights(style: TimingStyle): Record<TimingClass, number> {
  if (style === "AGGRESSIVE") return { ACTION: 4, IMPETUS: 3, REACTION: 1, COUNTER: 0, PREPARATION: 1, CHANNEL: 0, RITUAL: 1, PASSIVE: 0 };
  if (style === "REACTIVE") return { ACTION: 2, IMPETUS: 1, REACTION: 3, COUNTER: 2, PREPARATION: 1, CHANNEL: 0, RITUAL: 0, PASSIVE: 1 };
  if (style === "SETUP") return { ACTION: 2, IMPETUS: 0, REACTION: 1, COUNTER: 0, PREPARATION: 3, CHANNEL: 2, RITUAL: 1, PASSIVE: 1 };
  return { ACTION: 1, IMPETUS: 1, REACTION: 1, COUNTER: 2, PREPARATION: 1, CHANNEL: 1, RITUAL: 1, PASSIVE: 0 };
}

export function summarizeTiming(cards: readonly PlayableCard[]): {
  impetus: number;
  counter: number;
  channel: number;
  ritual: number;
  reaction: number;
  style: TimingStyle;
} {
  const counts = { impetus: 0, counter: 0, channel: 0, ritual: 0, reaction: 0 };
  for (const card of cards) {
    const timing = inferTimingClass(card, card.locusRole);
    if (timing === "IMPETUS") counts.impetus += 1;
    if (timing === "COUNTER") counts.counter += 1;
    if (timing === "CHANNEL") counts.channel += 1;
    if (timing === "RITUAL") counts.ritual += 1;
    if (timing === "REACTION") counts.reaction += 1;
  }
  const style: TimingStyle =
    counts.impetus >= 2 ? "AGGRESSIVE" : counts.counter + counts.reaction >= 2 ? "REACTIVE" : counts.channel >= 1 ? "SETUP" : "CONTROL";
  return { ...counts, style };
}

export function timingFingerprintTokens(cards: readonly PlayableCard[]): string[] {
  return cards.flatMap((card) => {
    const profile = hydrateResolutionProfile(card, card.locusRole);
    return [profile.timingClass, profile.stackSpeed, profile.effectDomain, ...profile.responseWindows];
  });
}

void timingWeights;
