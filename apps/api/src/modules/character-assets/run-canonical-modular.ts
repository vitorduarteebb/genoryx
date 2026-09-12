import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { MeshyHumanoidClient, type MeshyRigResult, type MeshyTaskBase } from "./meshy-humanoid.client";
import { defaultManifestPath, loadManifest, saveManifest, upsertAsset } from "./manifest";

const BODY_PROMPT =
  "Stylized humanoid base character for modular MMORPG customization. Neutral fitted undergarment only, no armor, no jacket, no boots, no hairstyle, bald or extremely short buzzed scalp with no hair volume, clean body silhouette, A-pose, game-ready, for modular clothing system, modern stylized GENORYX character, full body, visible hands and feet, 1.8 meters, no clothing except simple underwear briefs and chest wrap, no mannequin stand.";

const BODY_TEXTURE =
  "Stylized PBR skin for a GENORYX base body. Simple beige undershorts, no jacket, no hair, no boots. Soft skin, readable from elevated 3/4. Not photoreal.";

function findRepoRoot(start: string) {
  let current = start;
  for (let i = 0; i < 8; i += 1) {
    if (existsSync(resolve(current, "apps/unity-game")) && existsSync(resolve(current, "package.json"))) {
      return current;
    }
    current = dirname(current);
  }
  throw new Error("Raiz do monorepo não encontrada.");
}

function loadEnvFile(path: string) {
  if (!existsSync(path)) {
    return;
  }
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const index = trimmed.indexOf("=");
    if (index <= 0) {
      continue;
    }
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function dataUri(path: string) {
  return `data:image/png;base64,${readFileSync(path).toString("base64")}`;
}

function isGlb(bytes: Buffer) {
  return bytes.length > 1000 && bytes.subarray(0, 4).toString() === "glTF";
}

async function writeGlb(paths: string[], bytes: Buffer) {
  for (const path of paths) {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, bytes);
  }
}

function rigResult(task: MeshyTaskBase): MeshyRigResult {
  return (typeof task.result === "object" && task.result ? task.result : {}) as MeshyRigResult;
}

async function imagePart(
  client: MeshyHumanoidClient,
  id: string,
  ref: string,
  dests: string[],
): Promise<{ id: string; taskId: string; credits: number; bytes: number }> {
  if (existsSync(dests[0]) && readFileSync(dests[0]).length > 1000) {
    console.log(`[canonical] ${id} já existe — skip`);
    return { id, taskId: "skip", credits: 0, bytes: readFileSync(dests[0]).length };
  }
  console.log(`[canonical] image-to-3d ${id}`);
  const taskId = await client.createFromImage(dataUri(ref), { targetPolycount: 12_000 });
  const task = await client.wait(() => client.getImageTo3d(taskId), `image.${id}`);
  if (!task.model_urls?.glb) {
    throw new Error(`${id}: sem model_urls.glb`);
  }
  const bytes = await client.download(task.model_urls.glb);
  if (!isGlb(bytes)) {
    throw new Error(`${id}: download inválido`);
  }
  await writeGlb(dests, bytes);
  console.log(`[canonical] ${id} bytes=${bytes.length} credits=${task.consumed_credits ?? "?"}`);
  return { id, taskId, credits: task.consumed_credits ?? 0, bytes: bytes.length };
}

