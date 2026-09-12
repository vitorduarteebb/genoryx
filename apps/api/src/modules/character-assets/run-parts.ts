import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { runModularPartsPipeline } from "./parts-pipeline";

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

const repoRoot = findRepoRoot(__dirname);
loadEnvFile(resolve(repoRoot, ".env"));
loadEnvFile(resolve(repoRoot, ".env.meshy.local"));
loadEnvFile(resolve(process.cwd(), ".env.meshy.local"));

runModularPartsPipeline(repoRoot).catch((error: unknown) => {
  console.error(`[parts] falhou: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
