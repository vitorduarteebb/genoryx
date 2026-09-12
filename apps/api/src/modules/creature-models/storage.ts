import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";

export function resolveCreatureModelRoot(cwd = process.cwd(), envDir = process.env.CREATURE_MODEL_STORAGE_DIR): string {
  if (envDir) {
    return envDir;
  }
  let dir = cwd;
  for (let i = 0; i < 6; i += 1) {
    if (existsSync(join(dir, "package-lock.json")) && existsSync(join(dir, "apps"))) {
      return join(dir, "var", "creature-models");
    }
    const parent = dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  return join(cwd, "var", "creature-models");
}

export class LocalCreatureModelStore {
  readonly root: string;

  constructor(root = resolveCreatureModelRoot()) {
    this.root = root;
  }

  async put(key: string, bytes: Buffer): Promise<void> {
    const path = join(this.root, key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, bytes);
  }

  async get(key: string): Promise<Buffer> {
    return readFile(join(this.root, key));
  }

  async exists(key: string): Promise<boolean> {
    try {
      await access(join(this.root, key));
      return true;
    } catch {
      return false;
    }
  }
}

export function modelStorageKey(creatureId: string, lifeStage: string, version: number, file: string): string {
  return `${creatureId}/${lifeStage}/v${version}/${file}`;
}
