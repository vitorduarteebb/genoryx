export const TILE_W = 96;
export const TILE_H = 48;
export const DIRS = ["S", "SE", "E", "NE", "N", "NW", "W", "SW"] as const;
export type IsoDir = (typeof DIRS)[number];

export function worldToScreen(x: number, z: number) {
  return {
    x: (x - z) * (TILE_W / 2),
    y: (x + z) * (TILE_H / 2),
  };
}

export function screenToWorld(sx: number, sy: number) {
  return {
    x: sx / TILE_W + sy / TILE_H,
    z: sy / TILE_H - sx / TILE_W,
  };
}

export function depthOf(x: number, z: number, layer = 0) {
  return (x + z) * 20 + layer;
}

export function dirFromDelta(dx: number, dz: number): IsoDir {
  if (dx * dx + dz * dz < 0.0004) return "S";
  const step = Math.round(Math.atan2(dx, dz) / (Math.PI / 4));
  return DIRS[(step + 8) % 8] ?? "S";
}

export function dirAngle(dir: IsoDir) {
  return (DIRS.indexOf(dir) * Math.PI) / 4;
}
