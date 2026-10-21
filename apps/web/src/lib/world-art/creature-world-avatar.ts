import * as T from "three";
import { groundPixelOffset, paintGroundShadow } from "./sprite-contact";
import { worldDisplayScale, worldGroundAnchor, worldQualityPresets } from "@nexora/config";
import { visualIdentity, type CreatureVisualInput } from "../creature-visual-contract";
import { CreatureVisualController } from "../creature-visual-controller";
import { DIRS, dirAngle, type IsoDir } from "../iso/projection";
import { clampWorldCreatureScale, worldDisplayScaleForStage } from "./scale";
import { detectWorldQuality } from "./quality";

export type WorldAvatarLod = "near" | "medium" | "far";
export type WorldAvatarStatus = "READY" | "WORLD_AVATAR_PENDING";

export type WorldAvatarManifest = {
  directions: typeof DIRS;
  animations: Array<"IDLE" | "WALK" | "RUN">;
  frameCount: { idle: number; walk: number; run: number };
  fps: number;
  pivot: { x: number; y: number };
  groundAnchor: { x: number; y: number };
  bounds: { w: number; h: number };
  scale: number;
  version: 2;
  lod: WorldAvatarLod;
  status: WorldAvatarStatus;
};

export type CreatureWorldAvatar = {
  id: string;
  width: number;
  height: number;
  frames: Record<IsoDir, { idle: HTMLCanvasElement[]; walk: HTMLCanvasElement[]; run: HTMLCanvasElement[] }>;
  source: "sprite-atlas" | "fallback";
  manifest: WorldAvatarManifest;
};

const cache = new Map<string, CreatureWorldAvatar>();

function sheet(width: number, height: number) {
  const node = document.createElement("canvas");
  node.width = width;
  node.height = height;
  return node;
}

function paintContactShadow(ctx: CanvasRenderingContext2D, width: number, height: number) {
  paintGroundShadow(ctx,width*worldGroundAnchor.creature.x,height*worldGroundAnchor.creature.y,width*.18,height*.045);
}

