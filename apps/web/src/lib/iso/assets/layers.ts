import { worldToScreen } from "../projection";
import type { WorldAssetDef } from "@nexora/config";

export function plateScreenRect(
  def: WorldAssetDef,
  camX: number,
  camY: number,
  zoom: number,
  canvasWidth: number,
  canvasHeight: number,
) {
  const world = def.world;
  if (!world) return null;
  const corners = [
    worldToScreen(world.minX, world.minZ),
    worldToScreen(world.maxX, world.minZ),
    worldToScreen(world.maxX, world.maxZ),
    worldToScreen(world.minX, world.maxZ),
  ];
  const xs = corners.map((p) => (p.x - camX) * zoom + canvasWidth / 2);
  const ys = corners.map((p) => (p.y - camY) * zoom + canvasHeight * 0.62);
  const left = Math.min(...xs);
  const top = Math.min(...ys);
  return { x: left, y: top, w: Math.max(...xs) - left, h: Math.max(...ys) - top };
}

export const LAYER_SORT: Record<string, number> = {
  background: 0,
  base: 1,
  architecture: 2,
  props: 3,
  actors: 4,
  foreground: 5,
  atmosphere: 6,
};
