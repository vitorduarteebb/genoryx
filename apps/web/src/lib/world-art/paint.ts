import { havenPalette, verdantisPalette } from "@nexora/config";

export type RGB = [number, number, number];

export function hexToRgb(hex: string): RGB {
  const raw = hex.replace("#", "");
  return [parseInt(raw.slice(0, 2), 16), parseInt(raw.slice(2, 4), 16), parseInt(raw.slice(4, 6), 16)];
}

export function rgbHex(rgb: RGB) {
  return `rgb(${Math.round(rgb[0])},${Math.round(rgb[1])},${Math.round(rgb[2])})`;
}

export function mix(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export function shade(c: RGB, t: number): RGB {
  return mix(c, t > 0 ? [255, 255, 255] : [0, 0, 0], Math.abs(t));
}

export function canvas(w: number, h: number) {
  const node = document.createElement("canvas");
  node.width = w;
  node.height = h;
  const ctx = node.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  return { node, ctx };
}

export const H = {
  stone: hexToRgb(havenPalette.stonePrimary),
  stone2: hexToRgb(havenPalette.stoneSecondary),
  ivory: hexToRgb(havenPalette.ivory),
  wood: hexToRgb(havenPalette.wood),
  roof: hexToRgb(havenPalette.roof),
  gold: hexToRgb(havenPalette.goldAccent),
  foliage: hexToRgb(havenPalette.foliage),
  cyan: hexToRgb(havenPalette.genesisCyan),
  amber: hexToRgb(havenPalette.windowGlow),
  shadow: hexToRgb(havenPalette.shadow),
  grass: hexToRgb(havenPalette.grass),
  path: hexToRgb(havenPalette.path),
  earth: hexToRgb(havenPalette.earthBorder),
  terracotta: hexToRgb(havenPalette.terracotta),
};

export const V = {
  deep: hexToRgb(verdantisPalette.deepGreen),
  forest: hexToRgb(verdantisPalette.forestGreen),
  moss: hexToRgb(verdantisPalette.moss),
  earth: hexToRgb(verdantisPalette.earth),
  stone: hexToRgb(verdantisPalette.ancientStone),
  water: hexToRgb(verdantisPalette.water),
  cyan: hexToRgb(verdantisPalette.magicCyan),
  flower: hexToRgb(verdantisPalette.flowerAccent),
  highlight: hexToRgb(verdantisPalette.canopyHighlight),
  mud: hexToRgb(verdantisPalette.mud),
};

export function fillPoly(ctx: CanvasRenderingContext2D, poly: Array<[number, number]>, color: RGB, alpha = 1) {
  ctx.beginPath();
  ctx.moveTo(poly[0][0], poly[0][1]);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]);
  ctx.closePath();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = rgbHex(color);
  ctx.fill();
  ctx.globalAlpha = 1;
}

