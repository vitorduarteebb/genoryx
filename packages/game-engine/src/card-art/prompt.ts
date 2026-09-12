import {
  CARD_ART_BASE_VARIANT,
  cardArtGenerationConfig,
  cardLabel,
  cardTypeComposition,
  elementVisualLanguage,
  floruneSpeciesReference,
  geneticCardArtConfig,
  getCardArtDirection,
  getCardDefinition,
  mechanicsFromDefinition,
  creatureLocusArtDirection,
  terranoxCreatureArtDirections,
  type CardArtDirection,
  type CardArtIllustrationType,
} from "@nexora/config";
import type { GeneticCardLocusKey } from "@nexora/types";

export type CardArtGenerationSpec = {
  cardKey: string;
  name: string;
  cardType: CardArtIllustrationType;
  element: string;
  tags: readonly string[];
  mechanics: readonly string[];
  speciesAffinity: readonly string[];
  variant: string;
  artDirection: string;
  artBibleVersion: number;
  promptVersion: number;
  cardArtVersion: number;
  showCreature: boolean;
  speciesReference?: string;
  referenceImages: readonly string[];
  scope?: "SHARED" | "CREATURE";
  geneticPowerName?: string;
  lifeStage?: string;
  effectSummary?: string;
};

export function cardArtSpecFromDirection(direction: CardArtDirection): CardArtGenerationSpec {
  return {
    cardKey: direction.cardKey,
    name: cardLabel(direction.cardKey),
    cardType: direction.illustrationType,
    element: direction.element,
    tags: direction.tags,
    mechanics: direction.mechanics,
    speciesAffinity: direction.speciesAffinity,
    variant: direction.variant,
    artDirection: direction.artDirection,
    artBibleVersion: cardArtGenerationConfig.artBibleVersion,
    promptVersion: cardArtGenerationConfig.promptVersion,
    cardArtVersion: cardArtGenerationConfig.cardArtVersion,
    showCreature: direction.showCreature,
    speciesReference: direction.speciesAffinity.includes("florune") ? floruneSpeciesReference : undefined,
    referenceImages: [],
  };
}

export function cardArtSpecFromCatalog(
  cardKey: string,
  variant = CARD_ART_BASE_VARIANT,
): CardArtGenerationSpec | undefined {
  const directed = getCardArtDirection(cardKey, variant);
  if (directed) {
    return cardArtSpecFromDirection(directed);
  }
  const def = getCardDefinition(cardKey);
  if (!def) {
    return undefined;
  }
  return {
    cardKey: def.key,
    name: cardLabel(def.key),
    cardType: def.type === "SYNERGY" ? "SKILL" : def.type,
    element: def.element,
    tags: def.tags,
    mechanics: mechanicsFromDefinition(def),
    speciesAffinity: def.species,
    variant,
    artDirection: `Communicate the ${def.type.toLowerCase()} concept of this GENORYX ability through a single clear magical action. Centered focal effect. No scenery overload.`,
    artBibleVersion: cardArtGenerationConfig.artBibleVersion,
    promptVersion: cardArtGenerationConfig.promptVersion,
    cardArtVersion: cardArtGenerationConfig.cardArtVersion,
    showCreature: false,
    referenceImages: [],
  };
}

export function buildCardArtPrompt(spec: CardArtGenerationSpec): string {
  const typeLanguage = cardTypeComposition[spec.cardType] ?? cardTypeComposition.SKILL;
  const elementLanguage = elementVisualLanguage[spec.element] ?? elementVisualLanguage.NATURE;
  const creatureLine = spec.showCreature
    ? spec.speciesReference ??
      `A canonical GENORYX ${spec.speciesAffinity[0] ?? "creature"}-class being may appear as species identity only — never a specific player NFT.`
    : "This card may illustrate only the effect, plant, energy or natural weapon. A creature is not required.";
  const referenceLine =
    spec.referenceImages.length > 0
      ? "Approved species or creature references may lock silhouette identity. They are species language, not a unique NFT."
      : "No pixel reference attached. Use the written species language only.";

  return `Create the official illustration for a GENORYX ability card.

CARD:
${spec.name}

TYPE:
${spec.cardType}

ELEMENT:
${spec.element}

GAMEPLAY CONCEPT:
${spec.mechanics.join(", ")}

VISUAL CONCEPT:
${spec.artDirection}

TYPE LANGUAGE:
${typeLanguage}

ELEMENT LANGUAGE:
${elementLanguage}

SPECIES:
${creatureLine}
${referenceLine}

STYLE:
Original premium fantasy creature collector card illustration.
Stylized.
Expressive.
Dynamic.
Readable at small size.
Strong silhouette and focal point.
Belongs to the same visual universe as GENORYX creatures.
Large readable forms.
Expressive magical effects.
No overly detailed background scenery.

COMPOSITION:
Square 1024x1024.
Keep the main character or effect centered.
Safe margin: do not place essential elements at the extreme edges.
The frontend will crop this illustration into a card window.

IMPORTANT:
Generate illustration only.

NO text.
NO letters.
NO numbers.
NO card frame.
NO UI.
NO logo.
NO watermark.

The illustration must communicate the card effect visually without relying on written language.
Do not write the card name.
Do not depict damage numbers, costs, gene loci or stats.
Do not copy existing card games.

Art bible version ${spec.artBibleVersion}. Card art version ${spec.cardArtVersion}. Prompt version ${spec.promptVersion}. Variant ${spec.variant}.`.trim();
}

export function creatureCardArtDirection(locus: GeneticCardLocusKey, element = "EARTH"): string {
  return creatureLocusArtDirection(locus, element) || terranoxCreatureArtDirections[locus];
}

export function buildCreatureCardArtPrompt(spec: CardArtGenerationSpec): string {
  const typeLanguage = cardTypeComposition[spec.cardType] ?? cardTypeComposition.SKILL;
  const elementLanguage = elementVisualLanguage[spec.element] ?? elementVisualLanguage.EARTH;
  const effectSummary = spec.effectSummary ?? spec.mechanics.join(", ");
  return `Create the official GENORYX genetic ability card illustration
for the exact creature shown in the reference image.

The reference creature is the canonical visual identity.
Preserve the same individual creature.

CARD:
${spec.name}

TYPE:
${spec.cardType}

ELEMENT:
${spec.element}

GENETIC POWER:
${spec.geneticPowerName ?? "Stone Core"}

LIFE STAGE:
${spec.lifeStage ?? "BABY"}

MECHANICS:
${effectSummary}

VISUAL DIRECTION:
${spec.artDirection}

TYPE LANGUAGE:
${typeLanguage}

ELEMENT LANGUAGE:
${elementLanguage}

IMPORTANT:
The creature depicted must clearly be the same individual
as the provided canonical creature reference.

Preserve:
body shape
face
colors
horns
tail
wings/back structures
pattern
material
distinctive features.

Show the creature performing the ability.

Do not redesign the creature.
Do not age the creature. Keep the same ${spec.lifeStage ?? "BABY"} life stage in every card.
Do not invent a different Terranox.

NO text.
NO letters.
NO numbers.
NO card frame.
NO UI.
NO logo.
NO watermark.

The illustration must communicate the card effect visually without relying on written language.
Do not write the card name.
Do not depict damage numbers, costs, gene loci or stats.

Art bible version ${spec.artBibleVersion}. Card art version ${spec.cardArtVersion}. Creature prompt version ${geneticCardArtConfig.promptVersion}.`.trim();
}