function fallbackAvatar(id: string, tint: string, size: number, scale: number): CreatureWorldAvatar {
  const frames = {} as CreatureWorldAvatar["frames"];
  for (const dir of DIRS) {
    const idle = [0, 1, 2].map((frame) => {
      const node = sheet(size, size);
      const ctx = node.getContext("2d");
      if (!ctx) return node;
      paintContactShadow(ctx, size, size);
      const breath = Math.sin(frame) * 1.6;
      ctx.fillStyle = tint;
      ctx.beginPath();
      ctx.ellipse(size * 0.5, size * .9 - 26 + breath*.2, 20, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#111";
      ctx.fillRect(size * 0.42, size * 0.46, 5, 5);
      ctx.fillRect(size * 0.54, size * 0.46, 5, 5);
      return node;
    });
    frames[dir] = { idle, walk: idle, run: idle };
  }
  return {
    id,
    width: size,
    height: size,
    frames,
    source: "fallback",
    manifest: {
      directions: DIRS,
      animations: ["IDLE", "WALK"],
      frameCount: { idle: 3, walk: 3, run: 0 },
      fps: 8,
      pivot: worldGroundAnchor.creature,
      groundAnchor: worldGroundAnchor.creature,
      bounds: { w: size, h: size },
      scale,
      version: 2,
      lod: "far",
      status: "WORLD_AVATAR_PENDING",
    },
  };
}

function lodSize(lod: WorldAvatarLod) {
  if (lod === "near") return 160;
  if (lod === "medium") return 112;
  return 80;
}

/**
 * Bakes a directional world avatar from the real 3D CreatureAssembler output.
 * Does not alter genome, chassis, or battle scale.
 */
export async function bakeCreatureWorldAvatar(input: CreatureVisualInput, lod?: WorldAvatarLod): Promise<CreatureWorldAvatar> {
  const quality = worldQualityPresets[detectWorldQuality()];
  const resolvedLod = lod ?? quality.avatarLod;
  const size = lodSize(resolvedLod);
  const scale = clampWorldCreatureScale(worldDisplayScaleForStage(input.lifeStage));
  const id = `${visualIdentity({ ...input, context: "WORLD" })}::${resolvedLod}`;
  const hit = cache.get(id);
  if (hit) return hit;

  let controller: CreatureVisualController | undefined;
  let renderer: T.WebGLRenderer | undefined;
  try {
    controller = await CreatureVisualController.create({
      ...input,
      context: "WORLD",
      reducedMotion: false,
    });
    renderer = new T.WebGLRenderer({
      alpha: true,
      antialias: resolvedLod !== "far",
      preserveDrawingBuffer: true,
      powerPreference: "low-power",
    });
    renderer.setSize(size, size, false);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
    const scene = new T.Scene();
    scene.add(new T.HemisphereLight(0xfff4e4, 0x243040, 1.55));
    const key = new T.DirectionalLight(0xfff1dd, 2.3);
    key.position.set(-1.6, 3.2, 3.4);
    scene.add(key);
    const fill = new T.DirectionalLight(0x7aa0c4, 0.7);
    fill.position.set(2.4, 1.2, -1.6);
    scene.add(fill);
    scene.add(controller.actor);
    const camera = new T.OrthographicCamera(-1.1, 1.1, 1.1, -1.1, 0.05, 24);
    const box = controller.bounds;
    const tall = Math.max(0.7, box.getSize(new T.Vector3()).y);
    const dist = tall * 2.2;
    camera.position.set(dist * 0.72, tall * 0.78, dist * 0.72);
    camera.lookAt(0, tall * 0.32, 0);

    const idleCount = resolvedLod === "far" ? 2 : 4;
    const walkCount = resolvedLod === "far" ? 2 : 6;
    const runCount = resolvedLod === "near" ? 4 : 0;
    const frames = {} as CreatureWorldAvatar["frames"];

    for (const dir of DIRS) {
      controller.actor.rotation.y = dirAngle(dir);
      const idle: HTMLCanvasElement[] = [];
      const walk: HTMLCanvasElement[] = [];
      const run: HTMLCanvasElement[] = [];
      controller.play("IDLE");
      for (let i = 0; i < idleCount; i++) {
        controller.update(0.28);
        renderer.render(scene, camera);
        const node = sheet(size, size);
        const ctx = node.getContext("2d");
        paintContactShadow(ctx!, size, size);
        const offset=groundPixelOffset(camera,size,size,worldGroundAnchor.creature);
        ctx?.drawImage(renderer.domElement, offset.x, offset.y);
        idle.push(node);
      }
      controller.play("WALK");
      for (let i = 0; i < walkCount; i++) {
        controller.update((controller.clips.get("GXR_Walk")?.duration ?? .8)/walkCount);
        renderer.render(scene, camera);
        const node = sheet(size, size);
        const ctx = node.getContext("2d");
        paintContactShadow(ctx!, size, size);
        const offset=groundPixelOffset(camera,size,size,worldGroundAnchor.creature);
        ctx?.drawImage(renderer.domElement, offset.x, offset.y);
        walk.push(node);
      }
      if (runCount) {
        controller.play("RUN");
        for (let i = 0; i < runCount; i++) {
          controller.update((controller.clips.get("GXR_Run")?.duration ?? .6)/runCount);
          renderer.render(scene, camera);
          const node = sheet(size, size);
          const ctx = node.getContext("2d");
          paintContactShadow(ctx!, size, size);
          const offset=groundPixelOffset(camera,size,size,worldGroundAnchor.creature);
        ctx?.drawImage(renderer.domElement, offset.x, offset.y);
          run.push(node);
        }
      }
      frames[dir] = { idle, walk, run };
    }

    const avatar: CreatureWorldAvatar = {
      id,
      width: size,
      height: size,
      frames,
      source: "sprite-atlas",
      manifest: {
        directions: DIRS,
        animations: runCount ? ["IDLE", "WALK", "RUN"] : ["IDLE", "WALK"],
        frameCount: { idle: idleCount, walk: walkCount, run: runCount },
        fps: quality.creatureFps,
        pivot: worldGroundAnchor.creature,
        groundAnchor: worldGroundAnchor.creature,
        bounds: { w: size, h: size },
        scale,
        version: 2,
        lod: resolvedLod,
        status: "READY",
      },
    };
    cache.set(id, avatar);
    return avatar;
  } catch {
    const tint = input.element === "NATURE" ? "#3d8a48" : input.element === "FIRE" ? "#d45a24" : "#5aa0b4";
    const avatar = fallbackAvatar(id, tint, Math.max(96, worldDisplayScale.playerPx.min), scale);
    cache.set(id, avatar);
    return avatar;
  } finally {
    controller?.dispose();
    renderer?.dispose();
    renderer?.domElement.remove();
  }
}

/** Compatible wrapper so World Engineer can swap `iso/avatar.bakeWorldAvatar`. */
export async function bakeWorldAvatar(input: CreatureVisualInput) {
  const baked = await bakeCreatureWorldAvatar(input);
  const frames = {} as Record<IsoDir, { idle: HTMLCanvasElement[]; walk: HTMLCanvasElement[] }>;
  for (const dir of DIRS) {
    frames[dir] = { idle: baked.frames[dir].idle, walk: baked.frames[dir].walk };
  }
  return { id: baked.id, width: baked.width, height: baked.height, frames, source: baked.source };
}
