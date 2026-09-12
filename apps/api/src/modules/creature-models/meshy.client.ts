import { meshyGenerationConfig } from "@nexora/config";

const MESHY_CREATE = "https://api.meshy.ai/openapi/v1/multi-image-to-3d";

export function sanitizeMeshyError(message: string): string {
  return message.replace(/msy_[a-zA-Z0-9_\-]+/g, "msy-***").replace(/Bearer\s+\S+/gi, "Bearer ***");
}

function requireKey(): string {
  const key = process.env.MESHY_API_KEY?.trim();
  if (!key) {
    throw new Error("MESHY_API_KEY ausente no backend.");
  }
  return key;
}

function toDataUri(bytes: Buffer): string {
  return `data:image/png;base64,${bytes.toString("base64")}`;
}

export type MeshyTask = {
  id?: string;
  result?: string;
  status?: string;
  progress?: number;
  model_urls?: { glb?: string };
  task_error?: { message?: string };
};

export class MeshyMultiImageClient {
  async createFromViews(views: Buffer[]): Promise<string> {
    const imageUrls = views.map(toDataUri);
    const response = await fetch(MESHY_CREATE, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${requireKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_urls: imageUrls,
        texture_image_urls: imageUrls,
        ai_model: process.env.MESHY_AI_MODEL?.trim() || meshyGenerationConfig.defaultModel,
        should_texture: meshyGenerationConfig.shouldTexture,
        enable_pbr: meshyGenerationConfig.enablePbr,
        should_remesh: meshyGenerationConfig.shouldRemesh,
        image_enhancement: meshyGenerationConfig.imageEnhancement,
        remove_lighting: meshyGenerationConfig.removeLighting,
        target_formats: [meshyGenerationConfig.targetFormat],
      }),
      signal: AbortSignal.timeout(60_000),
    });
    const payload = (await response.json().catch(() => ({}))) as MeshyTask;
    if (!response.ok) {
      throw new Error(sanitizeMeshyError(payload.task_error?.message ?? `Meshy HTTP ${response.status}`));
    }
    const id = payload.result ?? payload.id;
    if (!id) {
      throw new Error("Meshy não devolveu task id.");
    }
    return id;
  }

  async getTask(taskId: string): Promise<MeshyTask> {
    const response = await fetch(`${MESHY_CREATE}/${taskId}`, {
      headers: { Authorization: `Bearer ${requireKey()}` },
      signal: AbortSignal.timeout(30_000),
    });
    const payload = (await response.json().catch(() => ({}))) as MeshyTask;
    if (!response.ok) {
      throw new Error(sanitizeMeshyError(payload.task_error?.message ?? `Meshy HTTP ${response.status}`));
    }
    return payload;
  }

  async waitForGlb(taskId: string): Promise<{ bytes: Buffer; taskId: string }> {
    for (let attempt = 0; attempt < meshyGenerationConfig.pollMaxAttempts; attempt += 1) {
      const task = await this.getTask(taskId);
      if (task.status === "SUCCEEDED" && task.model_urls?.glb) {
        const file = await fetch(task.model_urls.glb, { signal: AbortSignal.timeout(120_000) });
        if (!file.ok) {
          throw new Error(`Download GLB HTTP ${file.status}`);
        }
        return { bytes: Buffer.from(await file.arrayBuffer()), taskId };
      }
      if (task.status === "FAILED" || task.status === "CANCELED") {
        throw new Error(sanitizeMeshyError(task.task_error?.message ?? `Meshy ${task.status}`));
      }
      await new Promise((resolve) => setTimeout(resolve, meshyGenerationConfig.pollMs));
    }
    throw new Error("Meshy excedeu o tempo de espera do GLB.");
  }
}
