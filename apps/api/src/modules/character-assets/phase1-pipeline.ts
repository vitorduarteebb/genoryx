import { access } from "node:fs/promises";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { meshyCharacterConfig } from "@nexora/config";
import { defaultManifestPath, findAsset, loadManifest, saveManifest, upsertAsset } from "./manifest";
import {
  MeshyHumanoidClient,
  type MeshyAnimationResult,
  type MeshyRigResult,
  type MeshyTaskBase,
} from "./meshy-humanoid.client";
import { PHASE1_TAMER_PROMPT, PHASE1_TAMER_TEXTURE_PROMPT } from "./prompts";

export const PHASE1_ASSET_ID = "phase1_tamer";

export type Phase1Paths = {
  repoRoot: string;
  streaming: string;
  editor: string;
  manifest: string;
};

export function phase1Paths(repoRoot: string): Phase1Paths {
  return {
    repoRoot,
    streaming: join(repoRoot, "apps/unity-game/Assets/StreamingAssets/GENORYX/Characters/phase1"),
    editor: join(repoRoot, "apps/unity-game/Assets/GENORYX/Characters/Phase1"),
    manifest: defaultManifestPath(repoRoot),
  };
}

async function exists(path: string) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function writeBoth(paths: Phase1Paths, fileName: string, bytes: Buffer) {
  const streamingFile = join(paths.streaming, fileName);
  const editorFile = join(paths.editor, fileName);
  await mkdir(dirname(streamingFile), { recursive: true });
  await mkdir(dirname(editorFile), { recursive: true });
  await writeFile(streamingFile, bytes);
  await writeFile(editorFile, bytes);
  return { streamingFile, editorFile };
}

function rigResult(task: MeshyTaskBase): MeshyRigResult {
  return (typeof task.result === "object" && task.result ? task.result : {}) as MeshyRigResult;
}

function animResult(task: MeshyTaskBase): MeshyAnimationResult {
  return (typeof task.result === "object" && task.result ? task.result : {}) as MeshyAnimationResult;
}

