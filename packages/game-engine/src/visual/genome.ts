import { getCardDefinition, paletteForSpecies, speciesVisuals } from "@nexora/config";
import type {
  AuraType,
  BackTrait,
  BodyPlan,
  EyeType,
  FrontLimbType,
  HeadType,
  HornType,
  LifeStage,
  MaterialType,
  MutationIntensity,
  MutationType,
  PatternType,
  RearLimbType,
  SizeGene,
  SkinType,
  TailType,
  Temperament,
} from "@nexora/types";
import {
  AURA_TYPES,
  BACK_TRAITS,
  EYE_TYPES,
  FRONT_LIMB_TYPES,
  HORN_TYPES,
  MATERIAL_TYPES,
  MUTATION_INTENSITIES,
  PATTERN_TYPES,
  REAR_LIMB_TYPES,
  SIZE_GENES,
  SKIN_TYPES,
  TAIL_TYPES,
  TEMPERAMENTS,
} from "@nexora/types";
import type { ChassisDna } from "../chassis/dna";
import { geneticHash, seedFromParts } from "../genes/hash";

export type VisualAllele<T> = {
  expressed: T;
  recessive: T;
};

export type CreatureVisualGenome = {
  speciesKey: string;
  bodyPlan: VisualAllele<BodyPlan>;
  headType: VisualAllele<HeadType>;
  eyeType: VisualAllele<EyeType>;
  hornType: VisualAllele<HornType>;
  frontLimbs: VisualAllele<FrontLimbType>;
  rearLimbs: VisualAllele<RearLimbType>;
  tailType: VisualAllele<TailType>;
  backTrait: VisualAllele<BackTrait>;
  patternType: VisualAllele<PatternType>;
  auraType: VisualAllele<AuraType>;
  skinType: SkinType;
  materialType: MaterialType;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  eyeColor: string;
  temperament: Temperament;
  mutationType: MutationType;
  mutationIntensity: MutationIntensity;
  sizeGene: SizeGene;
  lifeStage: LifeStage;
  visualTags: string[];
  visualSeed: string;
  chassis?: ChassisDna;
};

export type AssembleVisualGenomeInput = {
  creatureId?: string;
  speciesKey: string;
  bodyPlanExpressed: BodyPlan;
  bodyPlanRecessive: BodyPlan;
  headExpressed: HeadType;
  headRecessive: HeadType;
  geneticHash: string;
  genesisSeed: number;
  lifeStage: LifeStage;
  mutationKey?: string | null;
  expressedCardKeys?: readonly string[];
  temperament?: Temperament;
  visualSeed?: string;
  chassis?: ChassisDna;
};

function pick<T>(items: readonly T[], seed: number): T {
  const item = items[Math.abs(seed) % items.length];
  if (item === undefined) {
    throw new Error("empty visual catalog");
  }
  return item;
}

function otherThan<T>(items: readonly T[], expressed: T, seed: number): T {
  const rest = items.filter((item) => item !== expressed);
  return rest.length > 0 ? pick(rest, seed) : expressed;
}

function mutationFromKey(key?: string | null): MutationType {
  if (key === "PLASMA" || key === "MAGMA" || key === "VOID" || key === "ANCIENT") {
    return key;
  }
  return "NONE";
}

function hornsFor(body: BodyPlan, head: HeadType, seed: number): HornType {
  if (body === "SERPENT_WYRM" || body === "AMPHIBIAN" || body === "ABYSSAL") {
    return pick(["NONE", "NONE", "CRYSTAL_GENESIS"] as const, seed);
  }
  if (head === "DRACONIC") {
    return pick(["DRACONIC", "CROWN", "CRYSTAL_GENESIS"] as const, seed);
  }
  if (head === "BEAST") {
    return pick(["PREDATOR", "CURVED_RAM", "NONE"] as const, seed);
  }
  if (head === "SERPENT") {
    return pick(["NONE", "CRYSTAL_GENESIS"] as const, seed);
  }
  return pick(HORN_TYPES, seed);
}

function tailFor(body: BodyPlan, seed: number): TailType {
  if (body === "SERPENT_WYRM" || body === "FLOATING" || body === "GOLEM") {
    return "NONE";
  }
  return pick(
    ["PREDATOR", "HEAVY_CLUB", "BLADE", "SERPENT_TENTACLE", "GENESIS_SPLIT"] as const,
    seed,
  );
}

function backFor(body: BodyPlan, seed: number): BackTrait {
  if (body === "AVIAN") {
    return pick(["FEATHERED_WINGS", "DRACONIC_WINGS"] as const, seed);
  }
  if (body === "ARACHNID" || body === "INSECTOID_BIPED") {
    return pick(["SHELL_CARAPACE", "NONE", "DORSAL_SPINES"] as const, seed);
  }
  if (body === "GOLEM") {
    return pick(["NONE", "SHELL_CARAPACE"] as const, seed);
  }
  if (body === "QUADRUPED" || body === "CENTAUROID") {
    return pick(["DORSAL_SPINES", "DRACONIC_WINGS", "NONE"] as const, seed);
  }
  return pick(BACK_TRAITS, seed);
}

function frontFor(body: BodyPlan, seed: number): FrontLimbType {
  if (body === "GOLEM") return pick(["HEAVY_GUARDIAN", "CLAWED"] as const, seed);
  if (body === "INSECTOID_BIPED" || body === "ARACHNID") return pick(["MANTIS_BLADE", "CLAWED"] as const, seed);
  if (body === "AVIAN") return pick(["RAPTOR_AGILE", "CLAWED"] as const, seed);
  return pick(FRONT_LIMB_TYPES, seed);
}

