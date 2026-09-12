import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { access } from "node:fs/promises";
import { defaultManifestPath, findAsset, loadManifest, saveManifest, upsertAsset } from "./manifest";
import { MeshyHumanoidClient } from "./meshy-humanoid.client";
import { modularPartSpecs } from "./modular-parts";
import { phase1Paths } from "./phase1-pipeline";

export function generatedRoot(repoRoot: string) {
  return {
    streaming: join(repoRoot, "apps/unity-game/Assets/StreamingAssets/GENORYX/Characters/Generated"),
    editor: join(repoRoot, "apps/unity-game/Assets/GENORYX/Characters/Generated"),
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

async function writeGlb(repoRoot: string, relative: string, bytes: Buffer) {
  const roots = generatedRoot(repoRoot);
  const streaming = join(roots.streaming, relative);
  const editor = join(roots.editor, relative);
  await mkdir(dirname(streaming), { recursive: true });
  await mkdir(dirname(editor), { recursive: true });
  await writeFile(streaming, bytes);
  await writeFile(editor, bytes);
  return streaming;
}

export async function runModularPartsPipeline(repoRoot: string) {
  const client = new MeshyHumanoidClient();
  const manifest = await loadManifest(defaultManifestPath(repoRoot));
  const phase1 = phase1Paths(repoRoot);
  const bodySrc = join(phase1.streaming, "tamer.rigged.glb");
  if (await exists(bodySrc)) {
    await writeGlb(repoRoot, "Bodies/body_a_01.glb", await readFile(bodySrc));
    console.log("[parts] body_a_01 copiado do Tamer rigado existente (GLB real, não thumbnail).");
  }

  let credits = 0;
  for (const spec of modularPartSpecs) {
    const local = join(generatedRoot(repoRoot).streaming, spec.file);
    const existing = findAsset(manifest, spec.assetId);
    if (existing?.status === "SUCCEEDED" && (await exists(local))) {
      console.log(`[parts] ${spec.assetId} já existe — skip`);
      continue;
    }

    console.log(`[parts] gerando ${spec.assetId} (${spec.slot})`);
    const previewId = await client.createPreview(spec.prompt, {
      poseMode: "",
      targetPolycount: spec.polycount,
    });
    const preview = await client.wait(() => client.getTextTo3d(previewId), `preview.${spec.assetId}`);
    credits += preview.consumed_credits ?? 0;

    const refineId = await client.createRefine(previewId, spec.texturePrompt);
    const refine = await client.wait(() => client.getTextTo3d(refineId), `refine.${spec.assetId}`);
    credits += refine.consumed_credits ?? 0;
    if (!refine.model_urls?.glb) {
      throw new Error(`${spec.assetId}: refine sem model_urls.glb`);
    }
    const bytes = await client.download(refine.model_urls.glb);
    const path = await writeGlb(repoRoot, spec.file, bytes);
    upsertAsset(manifest, {
      assetId: spec.assetId,
      meshyTaskId: refineId,
      prompt: spec.prompt,
      type: "refine",
      status: "SUCCEEDED",
      localPath: `Assets/StreamingAssets/GENORYX/Characters/Generated/${spec.file}`,
      generatedAt: new Date().toISOString(),
      version: 1,
      consumedCredits: (preview.consumed_credits ?? 0) + (refine.consumed_credits ?? 0),
      extra: {
        previewTaskId: previewId,
        refineTaskId: refineId,
        slot: spec.slot,
        bytes: bytes.length,
      },
    });
    await saveManifest(defaultManifestPath(repoRoot), manifest);
    console.log(`[parts] ${spec.assetId} GLB ${bytes.length} bytes → ${path}`);
  }

  await writeCatalog(repoRoot);
  console.log(`[parts] concluído. créditos desta rodada: ${credits}`);
  return { credits };
}

async function writeCatalog(repoRoot: string) {
  const catalog = {
    version: 1,
    body: { id: "body_a", file: "Bodies/body_a_01.glb" },
    parts: [
      { id: "body_a", slot: "BODY", file: "Bodies/body_a_01.glb", bone: "" },
      { id: "face_01", slot: "FACE", file: "", bone: "Head" },
      { id: "hair_01_short", slot: "HAIR", file: "Hair/hair_01.glb", bone: "Head" },
      { id: "hair_02_messy", slot: "HAIR", file: "Hair/hair_02.glb", bone: "Head" },
      { id: "chest_novice_tamer", slot: "CHEST", file: "Chest/chest_01.glb", bone: "Chest" },
      { id: "chest_field_explorer", slot: "CHEST", file: "Chest/chest_02.glb", bone: "Chest" },
      { id: "legs_explorer", slot: "LEGS", file: "Legs/legs_01.glb", bone: "Pelvis" },
      { id: "legs_reinforced", slot: "LEGS", file: "Legs/legs_02.glb", bone: "Pelvis" },
      { id: "boots_explorer", slot: "BOOTS", file: "Boots/boots_01.glb", bone: "Pelvis" },
      { id: "boots_leather", slot: "BOOTS", file: "Boots/boots_02.glb", bone: "Pelvis" },
    ],
  };
  const json = `${JSON.stringify(catalog, null, 2)}\n`;
  const roots = generatedRoot(repoRoot);
  await mkdir(roots.streaming, { recursive: true });
  await writeFile(join(roots.streaming, "catalog.json"), json, "utf8");
  await mkdir(roots.editor, { recursive: true });
  await writeFile(join(roots.editor, "catalog.json"), json, "utf8");
}
