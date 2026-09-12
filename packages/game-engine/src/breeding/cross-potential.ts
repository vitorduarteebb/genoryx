import type { CrossPotentialBand, Element, Typology } from "@nexora/types";
import type { CreatureBlueprint } from "../genes/generate";

export type CrossPotentialCategory = {
  key: "compatibility" | "diversity" | "lineage" | "resonance" | "mutation";
  label: string;
  band: CrossPotentialBand;
};

export type CrossPotential = {
  score: number;
  categories: CrossPotentialCategory[];
  possibleElements: Element[];
  possibleTypologies: Typology[];
  powerInheritance: { parentA: number; parentB: number; novel: number };
  closeLineage: boolean;
};

export type ParentPotentialInput = {
  speciesKey: string;
  elementPrimary: Element;
  elementSecondary?: Element | null;
  generation: number;
  fertility: number;
  bodyPlan: string;
  head: string;
  typology?: Typology | string | null;
  mutationKey?: string | null;
  fatherId?: string | null;
  motherId?: string | null;
  tags?: readonly string[];
};

const TYPOLOGY_SET = new Set<string>([
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
]);

export function typologyFromTags(tags: readonly string[] | undefined): Typology | null {
  const found = (tags ?? []).find((tag) => TYPOLOGY_SET.has(tag));
  return (found as Typology | undefined) ?? null;
}

function uniqueElements(parentA: ParentPotentialInput, parentB: ParentPotentialInput): Element[] {
  const set = new Set<Element>([parentA.elementPrimary, parentB.elementPrimary]);
  if (parentA.elementSecondary) {
    set.add(parentA.elementSecondary);
  }
  if (parentB.elementSecondary) {
    set.add(parentB.elementSecondary);
  }
  return [...set];
}

function uniqueTypologies(parentA: ParentPotentialInput, parentB: ParentPotentialInput): Typology[] {
  const set = new Set<Typology>();
  const a = parentA.typology ?? typologyFromTags(parentA.tags);
  const b = parentB.typology ?? typologyFromTags(parentB.tags);
  if (a && TYPOLOGY_SET.has(a)) {
    set.add(a as Typology);
  }
  if (b && TYPOLOGY_SET.has(b)) {
    set.add(b as Typology);
  }
  return [...set];
}

function bandFromScore(score: number, unstable?: boolean): CrossPotentialBand {
  if (unstable) {
    return "UNSTABLE";
  }
  if (score >= 80) {
    return "EXCELLENT";
  }
  if (score >= 65) {
    return "HIGH";
  }
  if (score >= 45) {
    return "GOOD";
  }
  return "LOW";
}

export function isCloseLineage(parentA: ParentPotentialInput, parentB: ParentPotentialInput): boolean {
  const a = [parentA.fatherId, parentA.motherId].filter(Boolean);
  const b = [parentB.fatherId, parentB.motherId].filter(Boolean);
  if (a.length === 0 || b.length === 0) {
    return false;
  }
  return a.some((id) => b.includes(id));
}

export function parentPotentialFromBlueprint(
  row: CreatureBlueprint,
  extras?: { typology?: Typology | string | null },
): ParentPotentialInput {
  return {
    speciesKey: row.speciesKey,
    elementPrimary: row.elementPrimary,
    elementSecondary: row.elementSecondary,
    generation: row.generation,
    fertility: row.fertility,
    bodyPlan: row.bodyPlanExpressed,
    head: row.headExpressed,
    typology: extras?.typology ?? typologyFromTags(row.tags),
    mutationKey: row.mutationKey,
    fatherId: row.fatherId,
    motherId: row.motherId,
    tags: row.tags,
  };
}

export function calculateCrossPotential(parentA: ParentPotentialInput, parentB: ParentPotentialInput): CrossPotential {
  const sameSpecies = parentA.speciesKey === parentB.speciesKey;
  const sameElement = parentA.elementPrimary === parentB.elementPrimary;
  const sameBody = parentA.bodyPlan === parentB.bodyPlan;
  const sameHead = parentA.head === parentB.head;
  const typologyA = parentA.typology ?? typologyFromTags(parentA.tags);
  const typologyB = parentB.typology ?? typologyFromTags(parentB.tags);
  const sameTypology = Boolean(typologyA && typologyB && typologyA === typologyB);
  const genGap = Math.abs(parentA.generation - parentB.generation);
  const fertilityFloor = Math.min(parentA.fertility, parentB.fertility);
  const close = isCloseLineage(parentA, parentB);

  const compatibilityRaw = (sameSpecies ? 28 : 16) + (sameElement ? 12 : 8) + fertilityFloor * 4;
  const diversityRaw =
    (sameSpecies ? 8 : 24) + (sameElement ? 6 : 18) + (sameBody ? 4 : 14) + (sameHead ? 4 : 10) + (sameTypology ? 4 : 16);
  const lineageRaw = Math.min(36, 16 + genGap * 8 + (sameSpecies ? 0 : 10)) - (close ? 12 : 0);
  const resonanceRaw = sameTypology && sameElement ? 22 : sameTypology || sameElement ? 48 : 72;
  const resonanceUnstable = !sameTypology && !sameElement;

  const compatibility = Math.max(0, Math.min(100, compatibilityRaw));
  const diversity = Math.max(0, Math.min(100, diversityRaw));
  const lineage = Math.max(0, Math.min(100, lineageRaw));
  const resonance = Math.max(0, Math.min(100, resonanceRaw));
  const score = Math.round((compatibility * 0.28 + diversity * 0.32 + lineage * 0.2 + resonance * 0.2));

  return {
    score: Math.max(0, Math.min(100, score)),
    categories: [
      { key: "compatibility", label: "Compatibility", band: bandFromScore(compatibility) },
      { key: "diversity", label: "Genetic Diversity", band: bandFromScore(diversity) },
      { key: "lineage", label: "Lineage Distance", band: bandFromScore(lineage) },
      {
        key: "resonance",
        label: "Power Resonance",
        band: bandFromScore(resonance, resonanceUnstable),
      },
      { key: "mutation", label: "Mutation Potential", band: "UNKNOWN" },
    ],
    possibleElements: uniqueElements(parentA, parentB),
    possibleTypologies: uniqueTypologies(parentA, parentB),
    powerInheritance: { parentA: 1, parentB: 1, novel: 1 },
    closeLineage: close,
  };
}

export function crossPotentialHasNoChild(result: CrossPotential): boolean {
  const blob = JSON.stringify(result);
  return (
    !blob.includes("bodyPlanExpressed") &&
    !blob.includes("geneticHash") &&
    !blob.includes("loci") &&
    !blob.includes("recessive") &&
    !blob.includes("mutationKey") &&
    !/"G[1-9]"/.test(blob)
  );
}
