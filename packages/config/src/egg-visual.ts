import { visualGenerationConfig } from "./visual-generation";

export const eggVisualGenerationConfig = {
  artBibleVersion: visualGenerationConfig.artBibleVersion,
  visualGenomeVersion: 1,
  promptVersion: 1,
  defaultModel: visualGenerationConfig.defaultModel,
  productionSnapshot: visualGenerationConfig.productionSnapshot,
  imageSize: visualGenerationConfig.imageSize,
  workerIntervalMs: 5_000,
  maxJobAttempts: 5,
  retryDelaysMs: [60_000, 300_000, 900_000] as const,
} as const;

export const eggShellLexicon = {
  OVOID: "a classic collectible ovoid egg silhouette, smooth and precious",
  PLATED: "an egg whose shell is broken into subtle mineral plates, never a creature body",
  ORGANIC: "an organic living egg shell with soft botanical ridges, still clearly an egg",
  CRYSTALLINE: "an egg with faint crystalline facets embedded in the shell, no eyes or face",
  RIDGED: "an egg with gentle tectonic ridges, like compressed earth, still ovoid",
} as const;

export const eggPatternLexicon = {
  SMOOTH: "almost unmarked shell, luxury collector finish",
  VEINS: "thin living veins under the shell, like sap or mineral ore",
  PLATES: "subtle overlapping plates, never armor on a body",
  MOSS: "soft moss-like film in recesses only",
  CRACKLE: "fine crackle glaze, not hatching cracks of a creature",
  MARBLE: "marble-like color flow, no text or symbols",
} as const;

export const eggMaterialLexicon = {
  "stone-organic": "stone that feels slightly alive, matte mineral with organic warmth",
  "living-bark": "bark-like living shell, never a tree or a creature",
  "crystal-dust": "shell dusted with tiny crystals, no gemstone creature",
  "smooth-enamel": "enamelled collector shell, dark luxury finish",
  "wet-mineral": "damp mineral glaze, river-stone sheen",
} as const;

export function eggAiArtEnabled(): boolean {
  const explicit = process.env.EGG_AI_ART?.trim().toLowerCase();
  if (explicit === "false" || explicit === "0" || explicit === "mock") {
    return false;
  }
  if (explicit === "true" || explicit === "1" || explicit === "openai") {
    return true;
  }
  if (process.env.NODE_ENV === "test") {
    return false;
  }
  return Boolean(process.env.OPENAI_API_KEY);
}
