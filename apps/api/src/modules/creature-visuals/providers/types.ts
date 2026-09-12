import type { CreatureVisualGenerationSpec } from "@nexora/game-engine";

export type ImageUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  images?: number;
};

export type GeneratedCreatureImage = {
  bytes: Buffer;
  mimeType: "image/png";
  model: string;
  modelSnapshot: string;
  usage?: ImageUsage;
};

export type VisualQaReport = {
  bodyPlanMatch: boolean;
  headMatch: boolean;
  eyeMatch: boolean;
  hornMatch: boolean;
  limbsMatch: boolean;
  tailMatch: boolean;
  backMatch: boolean;
  patternMatch: boolean;
  colorsMatch: boolean;
  temperamentMatch: boolean;
  mutationMatch: boolean;
  lifeStageMatch: boolean;
  extraUnexpectedTraits: string[];
  missingTraits: string[];
  overallScore: number;
  criticalErrors: string[];
};

export interface CreatureImageProvider {
  generateInitialCreature(spec: CreatureVisualGenerationSpec, prompt: string): Promise<GeneratedCreatureImage>;
  evolveCreatureVisual(
    spec: CreatureVisualGenerationSpec,
    prompt: string,
    references: Buffer[],
  ): Promise<GeneratedCreatureImage>;
  validateCreatureVisual(spec: CreatureVisualGenerationSpec, image: Buffer): Promise<VisualQaReport>;
}
