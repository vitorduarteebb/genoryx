import { havenMap, verdantisMap } from "../iso/maps";
import { depthOf, worldToScreen } from "../iso/projection";
import { buildWorldArtKit } from "./iso-kit";
import { buildWorldTamerAtlas } from "./tamer";

function blit(
  ctx: CanvasRenderingContext2D,
  area: "haven" | "verdantis",
  zoom: number,
  focusX: number,
  focusZ: number,
) {
  const kit = buildWorldArtKit();
  const map = area === "verdantis" ? verdantisMap(true) : havenMap();
  const focus = worldToScreen(focusX, focusZ - 0.15);
  const ox = ctx.canvas.width / 2;
  const oy = ctx.canvas.height * 0.62;
  const ground = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
  ground.addColorStop(0, map.sky[0]);
  ground.addColorStop(0.42, map.sky[1]);
  ground.addColorStop(1, area === "haven" ? "#2a2418" : "#142016");
  ctx.fillStyle = ground;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = area === "haven" ? "rgba(30,42,38,.55)" : "rgba(12,28,16,.6)";
  ctx.beginPath();
  ctx.moveTo(0, ctx.canvas.height * 0.34);
  ctx.quadraticCurveTo(ctx.canvas.width * 0.3, ctx.canvas.height * 0.22, ctx.canvas.width * 0.55, ctx.canvas.height * 0.3);
  ctx.quadraticCurveTo(ctx.canvas.width * 0.78, ctx.canvas.height * 0.2, ctx.canvas.width, ctx.canvas.height * 0.32);
  ctx.lineTo(ctx.canvas.width, ctx.canvas.height);
  ctx.lineTo(0, ctx.canvas.height);
  ctx.fill();
  ctx.fillStyle = map.fog;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height * 0.38);

  const drawAt = (img: HTMLCanvasElement, x: number, z: number, scale: number) => {
    const s = worldToScreen(x, z);
    const w = img.width * scale * (zoom / 1.2);
    const h = img.height * scale * (zoom / 1.2);
    ctx.drawImage(img, s.x - focus.x + ox - w / 2, s.y - focus.y + oy - h, w, h);
  };

  const drawables: Array<{ depth: number; draw: () => void }> = [];
  for (const tile of map.tiles) {
    const img = kit.tiles[tile.tile];
    if (!img) continue;
    drawables.push({ depth: depthOf(tile.x, tile.z, 0), draw: () => drawAt(img, tile.x, tile.z, 0.92) });
  }
  for (const prop of map.props) {
    const img = kit.props[prop.prop];
    if (!img) continue;
    drawables.push({
      depth: depthOf(prop.x, prop.z, prop.layer ?? 5),
      draw: () => drawAt(img, prop.x, prop.z, prop.scale ?? 1),
    });
  }
  const tamer = buildWorldTamerAtlas().S.idle[0];
  drawables.push({ depth: depthOf(focusX, focusZ, 16), draw: () => drawAt(tamer, focusX, focusZ, 1.12) });
  drawables.sort((a, b) => a.depth - b.depth);
  for (const row of drawables) row.draw();
}

export function paintWorldScreenshot(
  canvas: HTMLCanvasElement,
  kind: "desktop" | "portrait" | "landscape",
  area: "haven" | "verdantis" = "haven",
) {
  const sizes = {
    desktop: { w: 960, h: 540, zoom: 1.48 },
    portrait: { w: 390, h: 844, zoom: 1.44 },
    landscape: { w: 844, h: 390, zoom: 1.42 },
  }[kind];
  canvas.width = sizes.w;
  canvas.height = sizes.h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const focus = area === "haven" ? { x: 0, z: 4.6 } : { x: 0, z: 0.8 };
  blit(ctx, area, sizes.zoom, focus.x, focus.z);
}
