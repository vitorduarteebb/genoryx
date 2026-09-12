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
  };
}
