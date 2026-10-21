import { locusTimingHint } from "@nexora/config";
import type { GeneticCombatManifest } from "../../genetic-combat/types";

export type DraftCreatureSummary = {
  creatureId: string;
  name: string;
  combatIdentity: string;
  role: string;
  primaryElement: string;
  secondaryElement: string | null;
  personalResource: string;
  produces: string[];
  consumes: string[];
  keySynergies: string[];
  signatureSummary: string;
  supremeSummary: string;
  timingProfile?: { impetus: number; counter: number; channel: number; reaction: number; ritual: number; style: string };
};

export function draftCreatureSummary(
  creatureId: string,
  name: string,
  element: string,
  secondary: string | null | undefined,
  manifest?: GeneticCombatManifest | null,
): DraftCreatureSummary {
  const identity = manifest?.identity;
  const cards = manifest?.cards ?? [];
  const produces = [...new Set(cards.flatMap((card) => card.ability.produces))];
  const consumes = [...new Set(cards.flatMap((card) => card.ability.consumes))];
  const signature = cards.find((card) => card.locus === "G9" || card.tier === "SIGNATURE");
  const supreme = cards.find((card) => card.locus === "G10" || card.tier === "SUPREME");
  const timing = { impetus: 0, counter: 0, channel: 0, reaction: 0, ritual: 0 };
  for (const card of cards) {
    const cls = card.function === "COUNTER" ? "COUNTER" : card.function === "MOBILITY" ? "IMPETUS" : locusTimingHint(card.locus);
    if (cls === "IMPETUS") timing.impetus += 1;
    if (cls === "COUNTER") timing.counter += 1;
    if (cls === "CHANNEL") timing.channel += 1;
    if (cls === "REACTION") timing.reaction += 1;
    if (cls === "RITUAL") timing.ritual += 1;
  }
  return {
    creatureId,
    name,
    combatIdentity: identity?.namePt ?? "—",
    role: identity?.stylePt ?? identity?.archetype ?? "—",
    primaryElement: element,
    secondaryElement: secondary ?? null,
    personalResource: identity?.resource.displayName ?? identity?.resource.id ?? "—",
    produces: produces.slice(0, 6),
    consumes: consumes.slice(0, 6),
    keySynergies: (identity?.synergyTags ?? []).slice(0, 4),
    signatureSummary: signature?.namePt ?? "—",
    supremeSummary: supreme?.namePt ?? "—",
    timingProfile: {
      ...timing,
      style: timing.impetus >= 2 ? "Aggressive" : timing.counter + timing.reaction >= 2 ? "Reactive" : timing.channel >= 1 ? "Setup" : "Control",
    },
  };
}
