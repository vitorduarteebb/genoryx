import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export type MeshyManifestEntry = {
  assetId: string;
  meshyTaskId: string;
  prompt: string;
  // "modular" cobre peça isolada (hair, pants, body) gerada por run-canonical-modular,
  // que não é nem preview nem character inteiro.
  type: "preview" | "refine" | "remesh" | "rig" | "animation" | "character" | "modular";
  status: "PENDING" | "IN_PROGRESS" | "SUCCEEDED" | "FAILED";
  localPath: string;
  generatedAt: string;
  version: number;
  consumedCredits?: number;
  extra?: Record<string, string | number | undefined>;
};

export type MeshyAssetManifest = {
  version: 1;
  assets: MeshyManifestEntry[];
};

export function defaultManifestPath(repoRoot: string) {
  return join(repoRoot, "apps/unity-game/Assets/GENORYX/Characters/MeshyAssetManifest.json");
}

export async function loadManifest(path: string): Promise<MeshyAssetManifest> {
  try {
    const raw = await readFile(path, "utf8");
    const parsed = JSON.parse(raw) as MeshyAssetManifest;
    if (!parsed || !Array.isArray(parsed.assets)) {
      return { version: 1, assets: [] };
    }
    return parsed;
  } catch {
    return { version: 1, assets: [] };
  }
}

export async function saveManifest(path: string, manifest: MeshyAssetManifest) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

export function findAsset(manifest: MeshyAssetManifest, assetId: string) {
  return manifest.assets.find((row) => row.assetId === assetId);
}

export function upsertAsset(manifest: MeshyAssetManifest, entry: MeshyManifestEntry) {
  const index = manifest.assets.findIndex((row) => row.assetId === entry.assetId);
  if (index >= 0) {
    manifest.assets[index] = entry;
    return;
  }
  manifest.assets.push(entry);
}
