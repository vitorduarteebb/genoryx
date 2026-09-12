import { createHash } from "node:crypto";
import { visualGenerationConfig } from "@nexora/config";
import type { LifeStage, VisualImageProvider } from "@nexora/types";

export function sha256Hex(input: string | Buffer): string {
  return createHash("sha256").update(input).digest("hex");
}

export function resolveCreatureImageModel(): { model: string; snapshot: string } {
  const configured = process.env.OPENAI_CREATURE_IMAGE_MODEL?.trim();
  const model = configured && configured.length > 0 ? configured : visualGenerationConfig.defaultModel;
  const snapshot = model.includes("-20") ? model : visualGenerationConfig.productionSnapshot;
  return { model, snapshot };
}

export function isImageProviderOutage(message: string | null | undefined): boolean {
  const text = (message ?? "").toLowerCase();
  return (
    text.includes("no credits") ||
    text.includes("insufficient_quota") ||
    text.includes("exceeded your current quota") ||
    text.includes("billing") ||
    text.includes("rate limit")
  );
}

/** Alpha sem OpenAI: genética + chassi bastam. Testes continuam no MOCK worker. */
export function officialImageJobsEnabled(): boolean {
  if (process.env.NODE_ENV === "test") {
    return true;
  }
  if (process.env.SKIP_VISUAL_WORKER === "1") {
    return false;
  }
  const explicit = process.env.CREATURE_IMAGE_PROVIDER?.trim().toLowerCase();
  if (explicit === "mock") {
    return false;
  }
  return currentVisualProvider() === "OPENAI";
}

export function currentVisualProvider(): VisualImageProvider {
  const explicit = process.env.CREATURE_IMAGE_PROVIDER?.trim().toLowerCase();
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

export function buildGenerationKey(input: {
  creatureId: string;
  lifeStage: LifeStage;
  geneticHash?: string;
  visualSeed?: string;
  provider?: VisualImageProvider | string;
  visualGenomeVersion?: number;
  artBibleVersion?: number;
  promptVersion?: number;
  modelVersion: string;
}): string {
  return sha256Hex(
    [
      input.creatureId,
      input.lifeStage,
      input.geneticHash ?? "",
      input.visualSeed ?? "",
      String(input.visualGenomeVersion ?? visualGenerationConfig.visualGenomeVersion),
      String(input.artBibleVersion ?? visualGenerationConfig.artBibleVersion),
      String(input.promptVersion ?? visualGenerationConfig.promptVersion),
      (input.provider ?? "MOCK").toString().toUpperCase(),
      input.modelVersion,
    ].join("|"),
  );
}

export function imageHashFromBytes(bytes: Buffer): string {
  return sha256Hex(bytes);
}
