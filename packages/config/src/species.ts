import type { BodyPlan, Element, HeadType } from "@nexora/types";

export type SpeciesVisual = {
  key: string;
  bodyPlan: BodyPlan;
  head: HeadType;
  tags: readonly string[];
};

export const speciesVisuals: Record<string, SpeciesVisual> = {
  pyron: { key: "pyron", bodyPlan: "QUADRUPED", head: "DRACONIC", tags: ["BURN", "FIRE"] },
  nympha: { key: "nympha", bodyPlan: "AMPHIBIAN", head: "SERPENT", tags: ["HEAL", "WATER"] },
  florune: { key: "florune", bodyPlan: "BIPED", head: "EXOTIC", tags: ["NATURE", "CONTROL"] },
  terranox: { key: "terranox", bodyPlan: "GOLEM", head: "BEAST", tags: ["TANK", "EARTH"] },
  drakor: { key: "drakor", bodyPlan: "QUADRUPED", head: "DRACONIC", tags: ["BURN", "FIRE"] },
  aqualis: { key: "aqualis", bodyPlan: "ABYSSAL", head: "SERPENT", tags: ["WATER"] },
  voltaris: { key: "voltaris", bodyPlan: "AVIAN", head: "EXOTIC", tags: ["ELECTRIC"] },
  sparkyn: { key: "sparkyn", bodyPlan: "INSECTOID_BIPED", head: "EXOTIC", tags: ["ELECTRIC"] },
  grumak: { key: "grumak", bodyPlan: "GOLEM", head: "BEAST", tags: ["TANK", "EARTH"] },
  cryon: { key: "cryon", bodyPlan: "FLOATING", head: "EXOTIC", tags: ["ICE"] },
  noctyr: { key: "noctyr", bodyPlan: "SERPENT_WYRM", head: "SERPENT", tags: ["DARK"] },
  lumera: { key: "lumera", bodyPlan: "HUMANOID_BEAST", head: "DRACONIC", tags: ["LIGHT"] },
};

export const speciesElements: Record<string, Element> = {
  pyron: "FIRE",
  nympha: "WATER",
  florune: "NATURE",
  terranox: "EARTH",
  drakor: "FIRE",
  aqualis: "WATER",
  voltaris: "ELECTRIC",
  sparkyn: "ELECTRIC",
  grumak: "EARTH",
  cryon: "ICE",
  noctyr: "DARK",
  lumera: "LIGHT",
};
