import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export interface CardArtStore {
  root: string;
  put(key: string, bytes: Buffer): Promise<void>;
  get(key: string): Promise<Buffer>;
  exists(key: string): Promise<boolean>;
  isValidPng(key: string): Promise<boolean>;
}

export function resolveCardArtRoot(cwd = process.cwd(), envDir = process.env.CARD_ART_STORAGE_DIR): string {
  if (envDir) {
    return envDir;
  }
  let dir = cwd;
  for (let i = 0; i < 6; i += 1) {
    if (existsSync(join(dir, "package-lock.json")) && existsSync(join(dir, "apps"))) {
      return join(dir, "var", "card-art");
    }
    const parent = dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  return join(cwd, "var", "card-art");
}

export class LocalCardArtStore implements CardArtStore {
  readonly root: string;

  constructor(root = resolveCardArtRoot()) {
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

  async isValidPng(key: string): Promise<boolean> {
    try {
      const bytes = await this.get(key);
      return bytes.length > 24 && bytes.subarray(0, 8).equals(PNG_SIGNATURE);
    } catch {
      return false;
    }
  }
}

export function cardArtStorageKey(cardDefinitionId: string, variant: string, generationKey: string): string {
  return `${cardDefinitionId}/${variant}/${generationKey}.png`;
}