export function isoBox(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  d: number,
  h: number,
  color: RGB,
  opts?: { top?: RGB; left?: RGB; right?: RGB; stroke?: string; trim?: RGB },
) {
  const hw = w / 2;
  const hd = d / 2;
  const n: [number, number] = [cx, cy - h - hd / 2];
  const e: [number, number] = [cx + hw, cy - h];
  const s: [number, number] = [cx, cy - h + hd / 2];
  const west: [number, number] = [cx - hw, cy - h];
  const eb: [number, number] = [e[0], e[1] + h];
  const sb: [number, number] = [s[0], s[1] + h];
  const wb: [number, number] = [west[0], west[1] + h];
  fillPoly(ctx, [west, s, sb, wb], opts?.left ?? shade(color, -0.18));
  fillPoly(ctx, [e, s, sb, eb], opts?.right ?? shade(color, -0.34));
  fillPoly(ctx, [n, e, s, west], opts?.top ?? shade(color, 0.16));
  if (opts?.trim) {
    ctx.strokeStyle = rgbHex(opts.trim);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(n[0], n[1]);
    ctx.lineTo(e[0], e[1]);
    ctx.lineTo(s[0], s[1]);
    ctx.lineTo(west[0], west[1]);
    ctx.closePath();
    ctx.stroke();
  }
  if (opts?.stroke) {
    ctx.strokeStyle = opts.stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

export function diamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number, color: RGB, alpha = 1) {
  fillPoly(ctx, [
    [cx, cy - h / 2],
    [cx + w / 2, cy],
    [cx, cy + h / 2],
    [cx - w / 2, cy],
  ], color, alpha);
}

export function blobShadow(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, alpha = 0.28) {
  ctx.fillStyle = `rgba(12,10,8,${alpha})`;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function speckles(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  count: number,
  seed: number,
) {
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    const px = x + ((Math.sin(seed + i * 12.9898) * 43758.5453) % 1) * w;
    const py = y + ((Math.sin(seed + i * 78.233) * 23421.631) % 1) * h;
    ctx.fillRect(px, py, 1.4, 1.4);
  }
}

export function crystal(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  color: RGB,
  glow = true,
) {
  if (glow) {
    ctx.fillStyle = rgbHex(mix(color, [255, 255, 255], 0.2));
    ctx.globalAlpha = 0.18;
    ctx.beginPath();
    ctx.ellipse(cx, cy + h * 0.12, w * 0.72, h * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  fillPoly(ctx, [
    [cx, cy - h * 0.52],
    [cx + w * 0.28, cy - h * 0.12],
    [cx + w * 0.18, cy + h * 0.38],
    [cx, cy + h * 0.48],
    [cx - w * 0.16, cy + h * 0.36],
    [cx - w * 0.32, cy - h * 0.08],
  ], color);
  fillPoly(ctx, [
    [cx, cy - h * 0.52],
    [cx + w * 0.12, cy - h * 0.08],
    [cx, cy + h * 0.12],
    [cx - w * 0.08, cy - h * 0.04],
  ], shade(color, 0.35), 0.7);
}

function leafLobe(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  tilt: number,
  tone: RGB,
  seed: number,
) {
  const light=ctx.createRadialGradient(cx-rx*.32,cy-ry*.4,1,cx,cy,rx*1.25);
  light.addColorStop(0,rgbHex(shade(tone,.22)));light.addColorStop(.6,rgbHex(tone));light.addColorStop(1,rgbHex(shade(tone,-.24)));
  ctx.fillStyle = light;
  ctx.beginPath();
  const n = 28;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2 + tilt;
    const jig = 0.86 + Math.abs(Math.sin(seed + i * 1.73)) * 0.16;
    const x = cx + Math.cos(a) * rx * jig;
    const y = cy + Math.sin(a) * ry * jig;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.save();ctx.clip();
  for(let i=0;i<48;i++){const a=i*2.399+seed,r=Math.sqrt((i+.5)/48);const x=cx+Math.cos(a)*rx*r,y=cy+Math.sin(a)*ry*r;ctx.fillStyle=rgbHex(shade(tone,i%3===0?.25:-.10));ctx.globalAlpha=.36;ctx.beginPath();ctx.ellipse(x,y,1.4+rx*.04,.9+ry*.03,-.45,0,Math.PI*2);ctx.fill();}
  ctx.restore();
}

export function treeCanopy(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  lobes: Array<{ dx: number; dy: number; rx: number; ry: number; tilt?: number; tone: RGB }>,
) {
  lobes.forEach((lobe, i) => {
    leafLobe(ctx, cx + lobe.dx, cy + lobe.dy, lobe.rx, lobe.ry, lobe.tilt ?? 0, lobe.tone, 2.4 + i * 1.9);
  });
}

export function roofStack(ctx:CanvasRenderingContext2D,cx:number,cy:number,w:number,d:number,color:RGB){
 const rise=24;
 const north:[number,number]=[cx,cy-d*.28],east:[number,number]=[cx+w*.54,cy+8],south:[number,number]=[cx,cy+d*.32+8],west:[number,number]=[cx-w*.54,cy+8];
 const a:[number,number]=[cx-w*.12,cy-d*.18-rise],b:[number,number]=[cx+w*.12,cy+d*.18-rise];
 fillPoly(ctx,[west,south,east,north],shade(H.wood,-.24));
 const panels:Array<{p:Array<[number,number]>;tone:RGB}>=[{p:[north,east,b,a],tone:shade(color,-.28)},{p:[west,north,a],tone:shade(color,-.08)},{p:[west,south,b,a],tone:shade(color,.08)},{p:[south,east,b],tone:shade(color,-.15)}];
 for(const panel of panels){
  fillPoly(ctx,panel.p,panel.tone);ctx.save();ctx.clip();
  for(let y=cy-rise-d*.3;y<cy+d*.4+10;y+=7){ctx.strokeStyle="rgba(41,25,27,.34)";ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(cx-w,y);ctx.lineTo(cx+w,y+13);ctx.stroke();for(let x=cx-w;x<cx+w;x+=11){ctx.beginPath();ctx.moveTo(x+(Math.round(y/7)%2)*5,y);ctx.lineTo(x+4+(Math.round(y/7)%2)*5,y+7);ctx.stroke();}}
  ctx.restore();
 }
 ctx.strokeStyle=rgbHex(shade(color,.38));ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();
 ctx.strokeStyle=rgbHex(shade(H.wood,-.15));ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(...west);ctx.lineTo(...south);ctx.lineTo(...east);ctx.stroke();
}
