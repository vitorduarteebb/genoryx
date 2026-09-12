import { createHash } from "node:crypto";
import { cardArtGenerationConfig, geneticCardArtConfig } from "@nexora/config";
import type { VisualImageProvider } from "@nexora/types";

export function sha256Hex(input: string | Buffer): string {
  return createHash("sha256").update(input).digest("hex");
}

export function resolveCardArtModel(): { model: string; snapshot: string } {
  const configured = process.env.OPENAI_CARD_ART_MODEL?.trim();
  const model = configured && configured.length > 0 ? configured : cardArtGenerationConfig.defaultModel;
  const snapshot = model.includes("-20") ? model : cardArtGenerationConfig.productionSnapshot;
  return { model, snapshot };
}

export function currentCardArtProvider(): VisualImageProvider {
  const explicit = process.env.CARD_ART_PROVIDER?.trim().toLowerCase();
  if (explicit === "openai") {
    return "OPENAI";
  }
  if (explicit === "mock") {
    return "MOCK";
  }
  if (process.env.NODE_ENV === "test") {
    return "MOCK";
  }
  return process.env.OPENAI_API_KEY ? "OPENAI" : "MOCK";
}

export const officialCardArtJobStatuses = ["READY", "PENDING", "GENERATING", "VALIDATING"] as const;

export function isOfficialReadyCardArt(
  asset: { status: string; provider?: string | null },
  provider: VisualImageProvider,
): boolean {
  return asset.status === "READY" && asset.provider === provider;
}

export function buildCardArtGenerationKey(input: {
  cardDefinitionId: string;
  variant: string;
  cardArtVersion?: number;
  artBibleVersion?: number;
  promptVersion?: number;
  modelSnapshot: string;
}): string {
  return sha256Hex(
    [
      input.cardDefinitionId,
      input.variant,
      String(input.cardArtVersion ?? cardArtGenerationConfig.cardArtVersion),
      String(input.artBibleVersion ?? cardArtGenerationConfig.artBibleVersion),
      String(input.promptVersion ?? cardArtGenerationConfig.promptVersion),
      input.modelSnapshot,
    ].join("|"),
  );
}

export function imageHashFromBytes(bytes: Buffer): string {
  return sha256Hex(bytes);
}

export function buildCreatureCardArtGenerationKey(input: {
  creatureId: string;
  manifestationId: string;
  canonicalVisualImageHash: string;
  lifeStage: string;
  cardArtVersion?: number;
  promptVersion?: number;
  modelSnapshot: string;
}): string {
  return sha256Hex(
    [
      input.creatureId,
      input.manifestationId,
      input.canonicalVisualImageHash,
      input.lifeStage,
      String(input.cardArtVersion ?? geneticCardArtConfig.cardArtVersion),
      String(input.promptVersion ?? geneticCardArtConfig.promptVersion),
      input.modelSnapshot,
    ].join("|"),
  );
}
