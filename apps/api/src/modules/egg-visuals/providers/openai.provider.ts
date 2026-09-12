import { eggVisualGenerationConfig } from "@nexora/config";
import { resolveCreatureImageModel } from "../../creature-visuals/generation-key";
import { sanitizeOpenAiError } from "../../creature-visuals/providers/openai.provider";
import type { EggImageProvider, GeneratedEggImage } from "./types";

const OPENAI_IMAGES = "https://api.openai.com/v1/images/generations";

function requireKey(): string {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error("OPENAI_API_KEY ausente no backend.");
  }
  return key;
}

function decodeImagePayload(payload: unknown): Buffer {
  const data = payload as { data?: Array<{ b64_json?: string }>; error?: { message?: string } };
  if (data.error?.message) {
    throw new Error(sanitizeOpenAiError(data.error.message));
  }
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("OpenAI não devolveu b64_json.");
  }
  return Buffer.from(b64, "base64");
}

export class OpenAIEggImageProvider implements EggImageProvider {
  async generateEgg(prompt: string): Promise<GeneratedEggImage> {
    const { model, snapshot } = resolveCreatureImageModel();
    const response = await fetch(OPENAI_IMAGES, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${requireKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt,
        size: eggVisualGenerationConfig.imageSize,
        n: 1,
        output_format: "png",
      }),
      signal: AbortSignal.timeout(120_000),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = (payload as { error?: { message?: string } }).error?.message ?? `OpenAI HTTP ${response.status}`;
      throw new Error(sanitizeOpenAiError(message));
    }
    return {
      bytes: decodeImagePayload(payload),
      mimeType: "image/png",
      model,
      modelSnapshot: snapshot,
    };
  }
}
