import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { MeshyHumanoidClient } from "./meshy-humanoid.client";

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

async function main() {
  const repoRoot = findRepoRoot(__dirname);
  loadEnvFile(resolve(repoRoot, ".env"));
  loadEnvFile(resolve(repoRoot, ".env.meshy.local"));

  const ref = join(repoRoot, "tools/character_pipeline/refs/hair_test_01_reference.png");
  if (!existsSync(ref)) {
    throw new Error("Referência de cabelo ausente: tools/character_pipeline/refs/hair_test_01_reference.png");
  }

  const dest = join(
    repoRoot,
    "apps/unity-game/Assets/StreamingAssets/GENORYX/Characters/Generated/Hair/hair_test_01.glb",
  );
  const destEditor = join(repoRoot, "apps/unity-game/Assets/GENORYX/Characters/Generated/Hair/hair_test_01.glb");
  const destProcessed = join(repoRoot, "apps/unity-game/Assets/GENORYX/Characters/Processed/Hair/hair_test_01.glb");
  if (existsSync(dest) && readFileSync(dest).length > 1000) {
    console.log("[hair-test] hair_test_01.glb já existe — skip Meshy");
    return;
  }

  const dataUri = `data:image/png;base64,${readFileSync(ref).toString("base64")}`;
  const client = new MeshyHumanoidClient();
  console.log("[hair-test] image-to-3d HAIR_TEST_01 (somente cabelo, sem personagem)");
  const taskId = await client.createFromImage(dataUri, { targetPolycount: 12_000 });
  const task = await client.wait(() => client.getImageTo3d(taskId), "image.hair_test_01");
  if (!task.model_urls?.glb) {
    throw new Error("HAIR_TEST_01: task sem model_urls.glb");
  }
  const bytes = await client.download(task.model_urls.glb);
  if (bytes.length < 1000 || bytes.subarray(0, 4).toString() !== "glTF") {
    throw new Error("HAIR_TEST_01: download não é GLB válido");
  }
  await mkdir(dirname(dest), { recursive: true });
  await mkdir(dirname(destEditor), { recursive: true });
  await mkdir(dirname(destProcessed), { recursive: true });
  await writeFile(dest, bytes);
  await writeFile(destEditor, bytes);
  await writeFile(destProcessed, bytes);
  await writeFile(
    join(dirname(destProcessed), "hair_test_01.json"),
    JSON.stringify(
      {
        id: "hair_test_01",
        slot: "HAIR",
        source: "image-to-3d",
        meshyTaskId: taskId,
        bytes: bytes.length,
        credits: task.consumed_credits ?? null,
        note: "Não continuar para Chest até validação visual passar.",
      },
      null,
      2,
    ),
  );
  console.log(`[hair-test] gravado ${dest} bytes=${bytes.length} credits=${task.consumed_credits ?? "?"}`);
  console.log("[hair-test] PARE. Validar hair_only + body+hair antes de gerar Chest.");
}

main().catch((error: unknown) => {
  console.error(`[hair-test] falhou: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
