import {
  H,
  V,
  blobShadow,
  canvas,
  crystal,
  diamond,
  isoBox,
  mix,
  roofStack,
  shade,
  speckles,
  treeCanopy,
  type RGB,
} from "./paint";

export type WorldArtIsoKit = {
  tiles: Record<string, HTMLCanvasElement>;
  props: Record<string, HTMLCanvasElement>;
};

function tile(tiles: Record<string, HTMLCanvasElement>, name: string, paint: (ctx: CanvasRenderingContext2D) => void, w = 96, h = 56) {
  const { node, ctx } = canvas(w, h);
  paint(ctx);
  tiles[name] = node;
}

function prop(props: Record<string, HTMLCanvasElement>, name: string, w: number, h: number, paint: (ctx: CanvasRenderingContext2D) => void) {
  const { node, ctx } = canvas(w, h);
  paint(ctx);
  props[name] = node;
}

function windowGlow(ctx: CanvasRenderingContext2D, x: number, y: number, w = 11, h = 10) {
  ctx.fillStyle = "rgba(255,196,90,.22)";
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.fillStyle = "#FFC45A";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "rgba(255,240,180,.55)";
  ctx.fillRect(x + 1, y + 1, 3, 3);
  ctx.strokeStyle="#4d3830";ctx.lineWidth=2;ctx.strokeRect(x-.5,y-.5,w+1,h+1);
  ctx.beginPath();ctx.moveTo(x+w/2,y);ctx.lineTo(x+w/2,y+h);ctx.moveTo(x,y+h*.48);ctx.lineTo(x+w,y+h*.48);ctx.stroke();
  ctx.fillStyle="#6c5140";ctx.fillRect(x-3,y+h+1,w+6,3);
}

function door(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = "#2A1C14";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y + 6);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h - 6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle="#b1915d";ctx.lineWidth=1.6;ctx.stroke();
  ctx.strokeStyle="#594034";ctx.lineWidth=.8;
  for(let i=1;i<4;i++){ctx.beginPath();ctx.moveTo(x+w*i/4,y+6);ctx.lineTo(x+w*i/4,y+h-3);ctx.stroke();}
  ctx.fillStyle = "#C9A24A";
  ctx.fillRect(x + w - 6, y + h * 0.42, 3, 3);
}

function paintHouse(
  ctx: CanvasRenderingContext2D,
  kind: "A" | "B" | "C",
) {
  const compact = kind === "A";
  const tall = kind === "B";
  const wide = kind === "C";
  const cx = wide ? 118 : tall ? 108 : 96;
  const baseY = tall ? 168 : 158;
  blobShadow(ctx, cx, baseY + 18, wide ? 78 : 62, 16, 0.32);
  isoBox(ctx, cx, baseY, wide ? 148 : compact ? 108 : 118, wide ? 88 : 78, 16, H.stone2, {
    top: H.stone,
    trim: shade(H.gold, -0.2),
  });
  const wallH = tall ? 62 : compact ? 48 : 52;
  isoBox(ctx, cx, baseY - 22, wide ? 128 : compact ? 96 : 86, wide ? 72 : tall ? 90 : 68, wallH, mix(H.ivory, H.wood, 0.18), {
    top: H.ivory,
    left: shade(H.ivory, -0.12),
    right: shade(H.wood, 0.08),
  });
  if (tall) {
    isoBox(ctx, cx, baseY - 78, 78, 70, 36, mix(H.ivory, H.wood, 0.12), { top: H.ivory });
  }
  roofStack(ctx, cx, tall ? 58 : wide ? 72 : 68, wide ? 158 : compact ? 122 : 150, wide ? 86 : 80, H.roof);
  isoBox(ctx, cx + (wide ? 48 : 28), tall ? 78 : 88, 18, 16, 46, shade(H.wood, -0.1), { top: shade(H.stone2, -0.1) });
  ctx.strokeStyle = "#5A3824";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - (wide ? 46 : 34), baseY - 18);
  ctx.lineTo(cx + (wide ? 40 : 28), baseY - 8);
  ctx.moveTo(cx - (wide ? 40 : 28), baseY - 36);
  ctx.lineTo(cx + (wide ? 34 : 22), baseY - 26);
  ctx.moveTo(cx - 8, baseY - 48);
  ctx.lineTo(cx - 4, baseY - 6);
  ctx.stroke();
  windowGlow(ctx, cx - 38, baseY - 38);
  windowGlow(ctx, cx + 18, baseY - 34);
  if (wide) windowGlow(ctx, cx - 8, baseY - 40, 14, 10);
  door(ctx, cx - (wide ? 8 : 10), baseY - 8, 18, 28);
  isoBox(ctx, cx - (wide ? 6 : 8), baseY + 4, 28, 16, 6, shade(H.stone2, -0.08), { top: H.stone });
  ctx.fillStyle = "rgba(201,162,74,.85)";
  ctx.fillRect(cx - 22, baseY - 58, 36, 4);
  // Stone joints, a framed sign and flower box distinguish the façades.
  ctx.strokeStyle="rgba(66,57,43,.3)";ctx.lineWidth=.7;
  for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(cx-40,baseY-20-i*8);ctx.lineTo(cx-13,baseY-14-i*8);ctx.stroke();}
  ctx.fillStyle="#332e29";ctx.fillRect(cx+26,baseY-63,25,14);ctx.strokeStyle="#d0b776";ctx.strokeRect(cx+26,baseY-63,25,14);
  ctx.fillStyle="#dbc58c";ctx.font="8px serif";ctx.fillText(kind==="A"?"INN":kind==="B"?"GUILD":"HOME",cx+28,baseY-53);
  isoBox(ctx,cx-31,baseY-21,25,13,8,H.wood,{top:H.earth});
  for(let i=0;i<5;i++){ctx.fillStyle=i%2?"#a9bb6c":"#ca83a2";ctx.beginPath();ctx.arc(cx-41+i*4,baseY-29+(i%2)*2,2.7,0,Math.PI*2);ctx.fill();}
}

