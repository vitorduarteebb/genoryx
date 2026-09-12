import type { CardArtGenerationSpec } from "@nexora/game-engine";

export type ImageUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  images?: number;
};

export type GeneratedCardArt = {
  bytes: Buffer;
  mimeType: "image/png";
  model: string;
  modelSnapshot: string;
  usage?: ImageUsage;
};

export type CardArtQaReport = {
  validImage: boolean;
  noSignificantText: boolean;
  noCardFrame: boolean;
  elementCoherent: boolean;
  conceptCoherent: boolean;
  styleMatch: boolean;
  extraUnexpectedTraits: string[];
  missingTraits: string[];
  overallScore: number;
  criticalErrors: string[];
};

export interface CardArtProvider {
  generateCardArt(spec: CardArtGenerationSpec, prompt: string, references?: Buffer[]): Promise<GeneratedCardArt>;
  validateCardArt(spec: CardArtGenerationSpec, image: Buffer): Promise<CardArtQaReport>;
}
