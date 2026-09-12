import {
  auraLexicon,
  backLexicon,
  bodyPlanLexicon,
  eyeLexicon,
  frontLimbLexicon,
  headLexicon,
  hornLexicon,
  lifeStageLexicon,
  materialLexicon,
  mutationIntensityLexicon,
  mutationLexicon,
  patternLexicon,
  rearLimbLexicon,
  skinLexicon,
  tailLexicon,
  temperamentLexicon,
  visualGenerationConfig,
  visualTagLexicon,
} from "@nexora/config";
import type { TurnaroundView } from "@nexora/types";
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
import type { CreatureVisualGenome } from "./genome";

export type CreatureVisualGenerationSpec = {
  creatureId: string;
  species: string;
  lifeStage: LifeStage;
  bodyPlan: BodyPlan;
  head: HeadType;
  eyes: EyeType;
  horns: HornType;
  frontLimbs: FrontLimbType;
  rearLimbs: RearLimbType;
  tail: TailType;
  back: BackTrait;
  pattern: PatternType;
  aura: AuraType;
  skin: SkinType;
  material: MaterialType;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  eyeColor: string;
  temperament: Temperament;
  mutation: MutationType;
  mutationIntensity: MutationIntensity;
  sizeGene: SizeGene;
  visualTags: string[];
  visualSeed: string;
  artBibleVersion: number;
  promptVersion: number;
  hasParentReferences?: boolean;
  hasPriorStageReference?: boolean;
};

export type BuildPromptOptions = {
  includeRecessives?: boolean;
};

export function visualSpecFromGenome(
  creatureId: string,
  genome: CreatureVisualGenome,
  extras?: { hasParentReferences?: boolean; hasPriorStageReference?: boolean },
): CreatureVisualGenerationSpec {
  return {
    creatureId,
    species: genome.speciesKey,
    lifeStage: genome.lifeStage,
    bodyPlan: genome.bodyPlan.expressed,
    head: genome.headType.expressed,
    eyes: genome.eyeType.expressed,
    horns: genome.hornType.expressed,
    frontLimbs: genome.frontLimbs.expressed,
    rearLimbs: genome.rearLimbs.expressed,
    tail: genome.tailType.expressed,
    back: genome.backTrait.expressed,
    pattern: genome.patternType.expressed,
    aura: genome.auraType.expressed,
    skin: genome.skinType,
    material: genome.materialType,
    primaryColor: genome.primaryColor,
    secondaryColor: genome.secondaryColor,
    accentColor: genome.accentColor,
    eyeColor: genome.eyeColor,
    temperament: genome.temperament,
    mutation: genome.mutationType,
    mutationIntensity: genome.mutationIntensity,
    sizeGene: genome.sizeGene,
    visualTags: [...genome.visualTags],
    visualSeed: genome.visualSeed,
    artBibleVersion: visualGenerationConfig.artBibleVersion,
    promptVersion: visualGenerationConfig.promptVersion,
    hasParentReferences: extras?.hasParentReferences,
    hasPriorStageReference: extras?.hasPriorStageReference,
  };
}

function tagLines(tags: readonly string[]): string {
  if (tags.length === 0) {
    return "None. Cards without declared visualTags must not change the art.";
  }
  return tags.map((tag) => `- ${tag}: ${visualTagLexicon[tag] ?? tag}`).join("\n");
}

function recessiveBlock(genome: CreatureVisualGenome): string {
  return [
    "ADMIN RECESSIVE REVEAL (not public):",
    `body recessive ${genome.bodyPlan.recessive}`,
    `head recessive ${genome.headType.recessive}`,
    `eyes recessive ${genome.eyeType.recessive}`,
    `horns recessive ${genome.hornType.recessive}`,
    `front recessive ${genome.frontLimbs.recessive}`,
    `rear recessive ${genome.rearLimbs.recessive}`,
    `tail recessive ${genome.tailType.recessive}`,
    `back recessive ${genome.backTrait.recessive}`,
    `pattern recessive ${genome.patternType.recessive}`,
    `aura recessive ${genome.auraType.recessive}`,
  ].join("\n");
}

