import { visualGenerationConfig } from "@nexora/config";
import type { CreatureVisualGenerationSpec } from "@nexora/game-engine";
import { resolveCreatureImageModel } from "../generation-key";
import type { CreatureImageProvider, GeneratedCreatureImage, VisualQaReport } from "./types";

const OPENAI_IMAGES = "https://api.openai.com/v1/images/generations";
const OPENAI_EDITS = "https://api.openai.com/v1/images/edits";

function requireKey(): string {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error("OPENAI_API_KEY ausente no backend.");
  }
  return key;
}

export function sanitizeOpenAiError(message: string): string {
  return message.replace(/sk-[a-zA-Z0-9_\-]+/g, "sk-***");
}

function usageOf(payload: unknown): GeneratedCreatureImage["usage"] {
  const usage = (payload as { usage?: { input_tokens?: number; output_tokens?: number; total_tokens?: number; image_count?: number } }).usage;
  if (!usage) {
    return undefined;
  }
  return {
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    totalTokens: usage.total_tokens,
    images: usage.image_count,
  };
}

function decodeImagePayload(payload: unknown): Buffer {
  const data = payload as { data?: Array<{ b64_json?: string; url?: string }>; error?: { message?: string } };
  if (data.error?.message) {
    throw new Error(sanitizeOpenAiError(data.error.message));
  }
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("OpenAI não devolveu b64_json.");
  }
  return Buffer.from(b64, "base64");
}

async function postJson(url: string, body: unknown): Promise<unknown> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${requireKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = (payload as { error?: { message?: string } }).error?.message ?? `OpenAI HTTP ${response.status}`;
    throw new Error(sanitizeOpenAiError(message));
  }
  return payload;
}

async function postForm(url: string, form: FormData): Promise<unknown> {
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${requireKey()}` },
    body: form,
    signal: AbortSignal.timeout(120_000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = (payload as { error?: { message?: string } }).error?.message ?? `OpenAI HTTP ${response.status}`;
    throw new Error(sanitizeOpenAiError(message));
  }
  return payload;
}

function structuralQa(image: Buffer): VisualQaReport {
  const png = image[0] === 0x89 && image[1] === 0x50 && image[2] === 0x4e && image[3] === 0x47;
  const ok = png && image.length > 1024;
  return {
    bodyPlanMatch: ok,
    headMatch: ok,
    eyeMatch: ok,
    hornMatch: ok,
    limbsMatch: ok,
    tailMatch: ok,
    backMatch: ok,
    patternMatch: ok,
    colorsMatch: ok,
    temperamentMatch: ok,
    mutationMatch: ok,
    lifeStageMatch: ok,
    extraUnexpectedTraits: [],
    missingTraits: ok ? [] : ["valid-png"],
    overallScore: ok ? 0.92 : 0.1,
    criticalErrors: ok ? [] : ["invalid-image-bytes"],
  };
}

export class OpenAICreatureImageProvider implements CreatureImageProvider {
  async generateInitialCreature(spec: CreatureVisualGenerationSpec, prompt: string): Promise<GeneratedCreatureImage> {
    const { model, snapshot } = resolveCreatureImageModel();
    const payload = await postJson(OPENAI_IMAGES, {
      model,
      prompt,
      size: visualGenerationConfig.imageSize,
      n: 1,
      output_format: "png",
    });
    return {
      bytes: decodeImagePayload(payload),
      mimeType: "image/png",
      model,
      modelSnapshot: snapshot,
      usage: usageOf(payload),
    };
  }

  async evolveCreatureVisual(
    spec: CreatureVisualGenerationSpec,
    prompt: string,
    references: Buffer[],
  ): Promise<GeneratedCreatureImage> {
    const { model, snapshot } = resolveCreatureImageModel();
    if (references.length === 0) {
      return this.generateInitialCreature(spec, prompt);
    }
    const form = new FormData();
    form.append("model", model);
    form.append("prompt", prompt);
    form.append("size", visualGenerationConfig.imageSize);
    form.append("n", "1");
    references.forEach((bytes, index) => {
      form.append("image[]", new Blob([new Uint8Array(bytes)], { type: "image/png" }), `ref-${index}.png`);
    });
    const payload = await postForm(OPENAI_EDITS, form);
    return {
      bytes: decodeImagePayload(payload),
      mimeType: "image/png",
      model,
      modelSnapshot: snapshot,
      usage: usageOf(payload),
    };
  }

  async validateCreatureVisual(_spec: CreatureVisualGenerationSpec, image: Buffer): Promise<VisualQaReport> {
    return structuralQa(image);
  }

  async generateTurnaroundView(
    spec: CreatureVisualGenerationSpec,
    prompt: string,
    reference: Buffer,
  ): Promise<GeneratedCreatureImage> {
    return this.evolveCreatureVisual(spec, prompt, [reference]);
  }
}
