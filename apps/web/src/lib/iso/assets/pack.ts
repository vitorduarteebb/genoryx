import { worldAssetsForArea, type WorldAssetArea, type WorldAssetDef } from "@nexora/config";
import { loadWorldAssetImage, peekWorldAssetImage, unloadWorldImages } from "./loader";

export type AreaArtPack = {
  area: "haven" | "verdantis";
  images: Map<string, HTMLImageElement>;
};

let current: AreaArtPack | null = null;

export async function loadAreaArtPack(area: "haven" | "verdantis", dpr = 1): Promise<AreaArtPack> {
  if (current?.area === area) return current;
  if (current && current.area !== area) {
    unloadWorldImages(`/world-art/environment/${current.area}/`);
    current = null;
  }
  const images = new Map<string, HTMLImageElement>();
  const defs = worldAssetsForArea(area).filter((row) => row.area === area);
  await Promise.all(
    defs.map(async (def) => {
      const img = await loadWorldAssetImage(def, dpr);
      if (img) images.set(def.id, img);
    }),
  );
  current = { area, images };
  return current;
}

export function areaPackImage(def: WorldAssetDef, dpr = 1) {
  return current?.images.get(def.id) ?? peekWorldAssetImage(def, dpr);
}

export function currentAreaArtPack() {
  return current;
}

export type { WorldAssetArea };