export function buildCreatureImagePrompt(
  spec: CreatureVisualGenerationSpec,
  options: BuildPromptOptions = {},
  genomeForAdmin?: CreatureVisualGenome,
): string {
  const adultTemperament =
    spec.lifeStage === "ADULT"
      ? `Temperament must remain ${spec.temperament}.`
      : "";

  const parentRule = spec.hasParentReferences
    ? "Parent images are lineage references only. Do not inherit any visual trait that is not present in the provided child genome."
    : "No parent images. Use only this genome.";

  const continuity = spec.hasPriorStageReference
    ? "This is the same individual creature at a later life stage. Preserve palette, body plan, face identity, eyes, horn type, pattern placement, mutations, tail, wings and characteristic markings."
    : "No prior-stage reference. Establish the official identity of this individual.";

  const admin =
    options.includeRecessives && genomeForAdmin ? `\n${recessiveBlock(genomeForAdmin)}\n` : "";

  return `Create the official GENORYX visual representation for Creature ${spec.creatureId}.

This is an original fantasy creature collector character belonging to the GENORYX universe.
Species identity: ${spec.species}. Visual seed ${spec.visualSeed} (tiny unique nuance only; do not invent extra limbs or genes). Size gene: ${spec.sizeGene}.

SECTION 1 IDENTITY
${parentRule}
${continuity}

SECTION 2 LIFE STAGE
${lifeStageLexicon[spec.lifeStage]}
${adultTemperament}

SECTION 3 ANATOMY
Body plan: ${spec.bodyPlan}. ${bodyPlanLexicon[spec.bodyPlan]}
Head: ${spec.head}. ${headLexicon[spec.head]}
Front limbs: ${spec.frontLimbs}. ${frontLimbLexicon[spec.frontLimbs]}
Rear limbs: ${spec.rearLimbs}. ${rearLimbLexicon[spec.rearLimbs]}
Tail: ${spec.tail}. ${tailLexicon[spec.tail]}
Back trait: ${spec.back}. ${backLexicon[spec.back]}

SECTION 4 FACIAL IDENTITY
Eyes: ${spec.eyes}. ${eyeLexicon[spec.eyes]}
Horns: ${spec.horns}. ${hornLexicon[spec.horns]}

SECTION 5 APPENDAGES
Use only the limbs, tail and back trait listed above. Do not invent additional limbs, horns, wings, eyes, mutations, patterns or accessories.

SECTION 6 SURFACE / MATERIAL
Skin/material: ${materialLexicon[spec.material]}; ${skinLexicon[spec.skin]}.
Pattern: ${patternLexicon[spec.pattern]}
Aura: ${auraLexicon[spec.aura]}
Material changes surface only. It does not change the body plan.

SECTION 7 GENETIC COLORS (mandatory)
Primary: ${spec.primaryColor}
Secondary: ${spec.secondaryColor}
Accent: ${spec.accentColor}
Eyes: ${spec.eyeColor}
These hex colors are obligatory. Small natural lighting variation is acceptable. Do not swap the chromatic identity.

SECTION 8 MUTATION
${mutationLexicon[spec.mutation]}
${mutationIntensityLexicon[spec.mutationIntensity]}

SECTION 9 TEMPERAMENT
${temperamentLexicon[spec.temperament]}

SECTION 10 ART BIBLE
Original GENORYX fantasy creature collector character.
Stylized, charismatic and highly collectible.
Large readable forms, strong silhouette, slightly oversized head, strong facial expression.
Coherent living anatomy — one organism, never pasted modular parts.
Fantastical, not a realistic animal, not a dry anatomical study, not a flat color square.
Some individuals are friendly, others noble, others feral, others strange or monstrous — all belong to the same GENORYX visual universe.
Do not copy Axie Infinity or any existing franchise. Use the monster-collector genre only as an abstract reference.
Art bible version ${spec.artBibleVersion}. Prompt version ${spec.promptVersion}.

SECTION 11 COMPOSITION
Full creature visible.
3/4 view.
Clean neutral presentation.
No text.
No UI.
No logo.
No weapons unless explicitly present in genome.
No human clothing unless explicitly present.
No unrelated accessories.
The final result must look like one coherent naturally evolved creature, not separate body parts pasted together.

SECTION 12 FORBIDDEN DEVIATIONS
Strictly respect all expressed genetic traits.
Do not display recessive traits.
Do not invent genes the spec omitted.
If this image disagrees with the genome, the image is invalid — the DNA does not change.

EXPRESSED VISUAL GENETIC TRAITS:
${tagLines(spec.visualTags)}
${admin}`.trim();
}

const TURNAROUND_CAMERA: Record<Exclude<TurnaroundView, "THREE_QUARTER">, string> = {
  FRONT: "Strict front orthographic-like view. The creature faces the camera. Full body visible. Same pose language as the official 3/4 portrait, rotated to front.",
  SIDE: "Strict left-side profile view. Full body visible. Same proportions and silhouette identity as the official portrait.",
  BACK: "Strict rear view. Show the back trait, wings if present, tail and pattern from behind. Same individual. Full body visible.",
};

export function buildTurnaroundPrompt(
  spec: CreatureVisualGenerationSpec,
  view: Exclude<TurnaroundView, "THREE_QUARTER">,
): string {
  return `${buildCreatureImagePrompt(spec)}

SECTION 13 TURNAROUND — ${view}
This is the SAME official GENORYX individual already established in the provided reference image.
${TURNAROUND_CAMERA[view]}
Identity lock: Creature ${spec.creatureId}. Visual seed ${spec.visualSeed}.
Do not change horns, eyes, colors, tail, wings, pattern, aura, temperament, mutation, body plan, head type or material.
Do not redesign. Do not invent extra limbs. Do not make a different creature.
The result must be immediately recognizable as the same Florune-class individual from the reference.`.trim();
}
