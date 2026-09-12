import { eggMaterialLexicon, eggPatternLexicon, eggShellLexicon, eggVisualGenerationConfig } from "@nexora/config";
import type { EggVisualGenome } from "./egg-visual";

export type EggVisualGenerationSpec = EggVisualGenome & {
  eggId: string;
  artBibleVersion: number;
  promptVersion: number;
};

export function eggSpecFromGenome(eggId: string, genome: EggVisualGenome): EggVisualGenerationSpec {
  return {
    ...genome,
    eggId,
    artBibleVersion: eggVisualGenerationConfig.artBibleVersion,
    promptVersion: eggVisualGenerationConfig.promptVersion,
  };
}

export function buildEggImagePrompt(spec: EggVisualGenerationSpec): string {
  return `Create the official GENORYX Genesis Egg for this breeding result.

This is a fantasy genetic creature egg.
Represent ONLY the egg.

GENETIC VISUAL HINTS:
shell shape: ${spec.shellShape}. ${eggShellLexicon[spec.shellShape]}
primary color: ${spec.primaryColor}
secondary color: ${spec.secondaryColor}
accent color: ${spec.accentColor}
surface pattern: ${spec.surfacePattern}. ${eggPatternLexicon[spec.surfacePattern]}
shell material: ${eggMaterialLexicon[spec.shellMaterialHint]}
elemental climate: ${spec.elementalHint}
aura: ${spec.auraHint === "none" ? "no extra aura, only material sheen" : spec.auraHint === "faint-genesis" ? "a faint ancestral genesis shimmer in the accent color, never text" : "an unstable inner shimmer, mysterious, unnamed"}
size class: ${spec.sizeClass}
collector grade atmosphere: ${spec.genesisGrade}
visual seed: ${spec.visualSeed} (tiny unique nuance only)

STYLE:
premium fantasy creature collector
futuristic genetic fantasy
mysterious
highly collectible
same GENORYX universe
dark sophisticated lighting, cyan and gold accents allowed, no hospital white

The egg should visually hint at its lineage without revealing the creature inside.

NO creature visible.
NO face, eyes, limbs, mouth or embryo.
NO text.
NO numbers.
NO UI.
NO logo.
NO card frame.
NO environment-heavy scene.
NO words like rarity, power, mutation or gene names.`;
}

export function eggPromptExposesSecrets(prompt: string): boolean {
  const upper = prompt.toUpperCase();
  return (
    upper.includes("RECESSIVE") ||
    upper.includes("CRYSTAL EYES") ||
    /\bGOLEM\b/.test(upper) ||
    upper.includes("NEW POWER") ||
    upper.includes("G1–G10") ||
    /G[1-9]\b/.test(upper) ||
    upper.includes("GENETICHASH")
  );
}
