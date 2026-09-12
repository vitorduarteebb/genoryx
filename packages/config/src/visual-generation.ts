export const visualGenerationConfig = {
  artBibleVersion: 2,
  visualGenomeVersion: 1,
  promptVersion: 5,
  defaultModel: "gpt-image-2",
  productionSnapshot: "gpt-image-2-2026-04-21",
  qaThreshold: 0.9,
  maxQaRetries: 3,
  maxJobAttempts: 5,
  retryDelaysMs: [60_000, 300_000, 900_000] as const,
  workerIntervalMs: 5_000,
  generationConcurrency: 2,
  backfillBatchSize: 24,
  imageSize: "1024x1024",
} as const;

export const meshyGenerationConfig = {
  defaultModel: "latest",
  targetFormat: "glb",
  shouldTexture: true,
  enablePbr: true,
  shouldRemesh: false,
  imageEnhancement: false,
  removeLighting: true,
  pollMs: 8_000,
  pollMaxAttempts: 90,
} as const;

export type GeneticPalette = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  eyeColor: string;
};

export const speciesPalettes: Record<string, GeneticPalette> = {
  pyron: { primaryColor: "#D4513C", secondaryColor: "#3A1C12", accentColor: "#F2C94C", eyeColor: "#FFB347" },
  nympha: { primaryColor: "#4EB8C8", secondaryColor: "#12323A", accentColor: "#87CFFF", eyeColor: "#E8FFFF" },
  florune: { primaryColor: "#5DBE6E", secondaryColor: "#1A2E18", accentColor: "#C6E87A", eyeColor: "#F4FFE8" },
  terranox: { primaryColor: "#C4A06A", secondaryColor: "#3A2A18", accentColor: "#8B6914", eyeColor: "#F2E6C0" },
  drakor: { primaryColor: "#B83228", secondaryColor: "#1C1010", accentColor: "#E8A23A", eyeColor: "#FFD36A" },
  aqualis: { primaryColor: "#2F6B8A", secondaryColor: "#0B1C28", accentColor: "#7FD0E8", eyeColor: "#C8F4FF" },
  voltaris: { primaryColor: "#E8C84A", secondaryColor: "#2A2410", accentColor: "#87CFFF", eyeColor: "#FFF4A8" },
  sparkyn: { primaryColor: "#C9A227", secondaryColor: "#1E1810", accentColor: "#F4E07A", eyeColor: "#FFF8C8" },
  grumak: { primaryColor: "#8A7A62", secondaryColor: "#2C2418", accentColor: "#D4C4A0", eyeColor: "#E8DCC0" },
  cryon: { primaryColor: "#A8D4E8", secondaryColor: "#1A2834", accentColor: "#E8F6FF", eyeColor: "#F4FCFF" },
  noctyr: { primaryColor: "#4A2A6A", secondaryColor: "#120818", accentColor: "#B48CFF", eyeColor: "#E0C8FF" },
  lumera: { primaryColor: "#F4E8B0", secondaryColor: "#3A3020", accentColor: "#FFF6C8", eyeColor: "#FFFCE8" },
};

export const visualTagLexicon: Record<string, string> = {
  EMBER_RIDGE_SUBTLE: "subtle ember-colored ridges along the shoulders, never replacing the genetic palette",
  WARM_CORE_GLOW: "a warm localized glow in the chest core, contained and small",
  VOID_DEPTH_HINT: "a faint deep-water darkness in recessed body cavities, not a full recolor",
  LIVING_GROWTH_MARKS: "small living plant-like markings on plates or skin, following the pattern gene",
  SUBTLE_ELECTRIC_MARKINGS: "very faint electric filaments along existing pattern lines",
};

export function paletteForSpecies(speciesKey: string): GeneticPalette {
  return speciesPalettes[speciesKey] ?? speciesPalettes.pyron;
}
