import { worldToScreen } from "../projection";
import type { IsoMap } from "../maps";

export function paintWorldHitmap(
  ctx: CanvasRenderingContext2D,
  map: IsoMap,
  camX: number,
  camY: number,
  zoom: number,
  player: { x: number; z: number },
) {
  const ox = ctx.canvas.width / 2;
  const oy = ctx.canvas.height * 0.62;
  const to = (x: number, z: number) => {
    const p = worldToScreen(x, z);
    return { x: (p.x - camX) * zoom + ox, y: (p.y - camY) * zoom + oy };
  };
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "#3de0d0";
  const a = to(map.walk.minX, map.walk.minZ);
  const b = to(map.walk.maxX, map.walk.minZ);
  const c = to(map.walk.maxX, map.walk.maxZ);
  const d = to(map.walk.minX, map.walk.maxZ);
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(c.x, c.y);
  ctx.lineTo(d.x, d.y);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = "#c45c48";
  for (const block of map.blocks) {
    const p = to(block.x, block.z);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, block.r * 28 * zoom, block.r * 14 * zoom, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.font = `${Math.round(11 * zoom)}px sans-serif`;
  ctx.textAlign = "center";
  for (const item of map.interactables) {
    const p = to(item.x, item.z);
    ctx.fillStyle = item.kind === "exit" ? "#c9a24a" : item.kind === "wild" ? "#4c8a58" : "#9ef0dc";
    ctx.beginPath();
    ctx.arc(p.x, p.y - 8, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(item.id, p.x, p.y - 16);
  }
  const me = to(player.x, player.z);
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(me.x, me.y - 6, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
