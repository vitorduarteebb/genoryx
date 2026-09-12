import { meshyGenerationConfig } from "@nexora/config";
import { sanitizeMeshyError } from "../creature-models/meshy.client";

const TEXT_TO_3D = "https://api.meshy.ai/openapi/v2/text-to-3d";
const IMAGE_TO_3D = "https://api.meshy.ai/openapi/v1/image-to-3d";
const REMESH = "https://api.meshy.ai/openapi/v1/remesh";
const RIGGING = "https://api.meshy.ai/openapi/v1/rigging";
const ANIMATIONS = "https://api.meshy.ai/openapi/v1/animations";

function requireKey(): string {
  const key = process.env.MESHY_API_KEY?.trim();
  if (!key) {
    throw new Error("MESHY_API_KEY ausente. Defina no environment / .env — nunca no código.");
  }
  return key;
}

export type MeshyStatus = "PENDING" | "IN_PROGRESS" | "SUCCEEDED" | "FAILED" | "CANCELED";

export type MeshyTaskBase = {
  id?: string;
  result?: string | Record<string, unknown>;
  status?: MeshyStatus;
  progress?: number;
  consumed_credits?: number;
  task_error?: { message?: string };
  thumbnail_url?: string;
  model_urls?: { glb?: string; fbx?: string };
};

export type MeshyRigResult = {
  rigged_character_glb_url?: string;
  rigged_character_fbx_url?: string;
  basic_animations?: {
    walking_glb_url?: string;
    walking_fbx_url?: string;
    running_glb_url?: string;
    running_fbx_url?: string;
  };
};

export type MeshyAnimationResult = {
  animation_glb_url?: string;
  animation_fbx_url?: string;
};

async function meshyFetch(url: string, init?: RequestInit): Promise<MeshyTaskBase> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${requireKey()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    signal: init?.signal ?? AbortSignal.timeout(60_000),
  });
  const payload = (await response.json().catch(() => ({}))) as MeshyTaskBase;
  if (!response.ok) {
    throw new Error(sanitizeMeshyError(payload.task_error?.message ?? `Meshy HTTP ${response.status}`));
  }
  return payload;
}

function taskId(payload: MeshyTaskBase): string {
  if (typeof payload.result === "string" && payload.result) {
    return payload.result;
  }
  if (payload.id) {
    return payload.id;
  }
  throw new Error("Meshy não devolveu task id.");
}

export class MeshyHumanoidClient {
  async createPreview(
    prompt: string,
    options?: { poseMode?: "a-pose" | "t-pose" | ""; targetPolycount?: number },
  ): Promise<string> {
    const payload = await meshyFetch(TEXT_TO_3D, {
      method: "POST",
      body: JSON.stringify({
        mode: "preview",
        prompt,
        ai_model: process.env.MESHY_AI_MODEL?.trim() || meshyGenerationConfig.defaultModel,
        should_remesh: true,
        topology: "triangle",
        target_polycount: options?.targetPolycount ?? 30_000,
        pose_mode: options?.poseMode ?? "a-pose",
        target_formats: ["glb"],
        auto_size: true,
        origin_at: "bottom",
      }),
    });
    return taskId(payload);
  }

  async createRefine(previewTaskId: string, texturePrompt: string): Promise<string> {
    const payload = await meshyFetch(TEXT_TO_3D, {
      method: "POST",
      body: JSON.stringify({
        mode: "refine",
        preview_task_id: previewTaskId,
        enable_pbr: true,
        texture_resolution: "2k",
        texture_prompt: texturePrompt,
        ai_model: process.env.MESHY_AI_MODEL?.trim() || meshyGenerationConfig.defaultModel,
        target_formats: ["glb"],
        auto_size: true,
        origin_at: "bottom",
      }),
    });
    return taskId(payload);
  }

  async createFromImage(imageUrl: string, options?: { targetPolycount?: number }): Promise<string> {
    const payload = await meshyFetch(IMAGE_TO_3D, {
      method: "POST",
      body: JSON.stringify({
        image_url: imageUrl,
        ai_model: process.env.MESHY_AI_MODEL?.trim() || meshyGenerationConfig.defaultModel,
        should_texture: true,
        enable_pbr: true,
        should_remesh: true,
        target_polycount: options?.targetPolycount ?? 12_000,
        target_formats: ["glb"],
      }),
    });
    return taskId(payload);
  }

  getImageTo3d(id: string) {
    return meshyFetch(`${IMAGE_TO_3D}/${id}`);
  }

  async createRemesh(inputTaskId: string): Promise<string> {
    const payload = await meshyFetch(REMESH, {
      method: "POST",
      body: JSON.stringify({
        input_task_id: inputTaskId,
        target_formats: ["glb"],
        topology: "triangle",
        target_polycount: 30_000,
      }),
    });
    return taskId(payload);
  }

  async createRig(inputTaskId: string, heightMeters = 1.8): Promise<string> {
    const payload = await meshyFetch(RIGGING, {
      method: "POST",
      body: JSON.stringify({
        input_task_id: inputTaskId,
        height_meters: heightMeters,
      }),
    });
    return taskId(payload);
  }

  async createAnimation(rigTaskId: string, actionId: number): Promise<string> {
    const payload = await meshyFetch(ANIMATIONS, {
      method: "POST",
      body: JSON.stringify({
        rig_task_id: rigTaskId,
        action_id: actionId,
      }),
    });
    return taskId(payload);
  }

  getTextTo3d(id: string) {
    return meshyFetch(`${TEXT_TO_3D}/${id}`);
  }

  getRemesh(id: string) {
    return meshyFetch(`${REMESH}/${id}`);
  }

  getRig(id: string) {
    return meshyFetch(`${RIGGING}/${id}`);
  }

  getAnimation(id: string) {
    return meshyFetch(`${ANIMATIONS}/${id}`);
  }

  async wait<T extends MeshyTaskBase>(load: () => Promise<T>, label: string): Promise<T> {
    for (let attempt = 0; attempt < meshyGenerationConfig.pollMaxAttempts; attempt += 1) {
      const task = await load();
      if (task.status === "SUCCEEDED") {
        return task;
      }
      if (task.status === "FAILED" || task.status === "CANCELED") {
        throw new Error(sanitizeMeshyError(task.task_error?.message ?? `Meshy ${label} ${task.status}`));
      }
      const progress = task.progress ?? 0;
      console.log(`[meshy] ${label} ${task.status ?? "PENDING"} ${progress}%`);
      await new Promise((resolve) => setTimeout(resolve, meshyGenerationConfig.pollMs));
    }
    throw new Error(`Meshy excedeu o tempo de espera: ${label}`);
  }

  async download(url: string): Promise<Buffer> {
    const file = await fetch(url, { signal: AbortSignal.timeout(180_000) });
    if (!file.ok) {
      throw new Error(`Download HTTP ${file.status}`);
    }
    return Buffer.from(await file.arrayBuffer());
  }
}
