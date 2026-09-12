import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { defaultManifestPath, loadManifest } from "./manifest";
import { generatedRoot } from "./parts-pipeline";
import { phase1Paths } from "./phase1-pipeline";

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

function fileInfo(path: string) {
  if (!existsSync(path)) {
    return { exists: false, bytes: 0, kind: "missing" };
  }
  const bytes = readFileSync(path).length;
  const header = readFileSync(path).subarray(0, 4).toString("ascii");
  return {
    exists: true,
    bytes,
    kind: header === "glTF" ? "glb" : header.startsWith("\u0089PNG") ? "png" : "other",
  };
}

async function main() {
  const repoRoot = findRepoRoot(__dirname);
  const manifest = await loadManifest(defaultManifestPath(repoRoot));
  const generated = generatedRoot(repoRoot);
  const phase1 = phase1Paths(repoRoot);
  const rows = manifest.assets.map((asset) => {
    const local = resolve(repoRoot, "apps/unity-game", asset.localPath.replace(/^Assets\//, "Assets/"));
    const info = fileInfo(local);
    return {
      assetId: asset.assetId,
      meshyTaskId: asset.meshyTaskId,
      type: asset.type,
      status: asset.status,
      localPath: asset.localPath,
      bytes: info.bytes,
      fileKind: info.kind,
      consumedCredits: asset.consumedCredits ?? 0,
      extra: asset.extra ?? {},
    };
  });

  const body = fileInfo(resolve(generated.streaming, "Bodies/body_a_01.glb"));
  const tamer = fileInfo(resolve(phase1.streaming, "tamer.rigged.glb"));
  const report = {
    generatedAt: new Date().toISOString(),
    conclusion:
      tamer.kind === "glb"
        ? "O Tamer FASE 1 é GLB real. O creator web usava PNG — isso foi removido. Peças modulares entram em Generated/ como GLB."
        : "Tamer GLB ausente.",
    bodyCopied: body,
    tamerRigged: tamer,
    assets: rows,
  };

  const out = resolve(repoRoot, "docs/MESHY_CHARACTER_AUDIT.json");
  writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`audit=${out} assets=${rows.length} tamer=${tamer.kind} ${tamer.bytes}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
