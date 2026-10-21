import { parseCharacterAppearance, worldAssetById } from "@nexora/config";
import { DIRS, type IsoDir } from "../projection";
import { loadWorldAssetImage } from "./loader";

export type CharacterWorldAvatar = {
  id: string;
  source: "sprite-atlas" | "needs-art";
  width: number;
  height: number;
  frames?: Record<IsoDir, { idle: HTMLCanvasElement[]; walk: HTMLCanvasElement[]; run: HTMLCanvasElement[] }>;
};

function sliceAtlas(img: HTMLImageElement): CharacterWorldAvatar["frames"] {
  const cols = DIRS.length;
  const rows = 3;
  const fw = Math.floor(img.width / cols);
  const fh = Math.floor(img.height / rows);
  const frames = {} as NonNullable<CharacterWorldAvatar["frames"]>;
  DIRS.forEach((dir, col) => {
    const take = (row: number) => {
      const node = document.createElement("canvas");
      node.width = fw;
      node.height = fh;
      const ctx = node.getContext("2d");
      if (ctx) ctx.drawImage(img, col * fw, row * fh, fw, fh, 0, 0, fw, fh);
      return node;
    };
    frames[dir] = { idle: [take(0)], walk: [take(1)], run: [take(2)] };
  });
  return frames;
}

/** Disk atlas when READY; otherwise the live 3D bake in tamer-model is the world avatar. */
export async function bakeCharacterWorldAvatar(appearance?: unknown, dpr = 1): Promise<CharacterWorldAvatar> {
  void parseCharacterAppearance(appearance);
  const def = worldAssetById("character.tamer");
  if (!def) return { id: "character.tamer", source: "needs-art", width: 96, height: 148 };
  const img = await loadWorldAssetImage(def, dpr);
  if (!img) {
    return { id: def.id, source: "needs-art", width: 96, height: 148 };
  }
  return {
    id: def.id,
    source: "sprite-atlas",
    width: Math.floor(img.width / DIRS.length),
    height: Math.floor(img.height / 3),
    frames: sliceAtlas(img),
  };
}