function paintTree(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  variant: number,
  verdantis: boolean,
) {
  const lean = [-14, 11, -7, 18][variant % 4];
  const tall = [1, 1.18, 0.88, 1.3][variant % 4];
  blobShadow(ctx, cx + lean * 0.12, baseY + 10, 34 * tall, 11, 0.36);
  isoBox(ctx, cx, baseY, 10 + variant, 10, 42 * tall, shade(H.wood, -0.12));
  ctx.strokeStyle = "#3A2418";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx - 1, baseY - 36 * tall);
  ctx.quadraticCurveTo(cx + lean * 0.55, baseY - 58 * tall, cx + lean * 0.85, baseY - 78 * tall);
  ctx.moveTo(cx + 2, baseY - 28 * tall);
  ctx.quadraticCurveTo(cx - lean * 0.7, baseY - 46 * tall, cx - lean * 0.95, baseY - 66 * tall);
  ctx.moveTo(cx, baseY - 22 * tall);
  ctx.lineTo(cx + lean * 0.25, baseY - 40 * tall);
  ctx.stroke();
  const deep = verdantis ? V.deep : shade(H.foliage, -0.32);
  const mid = verdantis ? V.forest : H.foliage;
  const hi = verdantis ? V.highlight : shade(H.foliage, 0.24);
  const ox = cx + lean * 0.28;
  const cy = baseY - (verdantis ? 92 : 84) * tall;
  if (verdantis) {
    treeCanopy(ctx, ox, cy, [
      { dx: 0, dy: 36, rx: 22 * tall, ry: 12 * tall, tone: deep },
      { dx: -16, dy: 18, rx: 16 * tall, ry: 14 * tall, tilt: -0.4, tone: shade(deep, 0.06) },
      { dx: 18, dy: 16, rx: 15 * tall, ry: 13 * tall, tilt: 0.35, tone: mid },
      { dx: -6, dy: 2, rx: 18 * tall, ry: 16 * tall, tone: shade(mid, -0.05) },
      { dx: 8, dy: -8, rx: 14 * tall, ry: 15 * tall, tone: hi },
      { dx: 0, dy: -26, rx: 9 * tall, ry: 13 * tall, tone: shade(hi, 0.08) },
    ]);
  } else {
    treeCanopy(ctx, ox, cy, [
      { dx: -20, dy: 16, rx: 18 * tall, ry: 12 * tall, tilt: -0.55, tone: deep },
      { dx: 22, dy: 14, rx: 17 * tall, ry: 11 * tall, tilt: 0.5, tone: shade(deep, 0.1) },
      { dx: 0, dy: 10, rx: 26 * tall, ry: 14 * tall, tone: mid },
      { dx: -18, dy: -4, rx: 15 * tall, ry: 13 * tall, tilt: -0.35, tone: shade(mid, -0.08) },
      { dx: 16, dy: -8, rx: 14 * tall, ry: 12 * tall, tilt: 0.4, tone: shade(mid, 0.06) },
      { dx: -4, dy: -18, rx: 12 * tall, ry: 10 * tall, tone: hi },
      { dx: 10, dy: -20, rx: 9 * tall, ry: 8 * tall, tone: shade(hi, 0.12) },
    ]);
  }
}

