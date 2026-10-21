import { npcAssetId, worldAssetById, type NpcArchetype } from "@nexora/config";
import { loadWorldAssetImage } from "./loader";

export type NpcWorldSprite = {
  archetype: NpcArchetype;
  source: "sprite-atlas" | "needs-art";
  image: HTMLImageElement | null;
};

const cache = new Map<NpcArchetype, NpcWorldSprite>();

export async function loadNpcWorldSprite(archetype: NpcArchetype, dpr = 1): Promise<NpcWorldSprite> {
  const hit = cache.get(archetype);
  if (hit) return hit;
  const def = worldAssetById(npcAssetId(archetype));
  const image = def ? await loadWorldAssetImage(def, dpr) : null;
  const row: NpcWorldSprite = {
    archetype,
    source: image ? "sprite-atlas" : "needs-art",
    image,
  };
  cache.set(archetype, row);
  return row;
}

export function peekNpcWorldSprite(archetype: NpcArchetype) {
  return cache.get(archetype);
}