function rearFor(body: BodyPlan, seed: number): RearLimbType {
  if (body === "GOLEM") return "HEAVY_COLOSSAL";
  if (body === "AVIAN" || body === "INSECTOID_BIPED") return pick(["RAPTOR_SPRINTER", "LEAPER_EXOTIC"] as const, seed);
  return pick(REAR_LIMB_TYPES, seed);
}

function materialFor(body: BodyPlan, speciesKey: string, seed: number): MaterialType {
  if (body === "GOLEM") return pick(["STONE", "CRYSTAL"] as const, seed);
  if (body === "ARACHNID" || body === "INSECTOID_BIPED") return "CHITIN";
  if (body === "FLOATING") return pick(["ETHEREAL", "SOFT_SKIN"] as const, seed);
  if (speciesKey === "florune") return pick(["PLANT", "SOFT_SKIN"] as const, seed);
  if (speciesKey === "pyron" || speciesKey === "drakor") return pick(["SCALES", "SOFT_SKIN"] as const, seed);
  return pick(MATERIAL_TYPES, seed);
}

function auraFor(mutation: MutationType, seed: number): AuraType {
  if (mutation === "PLASMA") return "ELECTRIC_PLASMA";
  if (mutation === "MAGMA") return "EMBER_FIRE";
  if (mutation === "VOID") return "VOID_ARCANE";
  if (mutation === "ANCIENT") return pick(["GENESIS", "NONE"] as const, seed);
  return pick(["NONE", "NONE", "EMBER_FIRE", "VOID_ARCANE", "GENESIS"] as const, seed);
}

function collectedVisualTags(cardKeys: readonly string[] | undefined): string[] {
  const tags = new Set<string>();
  for (const key of cardKeys ?? []) {
    const card = getCardDefinition(key);
    for (const tag of card?.visualTags ?? []) {
      tags.add(tag);
    }
  }
  return [...tags].sort();
}

export function deriveVisualSeed(creatureId: string, genomeHash: string): string {
  return geneticHash([creatureId, genomeHash, "visual-seed"]);
}

export function assembleVisualGenome(input: AssembleVisualGenomeInput): CreatureVisualGenome {
  const visual = speciesVisuals[input.speciesKey];
  const speciesKey = visual?.key ?? input.speciesKey;
  const visualSeed =
    input.visualSeed ??
    deriveVisualSeed(input.creatureId ?? "pending", input.geneticHash);
  const s = (salt: string) => seedFromParts([visualSeed, input.genesisSeed, input.geneticHash, salt]);

  const mutationType = mutationFromKey(input.mutationKey);
  const palette = paletteForSpecies(speciesKey);
  const eyeExpressed = pick(EYE_TYPES, s("eye"));
  const hornExpressed = hornsFor(input.bodyPlanExpressed, input.headExpressed, s("horn"));
  const frontExpressed = frontFor(input.bodyPlanExpressed, s("front"));
  const rearExpressed = rearFor(input.bodyPlanExpressed, s("rear"));
  const tailExpressed = tailFor(input.bodyPlanExpressed, s("tail"));
  const backExpressed = backFor(input.bodyPlanExpressed, s("back"));
  const patternExpressed = pick(PATTERN_TYPES, s("pattern"));
  const auraExpressed = auraFor(mutationType, s("aura"));

  return {
    speciesKey,
    bodyPlan: { expressed: input.bodyPlanExpressed, recessive: input.bodyPlanRecessive },
    headType: { expressed: input.headExpressed, recessive: input.headRecessive },
    eyeType: { expressed: eyeExpressed, recessive: otherThan(EYE_TYPES, eyeExpressed, s("eye-r")) },
    hornType: { expressed: hornExpressed, recessive: otherThan(HORN_TYPES, hornExpressed, s("horn-r")) },
    frontLimbs: {
      expressed: frontExpressed,
      recessive: otherThan(FRONT_LIMB_TYPES, frontExpressed, s("front-r")),
    },
    rearLimbs: {
      expressed: rearExpressed,
      recessive: otherThan(REAR_LIMB_TYPES, rearExpressed, s("rear-r")),
    },
    tailType: { expressed: tailExpressed, recessive: otherThan(TAIL_TYPES, tailExpressed, s("tail-r")) },
    backTrait: { expressed: backExpressed, recessive: otherThan(BACK_TRAITS, backExpressed, s("back-r")) },
    patternType: {
      expressed: patternExpressed,
      recessive: otherThan(PATTERN_TYPES, patternExpressed, s("pattern-r")),
    },
    auraType: { expressed: auraExpressed, recessive: otherThan(AURA_TYPES, auraExpressed, s("aura-r")) },
    skinType: pick(SKIN_TYPES, s("skin")),
    materialType: materialFor(input.bodyPlanExpressed, speciesKey, s("material")),
    primaryColor: palette.primaryColor,
    secondaryColor: palette.secondaryColor,
    accentColor: palette.accentColor,
    eyeColor: palette.eyeColor,
    temperament: input.temperament ?? pick(TEMPERAMENTS, s("temperament")),
    mutationType,
    mutationIntensity:
      mutationType === "NONE" ? "LOW" : pick(MUTATION_INTENSITIES, s("mutation-intensity")),
    sizeGene: pick(SIZE_GENES, s("size")),
    lifeStage: input.lifeStage,
    visualTags: collectedVisualTags(input.expressedCardKeys),
    visualSeed,
    chassis: input.chassis,
  };
}