async function main() {
  const repo = findRepoRoot(__dirname);
  loadEnvFile(resolve(repo, ".env"));
  loadEnvFile(resolve(repo, ".env.meshy.local"));
  const client = new MeshyHumanoidClient();
  const streaming = join(repo, "apps/unity-game/Assets/StreamingAssets/GENORYX/Characters");
  const editor = join(repo, "apps/unity-game/Assets/GENORYX/Characters");
  const refs = join(repo, "tools/character_pipeline/refs");
  const report: Record<string, unknown>[] = [];

  const imageJobs = [
    imagePart(client, "hair_02", join(refs, "hair_test_02_reference.png"), [
      join(streaming, "Generated/Hair/hair_test_02.glb"),
      join(editor, "Processed/Hair/hair_02.glb"),
      join(streaming, "Processed/Hair/hair_02.glb"),
    ]),
    imagePart(client, "pants_01", join(refs, "pants_01_reference.png"), [
      join(streaming, "Generated/Legs/pants_01.glb"),
      join(editor, "Processed/Legs/pants_01.glb"),
      join(streaming, "Processed/Legs/pants_01.glb"),
    ]),
    imagePart(client, "pants_02", join(refs, "pants_02_reference.png"), [
      join(streaming, "Generated/Legs/pants_02.glb"),
      join(editor, "Processed/Legs/pants_02.glb"),
      join(streaming, "Processed/Legs/pants_02.glb"),
    ]),
  ];

  const bodyDest = join(streaming, "phase1/canonical.rigged.glb");
  const bodyJob = (async () => {
    if (existsSync(bodyDest) && readFileSync(bodyDest).length > 1000) {
      console.log("[canonical] body já existe — skip");
      return { id: "canonical_body", taskId: "skip", credits: 0, bytes: readFileSync(bodyDest).length };
    }
    console.log("[canonical] text-to-3d body underwear A-pose");
    let credits = 0;
    const previewId = await client.createPreview(BODY_PROMPT, { poseMode: "a-pose", targetPolycount: 30_000 });
    const preview = await client.wait(() => client.getTextTo3d(previewId), "preview.canonical_body");
    credits += preview.consumed_credits ?? 0;
    const refineId = await client.createRefine(previewId, BODY_TEXTURE);
    const refine = await client.wait(() => client.getTextTo3d(refineId), "refine.canonical_body");
    credits += refine.consumed_credits ?? 0;
    const rigId = await client.createRig(refineId, 1.8);
    const rig = await client.wait(() => client.getRig(rigId), "rig.canonical_body");
    credits += rig.consumed_credits ?? 0;
    const urls = rigResult(rig);
    if (!urls.rigged_character_glb_url) {
      throw new Error("canonical body sem rigged glb");
    }
    const bytes = await client.download(urls.rigged_character_glb_url);
    await writeGlb(
      [
        bodyDest,
        join(streaming, "Generated/Bodies/canonical_body.glb"),
        join(editor, "Processed/Bodies/canonical_body.glb"),
        join(streaming, "Processed/Bodies/canonical_body.glb"),
      ],
      bytes,
    );
    if (urls.basic_animations?.walking_glb_url) {
      await writeGlb(
        [join(streaming, "phase1/canonical.walk.glb"), join(streaming, "Processed/Bodies/anim.walk.glb")],
        await client.download(urls.basic_animations.walking_glb_url),
      );
    }
    if (urls.basic_animations?.running_glb_url) {
      await writeGlb(
        [join(streaming, "phase1/canonical.run.glb"), join(streaming, "Processed/Bodies/anim.run.glb")],
        await client.download(urls.basic_animations.running_glb_url),
      );
    }
    try {
      const animId = await client.createAnimation(rigId, 0);
      const anim = await client.wait(() => client.getAnimation(animId), "anim.canonical.idle");
      credits += anim.consumed_credits ?? 0;
      const result = typeof anim.result === "object" && anim.result ? (anim.result as { animation_glb_url?: string }) : {};
      if (result.animation_glb_url) {
        await writeGlb(
          [join(streaming, "phase1/canonical.idle.glb"), join(streaming, "Processed/Bodies/anim.idle.glb")],
          await client.download(result.animation_glb_url),
        );
      }
    } catch (error) {
      console.log(`[canonical] idle falhou: ${error instanceof Error ? error.message : error}`);
    }
    console.log(`[canonical] body bytes=${bytes.length} credits=${credits} rig=${rigId}`);
    return { id: "canonical_body", taskId: rigId, credits, bytes: bytes.length, extra: { previewId, refineId, rigId } };
  })();

  const [hair2, pants1, pants2, body] = await Promise.all([...imageJobs, bodyJob]);
  report.push(hair2, pants1, pants2, body);

  const manifest = await loadManifest(defaultManifestPath(repo));
  for (const item of report) {
    const row = item as { id: string; taskId: string; credits: number };
    upsertAsset(manifest, {
      assetId: row.id,
      meshyTaskId: row.taskId,
      prompt: row.id,
      type: "modular",
      status: "SUCCEEDED",
      localPath: row.id,
      generatedAt: new Date().toISOString(),
      version: 1,
      consumedCredits: row.credits,
    });
  }
  await saveManifest(defaultManifestPath(repo), manifest);
  await mkdir(join(repo, "tools/character_pipeline/_audit"), { recursive: true });
  await writeFile(join(repo, "tools/character_pipeline/_audit/canonical_generation.json"), `${JSON.stringify(report, null, 2)}\n`);
  const total = report.reduce((sum, item) => sum + Number((item as { credits?: number }).credits ?? 0), 0);
  console.log(`[canonical] concluído créditos=${total}`);
}

main().catch((error: unknown) => {
  console.error(`[canonical] falhou: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