/** Drop-in replacement for `buildIsoKit()` in `apps/web/src/lib/iso/kit.ts`. */
export function buildWorldArtKit(): WorldArtIsoKit {
  const tiles: Record<string, HTMLCanvasElement> = {};
  const props: Record<string, HTMLCanvasElement> = {};

  tile(tiles, "grass", (ctx) => {
    diamond(ctx, 48, 28, 94, 48, shade(H.grass, -0.06));
    diamond(ctx, 48, 27, 90, 44, H.grass);
    speckles(ctx, 16, 12, 64, 32, "rgba(90,140,70,.28)", 18, 2);
    speckles(ctx, 22, 16, 52, 24, "rgba(20,40,18,.12)", 8, 9);
  });
  tile(tiles, "moss", (ctx) => {
    diamond(ctx, 48, 28, 92, 46, V.deep);
    diamond(ctx, 48, 26, 78, 36, V.moss);
    speckles(ctx, 18, 12, 60, 30, "rgba(70,130,80,.5)", 22, 4);
  });
  tile(tiles, "stone", (ctx) => {
    diamond(ctx, 48, 28, 92, 46, shade(H.stone2, -0.12));
    diamond(ctx, 48, 26, 80, 38, H.stone);
    ctx.strokeStyle = "rgba(90,70,48,.28)";
    ctx.beginPath();
    ctx.moveTo(48, 10);
    ctx.lineTo(72, 22);
    ctx.lineTo(48, 34);
    ctx.lineTo(24, 22);
    ctx.closePath();
    ctx.stroke();
    speckles(ctx, 20, 14, 56, 26, "rgba(90,80,68,.28)", 16, 3);
  });
  tile(tiles, "path", (ctx) => {
    diamond(ctx, 48, 28, 92, 46, shade(H.path, -0.16));
    diamond(ctx, 48, 26, 74, 34, H.path);
    speckles(ctx, 22, 16, 52, 22, "rgba(80,60,40,.3)", 14, 6);
  });
  tile(tiles, "plaza", (ctx) => {
    diamond(ctx, 48, 28, 94, 48, mix(H.stone2, H.ivory, 0.35));
    diamond(ctx, 48, 26, 86, 40, mix(H.ivory, H.stone, 0.28));
    ctx.strokeStyle = "rgba(201,162,74,.18)";
    ctx.beginPath();
    ctx.ellipse(48, 28, 16, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
  });
  tile(tiles, "earth", (ctx) => {
    diamond(ctx, 48, 28, 92, 46, V.mud);
    diamond(ctx, 48, 26, 76, 34, V.earth);
  });
  tile(tiles, "water", (ctx) => {
    diamond(ctx, 48, 28, 92, 46, shade(V.water, -0.25));
    diamond(ctx, 48, 25, 74, 32, V.water);
    ctx.strokeStyle = "rgba(200,240,245,.45)";
    ctx.beginPath();
    ctx.moveTo(28, 28);
    ctx.quadraticCurveTo(48, 20, 68, 30);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.22)";
    ctx.beginPath();
    ctx.moveTo(34, 32);
    ctx.quadraticCurveTo(50, 36, 64, 30);
    ctx.stroke();
  });

  prop(props, "houseA", 192, 188, (ctx) => paintHouse(ctx, "A"));
  prop(props, "houseB", 216, 196, (ctx) => paintHouse(ctx, "B"));
  prop(props, "houseC", 236, 188, (ctx) => paintHouse(ctx, "C"));

  prop(props, "stall", 148, 128, (ctx) => {
    blobShadow(ctx, 74, 116, 48, 10, 0.28);
    isoBox(ctx, 74, 102, 88, 52, 16, H.wood);
    isoBox(ctx, 74, 70, 108, 62, 10, H.terracotta, { top: shade(H.roof, 0.12), trim: H.gold });
    isoBox(ctx, 52, 108, 18, 14, 10, H.gold);
    isoBox(ctx, 92, 110, 16, 14, 8, H.foliage);
    ctx.fillStyle = "rgba(184,72,56,.5)";
    ctx.beginPath();
    ctx.ellipse(74, 58, 46, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  prop(props, "shrine", 140, 150, (ctx) => {
    blobShadow(ctx, 70, 138, 42, 10, 0.26);
    isoBox(ctx, 70, 122, 84, 58, 14, mix(H.stone2, [90, 70, 110], 0.35), { top: mix(H.stone, [120, 90, 150], 0.2) });
    isoBox(ctx, 70, 104, 42, 30, 18, mix(H.stone2, [80, 60, 110], 0.4));
    crystal(ctx, 70, 62, 42, 72, [176, 120, 232]);
    ctx.fillStyle = "rgba(168,110,230,.2)";
    ctx.beginPath();
    ctx.arc(70, 70, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#C084FC";
    ctx.fillRect(48, 112, 4, 10);
    ctx.fillRect(88, 110, 4, 10);
  });

  prop(props, "core", 240, 248, (ctx) => {
    blobShadow(ctx, 120, 228, 70, 16, 0.34);
    ctx.fillStyle = "rgba(61,224,208,.12)";
    ctx.beginPath();
    ctx.ellipse(120, 214, 78, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    isoBox(ctx, 120, 210, 168, 118, 12, H.stone, { top: H.ivory, trim: H.gold });
    isoBox(ctx, 120, 194, 132, 92, 10, H.stone2, { top: H.ivory, trim: shade(H.gold, 0.1) });
    isoBox(ctx, 120, 178, 88, 62, 12, mix(H.stone2, H.wood, 0.2), { top: H.stone, trim: H.gold });
    ctx.strokeStyle = "rgba(61,224,208,.75)";
    ctx.lineWidth = 2.2;
    ctx.setLineDash([10, 7]);
    ctx.beginPath();
    ctx.ellipse(120, 148, 42, 14, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    crystal(ctx, 120, 96, 58, 108, H.cyan);
    crystal(ctx, 168, 108, 22, 36, shade(H.cyan, 0.15));
    crystal(ctx, 76, 116, 18, 30, shade(H.cyan, -0.05));
    crystal(ctx, 142, 72, 14, 24, mix(H.cyan, [255, 255, 255], 0.2));
    crystal(ctx, 98, 78, 12, 20, shade(H.cyan, 0.1));
    ctx.fillStyle = "#C9A24A";
    for (const [x, y] of [
      [78, 176],
      [162, 174],
      [120, 188],
      [96, 168],
      [144, 166],
    ]) {
      ctx.beginPath();
      ctx.arc(x, y, 2.1, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  prop(props, "gate", 230, 200, (ctx) => {
    blobShadow(ctx, 115, 186, 80, 14, 0.3);
    isoBox(ctx, 52, 158, 40, 42, 96, H.stone2, { top: H.ivory, trim: H.gold });
    isoBox(ctx, 178, 158, 40, 42, 96, H.stone2, { top: H.ivory, trim: H.gold });
    isoBox(ctx, 115, 70, 156, 48, 16, H.stone, { top: H.ivory, trim: H.gold });
    crystal(ctx, 115, 42, 28, 36, H.cyan, false);
    ctx.fillStyle = "rgba(12,14,16,.55)";
    ctx.beginPath();
    ctx.moveTo(78, 150);
    ctx.quadraticCurveTo(115, 118, 152, 150);
    ctx.lineTo(152, 178);
    ctx.lineTo(78, 178);
    ctx.fill();
    isoBox(ctx, 36, 170, 18, 16, 28, H.wood);
    isoBox(ctx, 194, 170, 18, 16, 28, H.wood);
    ctx.fillStyle = "#9B2C24";
    ctx.fillRect(40, 78, 10, 36);
    ctx.fillRect(180, 78, 10, 36);
  });

  prop(props, "arena", 168, 148, (ctx) => {
    blobShadow(ctx, 84, 136, 58, 12, 0.26);
    isoBox(ctx, 36, 118, 24, 24, 78, H.stone2, { top: H.ivory });
    isoBox(ctx, 132, 118, 24, 24, 78, H.stone2, { top: H.ivory });
    isoBox(ctx, 84, 52, 108, 32, 12, H.roof, { top: shade(H.roof, 0.12), trim: H.gold });
    ctx.fillStyle = "#9B2C24";
    ctx.fillRect(58, 62, 8, 40);
    ctx.fillRect(102, 62, 8, 40);
    ctx.fillStyle = "#C9A24A";
    ctx.fillRect(78, 48, 12, 8);
  });

  prop(props, "treeL", 140, 168, (ctx) => paintTree(ctx, 70, 150, 1, false));
  prop(props, "treeM", 120, 152, (ctx) => paintTree(ctx, 60, 136, 2, false));
  prop(props, "treeS", 112, 140, (ctx) => paintTree(ctx, 56, 124, 0, false));
  prop(props, "treeHavenA", 132, 160, (ctx) => paintTree(ctx, 66, 144, 0, false));
  prop(props, "treeHavenB", 148, 176, (ctx) => paintTree(ctx, 74, 158, 3, false));
  prop(props, "treeHavenC", 118, 148, (ctx) => paintTree(ctx, 59, 132, 2, false));
  prop(props, "treeVerdA", 150, 180, (ctx) => paintTree(ctx, 75, 162, 1, true));
  prop(props, "treeVerdB", 128, 168, (ctx) => paintTree(ctx, 64, 150, 3, true));
  prop(props, "treeVerdC", 160, 196, (ctx) => paintTree(ctx, 80, 176, 0, true));
  prop(props, "treeVerdD", 118, 154, (ctx) => paintTree(ctx, 59, 138, 2, true));

  prop(props, "planter", 78, 56, (ctx) => {
    isoBox(ctx, 39, 40, 50, 30, 10, H.wood, { top: H.foliage });
    ctx.fillStyle = "#3D8A48";
    ctx.beginPath();
    ctx.ellipse(39, 24, 12, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  prop(props, "bench", 78, 46, (ctx) => {
    isoBox(ctx, 39, 30, 56, 20, 6, H.wood);
    isoBox(ctx, 18, 38, 8, 10, 8, shade(H.wood, -0.15));
    isoBox(ctx, 58, 38, 8, 10, 8, shade(H.wood, -0.15));
  });
  prop(props, "crate", 52, 44, (ctx) => isoBox(ctx, 26, 28, 30, 22, 12, shade(H.gold, -0.25)));
  prop(props, "pot", 40, 40, (ctx) => isoBox(ctx, 20, 26, 20, 14, 8, H.roof, { top: H.foliage }));
  prop(props, "lamp", 44, 78, (ctx) => {
    isoBox(ctx, 22, 62, 8, 8, 32, H.wood);
    ctx.fillStyle = "rgba(255,196,90,.85)";
    ctx.beginPath();
    ctx.arc(22, 24, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,196,90,.18)";
    ctx.beginPath();
    ctx.arc(22, 24, 18, 0, Math.PI * 2);
    ctx.fill();
  });
  prop(props, "banner", 44, 88, (ctx) => {
    isoBox(ctx, 12, 72, 6, 6, 52, H.wood);
    ctx.fillStyle = "#9B2C24";
    ctx.fillRect(16, 18, 18, 32);
    ctx.fillStyle = "#C9A24A";
    ctx.fillRect(16, 18, 18, 4);
  });
  prop(props, "crystal", 52, 70, (ctx) => crystal(ctx, 26, 34, 28, 52, V.cyan));
  prop(props, "waystone", 110, 120, (ctx) => {
    blobShadow(ctx, 55, 108, 36, 10, 0.28);
    isoBox(ctx, 55, 88, 56, 36, 40, V.stone, { top: shade(V.stone, 0.12) });
    isoBox(ctx, 68, 58, 24, 16, 26, shade(V.stone, 0.08));
    ctx.fillStyle = "#3DE0D0";
    ctx.globalAlpha = 0.7;
    ctx.fillRect(48, 52, 5, 18);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#3D6A38";
    ctx.fillRect(32, 92, 28, 7);
    ctx.fillRect(60, 98, 22, 5);
  });
  prop(props, "hollow", 156, 124, (ctx) => {
    ctx.fillStyle = "#1A331C";
    ctx.beginPath();
    ctx.ellipse(78, 82, 64, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#243E22";
    ctx.beginPath();
    ctx.ellipse(44, 66, 34, 28, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(110, 68, 32, 26, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#07080C";
    ctx.beginPath();
    ctx.ellipse(78, 78, 18, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    crystal(ctx, 64, 70, 14, 22, V.cyan, false);
    crystal(ctx, 94, 74, 12, 18, V.highlight, false);
  });
  prop(props, "ruin", 96, 78, (ctx) => {
    isoBox(ctx, 34, 54, 26, 20, 24, V.stone);
    isoBox(ctx, 64, 58, 20, 16, 14, shade(V.stone, -0.1));
    ctx.fillStyle = "#355C32";
    ctx.fillRect(46, 32, 18, 6);
  });
  prop(props, "fence", 76, 40, (ctx) => {
    isoBox(ctx, 16, 26, 6, 6, 16, H.wood);
    isoBox(ctx, 58, 26, 6, 6, 16, H.wood);
    isoBox(ctx, 37, 18, 56, 8, 4, shade(H.wood, 0.12));
  });
  prop(props, "sign", 52, 60, (ctx) => {
    isoBox(ctx, 26, 48, 6, 6, 22, H.wood);
    isoBox(ctx, 26, 24, 32, 12, 4, shade(H.gold, 0.15));
  });

  prop(props, "bushA", 70, 48, (ctx) => {
    blobShadow(ctx, 35, 42, 22, 6, 0.2);
    treeCanopy(ctx, 35, 26, [
      { dx: 0, dy: 4, rx: 22, ry: 14, tone: H.foliage },
      { dx: -10, dy: 0, rx: 12, ry: 10, tone: shade(H.foliage, 0.12) },
    ]);
  });
  prop(props, "bushB", 64, 46, (ctx) => {
    treeCanopy(ctx, 32, 24, [{ dx: 0, dy: 2, rx: 20, ry: 14, tone: V.moss }]);
  });
  prop(props, "grassClump", 48, 32, (ctx) => {
    ctx.strokeStyle = "#3A6E44";
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.moveTo(24, 28);
      ctx.quadraticCurveTo(18 + i * 3, 16, 14 + i * 5, 8 + (i % 3));
      ctx.stroke();
    }
  });
  prop(props, "flowers", 48, 36, (ctx) => {
    ctx.fillStyle = "#3A6E44";
    ctx.fillRect(22, 18, 3, 14);
    ctx.fillStyle = "#E07A9A";
    ctx.beginPath();
    ctx.arc(23, 16, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#C9A24A";
    ctx.beginPath();
    ctx.arc(34, 20, 4, 0, Math.PI * 2);
    ctx.fill();
  });
  prop(props, "mushroom", 40, 42, (ctx) => {
    isoBox(ctx, 20, 32, 8, 8, 10, shade(H.ivory, -0.1));
    ctx.fillStyle = "#B45C48";
    ctx.beginPath();
    ctx.ellipse(20, 18, 14, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  prop(props, "rocks", 64, 40, (ctx) => {
    isoBox(ctx, 22, 26, 22, 14, 10, V.stone);
    isoBox(ctx, 42, 28, 16, 12, 8, shade(V.stone, -0.12));
  });
  prop(props, "log", 80, 36, (ctx) => isoBox(ctx, 40, 22, 58, 16, 8, H.wood, { top: shade(H.wood, 0.1) }));
  prop(props, "vine", 36, 70, (ctx) => {
    ctx.strokeStyle = "#2A6B3C";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(18, 8);
    ctx.quadraticCurveTo(28, 32, 12, 62);
    ctx.stroke();
  });

  return { tiles, props };
}
