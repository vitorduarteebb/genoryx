import type { Element } from "@nexora/types";
import { GENETIC_CARD_LOCI } from "@nexora/types";
import { type CardDefinition } from "./cards";

export const CARD_ART_BASE_VARIANT = "BASE";

export const cardArtGenerationConfig = {
  artBibleVersion: 2,
  cardArtVersion: 1,
  promptVersion: 1,
  defaultModel: "gpt-image-2",
  productionSnapshot: "gpt-image-2-2026-04-21",
  qaThreshold: 0.9,
  maxJobAttempts: 5,
  retryDelaysMs: [60_000, 300_000, 900_000] as const,
  rateLimitRetryMs: 15_000,
  openaiMinIntervalMs: 13_000,
  workerIntervalMs: 5_000,
  generationConcurrency: 1,
  imageSize: "1024x1024",
  proofSpeciesKey: "florune",
} as const;

export type CardArtIllustrationType =
  | "ATTACK"
  | "SKILL"
  | "REACTION"
  | "ULTIMATE"
  | "TACTIC"
  | "GENETIC"
  | "EQUIPMENT"
  | "CHARACTER"
  | "SIGNATURE";

export type CardArtDirection = {
  cardKey: string;
  variant: string;
  illustrationType: CardArtIllustrationType;
  element: Element | "VOID";
  tags: readonly string[];
  mechanics: readonly string[];
  speciesAffinity: readonly string[];
  artDirection: string;
  showCreature: boolean;
};

export const cardTypeComposition: Record<CardArtIllustrationType, string> = {
  ATTACK:
    "Dynamic combat composition. Show impact, a strike, a projectile, a bite or the elemental hit clearly. Fast readable motion.",
  SKILL:
    "Magical or technical composition. Show a buff, heal, shield, control or utility effect — not a raw punch.",
  REACTION:
    "Instant reactive action: a block, counter, barrier erupting, or dodge. The moment happens now.",
  ULTIMATE:
    "Grander scale, more energy, dramatic light. Still readable as a small card thumbnail. Never unreadable chaos.",
  TACTIC: "Strategic field effect with a clear focal action. No minimap, no UI, no diagrams.",
  GENETIC: "The gene's identity made visible as an ability, not a laboratory chart.",
  EQUIPMENT: "A natural weapon, relic or living tool. No inventory grid.",
  CHARACTER: "A character or signature presence. Not a player portrait, not a photograph.",
  SIGNATURE:
    "Lineage signature. Stronger species identity, mutation or gene. More sophisticated than basic attacks. Still no text.",
};

export const elementVisualLanguage: Record<string, string> = {
  NATURE:
    "Living plants: leaves, roots, vines, pollen, flowers, organic growth, green-gold energy. Do not paint the whole image flat green.",
  FIRE: "Flames, embers, heat haze, ash, explosive shapes. Do not paint the whole image flat orange.",
  WATER: "Flows, waves, droplets, spirals, reflections. Do not paint the whole image flat blue.",
  ELECTRIC: "Arcs, plasma, fast lines, concentrated energy. Do not paint the whole image flat yellow.",
  VOID: "Darkness, fragments, uncommon energy, controlled visual distortion. Strange on purpose, never broken art.",
  ARCANE: "Clean magical forms, original abstract symbols. Invent GENORYX marks — never copy known franchise runes.",
  EARTH: "Stone plates, soil burst, mineral weight. Large readable forms.",
  ICE: "Crystals, frost bloom, cold light. Not a weather icon.",
  LIGHT: "Warm radiance, soft beams, hopeful glow. Not a UI lens flare pack.",
  DARK: "Deep shadow, restrained highlights, uncommon dusk energy.",
};

export const floruneSpeciesReference =
  "Canonical GENORYX Florune-class plant creature: living botanical anatomy, petal and vine motifs, nature energy. Species identity only — never a specific player NFT or unique genetic individual.";

