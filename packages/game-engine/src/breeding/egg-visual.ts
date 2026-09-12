import { paletteForSpecies } from "@nexora/config";
import type {
  EggShellShape,
  EggSizeClass,
  EggSurfacePattern,
  Element,
  GenesisGrade,
} from "@nexora/types";
import { geneticHash } from "../genes/hash";
import type { CreatureBlueprint } from "../genes/generate";
import { elementHintLabel, type PowerOriginKind } from "./genesis-complexity";

export type EggVisualGenome = {
  shellShape: EggShellShape;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  surfacePattern: EggSurfacePattern;
  shellMaterialHint: "stone-organic" | "living-bark" | "crystal-dust" | "smooth-enamel" | "wet-mineral";
  elementalHint: string;
  auraHint: "none" | "faint-genesis" | "unstable-shimmer";
  sizeClass: EggSizeClass;
  genesisGrade: GenesisGrade;
  visualSeed: string;
};

const BODY_SHELL: Record<string, EggShellShape> = {
  GOLEM: "PLATED",
  AVIAN: "OVOID",
  ABYSSAL: "ORGANIC",
  SERPENT_WYRM: "RIDGED",
  FLOATING: "CRYSTALLINE",
  INSECTOID_BIPED: "RIDGED",
  BIPED: "ORGANIC",
  QUADRUPED: "OVOID",
  AMPHIBIAN: "ORGANIC",
  HUMANOID_BEAST: "ORGANIC",
};

const ELEMENT_MATERIAL: Partial<Record<Element, EggVisualGenome["shellMaterialHint"]>> = {
  EARTH: "stone-organic",
  NATURE: "living-bark",
  WATER: "wet-mineral",
  FIRE: "smooth-enamel",
  ICE: "crystal-dust",
  LIGHT: "crystal-dust",
  DARK: "smooth-enamel",
  ELECTRIC: "crystal-dust",
  ARCANE: "smooth-enamel",
};

function mixHex(a: string, b: string, bias = 0.55): string {
  const pa = Number.parseInt(a.replace("#", "").slice(0, 6), 16);
  const pb = Number.parseInt(b.replace("#", "").slice(0, 6), 16);
  const mix = (shift: number) => {
    const va = (pa >> shift) & 255;
    const vb = (pb >> shift) & 255;
    return Math.round(va * bias + vb * (1 - bias));
  };
  const hex = (value: number) => value.toString(16).padStart(2, "0");
  return `#${hex(mix(16))}${hex(mix(8))}${hex(mix(0))}`.toUpperCase();
}

function pickFromSeed<T>(items: readonly T[], seed: string, salt: string): T {
  const n = Number.parseInt(geneticHash([seed, salt]).slice(0, 8), 16);
  return items[n % items.length] ?? items[0]!;
}

export function deriveEggVisualGenome(input: {
  child: CreatureBlueprint;
  parentA: CreatureBlueprint;
  parentB: CreatureBlueprint;
  genesisGrade: GenesisGrade;
  powerOrigin?: PowerOriginKind;
  eggKey?: string;
}): EggVisualGenome {
  const childPalette = paletteForSpecies(input.child.speciesKey);
  const parentAPalette = paletteForSpecies(input.parentA.speciesKey);
  const parentBPalette = paletteForSpecies(input.parentB.speciesKey);
  const visualSeed = geneticHash([
    input.child.geneticHash,
    input.eggKey ?? "",
    input.genesisGrade,
    "egg-visual-v1",
  ]);
  const plated = input.child.bodyPlanExpressed === "GOLEM" || input.parentA.bodyPlanExpressed === "GOLEM" || input.parentB.bodyPlanExpressed === "GOLEM";
  const organic = input.child.elementPrimary === "NATURE" || input.parentA.elementPrimary === "NATURE" || input.parentB.elementPrimary === "NATURE";
  const patternPool: EggSurfacePattern[] = plated
    ? ["PLATES", "VEINS", "CRACKLE"]
    : organic
      ? ["MOSS", "VEINS", "MARBLE"]
      : ["SMOOTH", "VEINS", "MARBLE", "CRACKLE"];
  const aura =
    input.powerOrigin === "NEW"
      ? "faint-genesis"
      : input.child.mutationKey
        ? "unstable-shimmer"
        : "none";

  return {
    shellShape: BODY_SHELL[input.child.bodyPlanExpressed] ?? "OVOID",
    primaryColor: mixHex(childPalette.primaryColor, parentAPalette.secondaryColor, 0.7),
    secondaryColor: mixHex(parentBPalette.primaryColor, childPalette.secondaryColor, 0.55),
    accentColor: mixHex(childPalette.accentColor, parentAPalette.accentColor, 0.6),
    surfacePattern: pickFromSeed(patternPool, visualSeed, "pattern"),
    shellMaterialHint:
      ELEMENT_MATERIAL[input.child.elementPrimary] ?? (plated ? "stone-organic" : organic ? "living-bark" : "smooth-enamel"),
    elementalHint: elementHintLabel(input.child.elementPrimary, input.child.elementSecondary),
    auraHint: aura,
    sizeClass: pickFromSeed(["SMALL", "MEDIUM", "LARGE"] as const, visualSeed, "size"),
    genesisGrade: input.genesisGrade,
    visualSeed,
  };
}

export function eggVisualExposesSecrets(genome: EggVisualGenome): boolean {
  const blob = JSON.stringify(genome).toUpperCase();
  return (
    blob.includes("RECESSIVE") ||
    blob.includes("\"G1\"") ||
    blob.includes("\"G10\"") ||
    blob.includes("GOLEM") ||
    blob.includes("CRYSTAL EYES") ||
    blob.includes("NEW POWER") ||
    blob.includes("VOID") ||
    blob.includes("PLASMA") ||
    blob.includes("GENETICHASH")
  );
}
