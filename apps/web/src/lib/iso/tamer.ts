import { buildWorldTamerAtlas, paintWorldNpc } from "../world-art/tamer";
import type { IsoDir } from "./projection";

export type TamerAtlas = Record<IsoDir, { idle: HTMLCanvasElement[]; walk: HTMLCanvasElement[] }>;

export function buildTamerAtlas(appearance?:unknown): TamerAtlas {
  return buildWorldTamerAtlas(appearance);
}

export function paintNpc(palette: "gold" | "violet" | "steel" | "green",role?:string,phase?:number) {
  return paintWorldNpc(palette,role,phase);
}
