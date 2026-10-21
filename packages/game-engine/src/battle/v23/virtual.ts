import {
  defaultResolutionProfile,
  fusionCatalogV23,
  type FusionFamilyDef,
  type ResolutionProfile,
} from "@nexora/config";
import type { PlayableCard } from "../types";
import { graphFromCard } from "./graph";
import type { EffectGraph, VirtualManifestation } from "./types";

export function fusionManifestation(family: FusionFamilyDef, tokens: string[] = []): VirtualManifestation {
  const profile: ResolutionProfile = defaultResolutionProfile("RITUAL", {
    effectDomain: "GENETIC",
    opensStack: true,
    stackable: true,
    interruptible: true,
    manaCost: 0,
  });
  const card: PlayableCard = {
    key: family.key,
    name: family.namePt,
    type: "GENETIC",
    cost: 0,
    element: "ARCANE",
    targetType: "ALL_ENEMIES",
    tags: ["FUSION", "RITUAL", "INTERRUPTIBLE"],
    effects: family.effects.map((row) => ({
      op: row.op,
      value: row.value,
      status: row.status,
      duration: row.duration,
    })),
  };
  const graph: EffectGraph = graphFromCard(card, "GENETIC");
  return {
    id: `fusion-${family.key}`,
    kind: "FUSION",
    namePt: family.namePt,
    recipeId: family.key,
    profile,
    graph,
    stackBehavior: "INTERRUPTIBLE",
    tokens,
  };
}

export function matchFusionRecipe(tokens: string[]): FusionFamilyDef | null {
  const catalog = fusionCatalogV23();
  const upper = tokens.map((row) => row.toUpperCase());
  const magma = upper.includes("BURN") && (upper.includes("EARTH") || upper.includes("CRACKED"));
  if (magma) {
    return catalog.find((row) => row.key === "MAGMA_CORE") ?? catalog[0] ?? null;
  }
  return (
    catalog.find((row) => row.typologies.every((typo) => upper.includes(typo))) ??
    catalog.find((row) => row.typologies.some((typo) => upper.includes(typo))) ??
    null
  );
}

export function geneticPowerManifestation(input: {
  key: string;
  namePt: string;
  timingClass?: "PASSIVE" | "ACTION" | "REACTION" | "IMPETUS";
  effects?: PlayableCard["effects"];
}): VirtualManifestation {
  const timing = input.timingClass ?? "PASSIVE";
  const profile = defaultResolutionProfile(timing, { effectDomain: "GENETIC", manaCost: timing === "PASSIVE" ? 0 : 1 });
  const card: PlayableCard = {
    key: input.key,
    name: input.namePt,
    type: "GENETIC",
    cost: 0,
    element: "ARCANE",
    targetType: "ENEMY",
    tags: ["GENETIC_POWER", timing],
    effects: input.effects ?? [],
  };
  return {
    id: `gp-${input.key}`,
    kind: "GENETIC_POWER",
    namePt: input.namePt,
    recipeId: input.key,
    profile,
    graph: graphFromCard(card, "GENETIC"),
    stackBehavior: timing === "PASSIVE" ? "RESOLVE" : "INTERRUPTIBLE",
    tokens: [input.key],
  };
}