export const floruneCardArtDirections: readonly CardArtDirection[] = [
  {
    cardKey: "vine_tap",
    variant: CARD_ART_BASE_VARIANT,
    illustrationType: "ATTACK",
    element: "NATURE",
    tags: ["NATURE", "ATTACK"],
    mechanics: ["quick vine whip", "impact strike"],
    speciesAffinity: ["florune"],
    showCreature: true,
    artDirection:
      "A thick living vine whipping in a fast diagonal slash. A Florune-class creature may be only partly visible commanding the vine. Small leaves flung by the impact. Subtle natural energy. Do not show a complete enemy — only an impact hint. Feeling: fast, natural, offensive.",
  },
  {
    cardKey: "thorn_spike",
    variant: CARD_ART_BASE_VARIANT,
    illustrationType: "ATTACK",
    element: "NATURE",
    tags: ["NATURE", "POISON", "ATTACK"],
    mechanics: ["precise thorn projectile", "subtle toxin"],
    speciesAffinity: ["florune"],
    showCreature: false,
    artDirection:
      "A large living plant thorn launched at high speed. Fast trajectory, small leaf fragments. The tip has a subtle toxin sheen — no skulls, no cliché poison symbols. Feeling: precision, danger, venom.",
  },
  {
    cardKey: "bloom_burst",
    variant: CARD_ART_BASE_VARIANT,
    illustrationType: "ATTACK",
    element: "NATURE",
    tags: ["NATURE", "ATTACK"],
    mechanics: ["radial flower explosion", "petal shockwave"],
    speciesAffinity: ["florune"],
    showCreature: true,
    artDirection:
      "A fantastic flower opens violently, releasing a radial explosion of petals, natural energy, light and leaves. A Florune may stand at the center or behind the burst. Must not look like an ordinary garden flower. Feeling: beautiful, powerful, magical.",
  },
  {
    cardKey: "bark_guard",
    variant: CARD_ART_BASE_VARIANT,
    illustrationType: "SKILL",
    element: "NATURE",
    tags: ["NATURE", "SHIELD"],
    mechanics: ["living bark plates", "organic shield"],
    speciesAffinity: ["florune"],
    showCreature: true,
    artDirection:
      "Living tree-bark plates rising around a creature, forming organic protection. Small leaves grow on the edges. Natural energy circulates between the plates. Feeling: protection, resilience, nature.",
  },
  {
    cardKey: "pollen_drift",
    variant: CARD_ART_BASE_VARIANT,
    illustrationType: "SKILL",
    element: "NATURE",
    tags: ["NATURE", "HEAL", "DRAW"],
    mechanics: ["healing pollen cloud", "renewal", "insight"],
    speciesAffinity: ["florune"],
    showCreature: true,
    artDirection:
      "Glowing pollen particles drifting softly. A Florune breathing or releasing a luminous cloud. Tiny petals and points of light. Must not look like a venomous attack. Feeling: healing, lightness, renewal, intelligence.",
  },
  {
    cardKey: "root_snare",
    variant: CARD_ART_BASE_VARIANT,
    illustrationType: "SKILL",
    element: "NATURE",
    tags: ["NATURE", "CONTROL"],
    mechanics: ["binding roots", "immobilize"],
    speciesAffinity: ["florune"],
    showCreature: false,
    artDirection:
      "Large thick roots erupting from the ground and wrapping a partially visible target. Leaves and soil flung upward. No graphic violence. Feeling: control, force, imprisonment.",
  },
  {
    cardKey: "leaf_veil",
    variant: CARD_ART_BASE_VARIANT,
    illustrationType: "REACTION",
    element: "NATURE",
    tags: ["NATURE", "SHIELD", "REACTION"],
    mechanics: ["instant leaf barrier", "reactive guard"],
    speciesAffinity: ["florune"],
    showCreature: true,
    artDirection:
      "A fast spiral of leaves forming an instant barrier in front of the creature. Circular motion, some leaves very close to camera. Translucent green energy between them. Feeling: instant reaction, protection, elegance.",
  },
  {
    cardKey: "grove_pact",
    variant: CARD_ART_BASE_VARIANT,
    illustrationType: "SKILL",
    element: "NATURE",
    tags: ["NATURE", "SYNERGY"],
    mechanics: ["living bond", "grove synergy"],
    speciesAffinity: ["florune"],
    showCreature: true,
    artDirection:
      "A creature in connection with an abstract fantastic grove. Roots and small lights linking vegetal forms. Suggest cooperation and synergy. Do not create a huge forest panorama — focus on the energetic bond. Feeling: alliance, impetus, synergy, living nature.",
  },
  {
    cardKey: "sunpetal",
    variant: CARD_ART_BASE_VARIANT,
    illustrationType: "SIGNATURE",
    element: "NATURE",
    tags: ["NATURE", "HEAL", "SIGNATURE"],
    mechanics: ["solar bloom", "lineage heal"],
    speciesAffinity: ["florune"],
    showCreature: true,
    artDirection:
      "A huge luminous solar flower above or behind a Florune. Gold and green petals. Soft beams of light descending toward suggested ally silhouettes. More sophisticated than the basic kit. Feeling: rare, healing, hope, lineage signature.",
  },
  {
    cardKey: "verdant_bloom",
    variant: CARD_ART_BASE_VARIANT,
    illustrationType: "ULTIMATE",
    element: "NATURE",
    tags: ["NATURE", "ULTIMATE"],
    mechanics: ["offensive bloom", "regenerative return"],
    speciesAffinity: ["florune"],
    showCreature: true,
    artDirection:
      "Grand manifestation of natural power. Florune at the center. Plants, roots, flowers and energy explode in all directions. Part of the energy advances offensively; another part returns to the Florune as healing. Communicate damage and heal at once, without writing. Greatest impact of the ten. Feeling: Ultimate, power, rebirth, nature dominating the field.",
  },
];

const directionsByKey = new Map(
  floruneCardArtDirections.map((row) => [`${row.cardKey}:${row.variant}`, row] as const),
);

export function getCardArtDirection(cardKey: string, variant = CARD_ART_BASE_VARIANT): CardArtDirection | undefined {
  return directionsByKey.get(`${cardKey}:${variant}`);
}

export function floruneProofCardKeys(): readonly string[] {
  return floruneCardArtDirections.map((row) => row.cardKey);
}

export function locusKeyForCard(def: CardDefinition): string | undefined {
  if (!def.locusRole) {
    return undefined;
  }
  return GENETIC_CARD_LOCI.find((row) => row.role === def.locusRole)?.key;
}

export function mechanicsFromDefinition(def: CardDefinition): string[] {
  return def.effects.map((effect) => {
    if (effect.op === "APPLY_STATUS") {
      return effect.status ? `apply ${effect.status.toLowerCase()}` : "apply status";
    }
    if (effect.op === "REMOVE_STATUS") {
      return "cleanse";
    }
    if (effect.op === "GAIN_ENERGY") {
      return "gain energy";
    }
    if (effect.op === "GAIN_MOMENTUM") {
      return "gain momentum";
    }
    return effect.op.toLowerCase();
  });
}

export function hasApprovedCardArtDirection(cardKey: string, variant = CARD_ART_BASE_VARIANT): boolean {
  return Boolean(getCardArtDirection(cardKey, variant));
}
