import { LocalCreatureImageStore, resolveCreatureImageRoot } from "../creature-visuals/storage";
import { join } from "node:path";

export function resolveEggImageRoot(): string {
  return process.env.EGG_IMAGE_STORAGE_DIR?.trim() || join(resolveCreatureImageRoot(), "..", "egg-visuals");
}

export function eggStorageKey(eggId: string, generationKey: string): string {
  return `eggs/${eggId}/${generationKey}.png`;
}

export class LocalEggImageStore extends LocalCreatureImageStore {
  constructor() {
    super(resolveEggImageRoot());
  }
}