export async function runPhase1Pipeline(repoRoot: string) {
  const paths = phase1Paths(repoRoot);
  const manifest = await loadManifest(paths.manifest);
  const existing = findAsset(manifest, PHASE1_ASSET_ID);
  const rigged = join(paths.streaming, "tamer.rigged.glb");
  const walk = join(paths.streaming, "anim.walk.glb");
  const run = join(paths.streaming, "anim.run.glb");

  if (existing?.status === "SUCCEEDED" && (await exists(rigged)) && (await exists(walk)) && (await exists(run))) {
    console.log("[phase1] asset válido já existe — skip (não gasta crédito).");
    return { skipped: true, manifest, credits: existing.consumedCredits ?? 0 };
  }

  const client = new MeshyHumanoidClient();
  let credits = 0;

  const previewId =
    (typeof existing?.extra?.previewTaskId === "string" && existing.extra.previewTaskId) ||
    (await client.createPreview(PHASE1_TAMER_PROMPT));
  const preview = await client.wait(() => client.getTextTo3d(previewId), "preview");
  credits += preview.consumed_credits ?? 0;
  if (preview.thumbnail_url) {
    const thumb = await client.download(preview.thumbnail_url);
    await writeBoth(paths, "tamer.preview.png", thumb);
  }

  const refineId =
    (typeof existing?.extra?.refineTaskId === "string" && existing.extra.refineTaskId) ||
    (await client.createRefine(previewId, PHASE1_TAMER_TEXTURE_PROMPT));
  const refine = await client.wait(() => client.getTextTo3d(refineId), "refine");
  credits += refine.consumed_credits ?? 0;
  if (refine.model_urls?.glb) {
    await writeBoth(paths, "tamer.refine.glb", await client.download(refine.model_urls.glb));
  }
  if (refine.thumbnail_url) {
    const thumb = await client.download(refine.thumbnail_url);
    await writeBoth(paths, "tamer.refine.png", thumb);
    const webPreview = join(paths.repoRoot, "apps/web/public/game/characters/phase1-tamer.png");
    await mkdir(dirname(webPreview), { recursive: true });
    await writeFile(webPreview, thumb);
  }

  let rigSourceId = refineId;
  if ((refine as MeshyTaskBase & { face_count?: number }).face_count &&
      Number((refine as MeshyTaskBase & { face_count?: number }).face_count) > meshyCharacterConfig.remeshIfFacesAbove) {
    const remeshId = await client.createRemesh(refineId);
    const remesh = await client.wait(() => client.getRemesh(remeshId), "remesh");
    credits += remesh.consumed_credits ?? 0;
    rigSourceId = remeshId;
  }

  const rigId =
    (typeof existing?.extra?.rigTaskId === "string" && existing.extra.rigTaskId) ||
    (await client.createRig(rigSourceId, meshyCharacterConfig.heightMeters));
  const rig = await client.wait(() => client.getRig(rigId), "rig");
  credits += rig.consumed_credits ?? 0;
  const riggedUrls = rigResult(rig);
  if (!riggedUrls.rigged_character_glb_url) {
    throw new Error("Rig Meshy SUCCEEDED sem rigged_character_glb_url.");
  }
  await writeBoth(paths, "tamer.rigged.glb", await client.download(riggedUrls.rigged_character_glb_url));
  if (riggedUrls.rigged_character_fbx_url) {
    await writeBoth(paths, "tamer.rigged.fbx", await client.download(riggedUrls.rigged_character_fbx_url));
  }
  if (!riggedUrls.basic_animations?.walking_glb_url || !riggedUrls.basic_animations.running_glb_url) {
    throw new Error("Rig Meshy não devolveu walking/running GLB.");
  }
  await writeBoth(paths, "anim.walk.glb", await client.download(riggedUrls.basic_animations.walking_glb_url));
  await writeBoth(paths, "anim.run.glb", await client.download(riggedUrls.basic_animations.running_glb_url));

  const extraActions: Array<{ name: string; actionId: number; file: string }> = [
    { name: "idle", actionId: meshyCharacterConfig.idleActionId, file: "anim.idle.glb" },
  ];
  for (const action of extraActions) {
    try {
      const animId = await client.createAnimation(rigId, action.actionId);
      const anim = await client.wait(() => client.getAnimation(animId), `anim.${action.name}`);
      credits += anim.consumed_credits ?? 0;
      const url = animResult(anim).animation_glb_url;
      if (url) {
        await writeBoth(paths, action.file, await client.download(url));
      }
    } catch (error) {
      console.log(`[phase1] animação ${action.name} falhou: ${error instanceof Error ? error.message : error}`);
    }
  }

  upsertAsset(manifest, {
    assetId: PHASE1_ASSET_ID,
    meshyTaskId: rigId,
    prompt: PHASE1_TAMER_PROMPT,
    type: "character",
    status: "SUCCEEDED",
    localPath: "Assets/StreamingAssets/GENORYX/Characters/phase1/tamer.rigged.glb",
    generatedAt: new Date().toISOString(),
    version: 1,
    consumedCredits: credits,
    extra: {
      previewTaskId: previewId,
      refineTaskId: refineId,
      rigTaskId: rigId,
      walkUrl: "anim.walk.glb",
      runUrl: "anim.run.glb",
    },
  });
  await saveManifest(paths.manifest, manifest);
  await writeFile(
    join(paths.streaming, "phase1.json"),
    `${JSON.stringify(
      {
        assetId: PHASE1_ASSET_ID,
        heightMeters: meshyCharacterConfig.heightMeters,
        animations: ["idle", "walk", "run"],
        consumedCredits: credits,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  console.log(`[phase1] concluído. créditos consumidos (soma reportada): ${credits}`);
  return { skipped: false, manifest, credits };
}
