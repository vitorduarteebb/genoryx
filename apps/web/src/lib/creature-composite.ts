import { assemblePhenotype, partSrc, phenotypePartRels, type CreaturePhenotype, type PhenotypeInput } from "@nexora/config";
import { bodyRigFor, headRigFor, tailPlugFor, type Socket, type Vec } from "./creature-rigs";

const ELEMENT_TINT: Record<string, string> = {
  FIRE: "rgba(255, 107, 53, 0.22)",
  WATER: "rgba(78, 196, 212, 0.2)",
  NATURE: "rgba(93, 190, 110, 0.2)",
  EARTH: "rgba(196, 160, 106, 0.22)",
  ELECTRIC: "rgba(242, 212, 107, 0.2)",
  ICE: "rgba(168, 216, 240, 0.2)",
  LIGHT: "rgba(246, 231, 176, 0.16)",
  DARK: "rgba(122, 94, 168, 0.22)",
  ARCANE: "rgba(155, 126, 224, 0.18)",
};

const ELEMENT_GLOW: Record<string, [string, string]> = {
  FIRE: ["rgba(255, 140, 70, 0.95)", "rgba(255, 240, 200, 0.95)"],
  WATER: ["rgba(70, 210, 230, 0.95)", "rgba(230, 255, 255, 0.95)"],
  NATURE: ["rgba(150, 230, 100, 0.95)", "rgba(240, 255, 210, 0.95)"],
  EARTH: ["rgba(230, 190, 90, 0.95)", "rgba(255, 245, 210, 0.95)"],
  ELECTRIC: ["rgba(242, 212, 80, 0.95)", "rgba(255, 255, 220, 0.95)"],
  ICE: ["rgba(170, 220, 245, 0.95)", "rgba(255, 255, 255, 0.95)"],
  LIGHT: ["rgba(246, 231, 176, 0.95)", "rgba(255, 255, 245, 0.95)"],
  DARK: ["rgba(170, 120, 230, 0.95)", "rgba(240, 220, 255, 0.95)"],
  ARCANE: ["rgba(180, 150, 240, 0.95)", "rgba(245, 235, 255, 0.95)"],
};

type BodyBox = { x: number; y: number; w: number; h: number };

const preparedCache = new WeakMap<object, Map<string, HTMLCanvasElement>>();

function imageSize(image: CanvasImageSource) {
  if (image instanceof HTMLImageElement) {
    return { w: image.naturalWidth || image.width, h: image.naturalHeight || image.height };
  }
  if (image instanceof HTMLCanvasElement) {
    return { w: image.width, h: image.height };
  }
  return { w: (image as { width: number }).width, h: (image as { height: number }).height };
}

function knockoutAndCrop(source: CanvasImageSource, threshold = 28) {
  const { w, h } = imageSize(source);
  const src = document.createElement("canvas");
  src.width = Math.max(1, w);
  src.height = Math.max(1, h);
  const sctx = src.getContext("2d");
  if (!sctx) {
    return src;
  }
  sctx.drawImage(source, 0, 0);
  const pixels = sctx.getImageData(0, 0, src.width, src.height);
  const data = pixels.data;
  let minX = src.width;
  let minY = src.height;
  let maxX = 0;
  let maxY = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] + data[i + 1] + data[i + 2] < threshold * 3) {
      data[i + 3] = 0;
    }
    if (data[i + 3] > 16) {
      const p = i / 4;
      const x = p % src.width;
      const y = (p - x) / src.width;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  sctx.putImageData(pixels, 0, 0);
  if (maxX < minX) {
    return src;
  }
  const cw = maxX - minX + 1;
  const ch = maxY - minY + 1;
  const cropped = document.createElement("canvas");
  cropped.width = cw;
  cropped.height = ch;
  cropped.getContext("2d")?.drawImage(src, minX, minY, cw, ch, 0, 0, cw, ch);
  return cropped;
}

function meanColor(canvas: HTMLCanvasElement): [number, number, number] {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return [72, 68, 60];
  }
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let i = 0; i < pixels.length; i += 32) {
    if (pixels[i + 3] > 20) {
      r += pixels[i];
      g += pixels[i + 1];
      b += pixels[i + 2];
      n += 1;
    }
  }
  if (!n) {
    return [72, 68, 60];
  }
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
}

function fillSocket(ctx: CanvasRenderingContext2D, box: BodyBox, socket: Socket, rgb: [number, number, number]) {
  const [r, g, b] = rgb;
  const cx = box.x + socket.x * box.w;
  const cy = box.y + socket.y * box.h;
  const rx = Math.max(3, socket.r * box.w * 1.05);
  const ry = Math.max(3, socket.r * box.h * 0.95);
  ctx.fillStyle = `rgb(${Math.min(255, r + 42)}, ${Math.min(255, g + 36)}, ${Math.min(255, b + 28)})`;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function applyTint(canvas: HTMLCanvasElement, tint: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "source-over";
}

function preparePart(source: CanvasImageSource, tint?: string) {
  const bucket = preparedCache.get(source as object) ?? new Map<string, HTMLCanvasElement>();
  const key = tint ?? "";
  const hit = bucket.get(key);
  if (hit) {
    return hit;
  }
  const cropped = knockoutAndCrop(source);
  if (tint) {
    applyTint(cropped, tint);
  }
  bucket.set(key, cropped);
  preparedCache.set(source as object, bucket);
  return cropped;
}

function fitStage(image: HTMLCanvasElement, stage: BodyRigStage, size: number): BodyBox {
  const boxW = stage.w * size;
  const boxH = stage.h * size;
  const scale = Math.min(boxW / image.width, boxH / image.height);
  const w = Math.max(8, image.width * scale);
  const h = Math.max(8, image.height * scale);
  return {
    x: stage.x * size + (boxW - w) / 2,
    y: stage.y * size + (boxH - h) / 2,
    w,
    h,
  };
}

type BodyRigStage = { x: number; y: number; w: number; h: number };

function pastePlug(
  ctx: CanvasRenderingContext2D,
  part: HTMLCanvasElement,
  body: BodyBox,
  socket: Vec,
  plug: Vec,
  scale: number,
): BodyBox {
  const destW = Math.max(8, body.w * scale);
  const destH = Math.max(8, destW * (part.height / part.width));
  const x = body.x + socket.x * body.w - plug.x * destW;
  const y = body.y + socket.y * body.h - plug.y * destH;
  ctx.drawImage(part, x, y, destW, destH);
  return { x, y, w: destW, h: destH };
}

function drawPaw(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, rgb: [number, number, number]) {
  const [r, g, b] = rgb;
  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.beginPath();
  ctx.ellipse(x, y, radius, radius * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  for (const ox of [-0.62, 0, 0.62]) {
    ctx.beginPath();
    ctx.ellipse(x + ox * radius, y + radius * 0.55, radius * 0.22, radius * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEyeGlows(ctx: CanvasRenderingContext2D, head: BodyBox, eyes: Socket[], element: string) {
  const [rim, core] = ELEMENT_GLOW[element] ?? ELEMENT_GLOW.ARCANE;
  for (const eye of eyes) {
    const cx = head.x + eye.x * head.w;
    const cy = head.y + eye.y * head.h;
    const rr = Math.max(2, eye.r * head.w);
    const glow = ctx.createRadialGradient(cx, cy, rr * 0.15, cx, cy, rr);
    glow.addColorStop(0, core);
    glow.addColorStop(0.45, rim);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rr, rr * 0.78, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function paintPhenotype(
  ctx: CanvasRenderingContext2D,
  images: Partial<Record<"tail" | "body" | "limbs" | "head" | "horns" | "eyes", CanvasImageSource>>,
  phenotype: CreaturePhenotype,
  size: number,
  element = "ARCANE",
) {
  ctx.clearRect(0, 0, size, size);
  if (!images.body) {
    return;
  }

  const rig = bodyRigFor(phenotype.body);
  const headRig = headRigFor(phenotype.head);
  const tint = ELEMENT_TINT[element] ?? ELEMENT_TINT.ARCANE;
  const body = preparePart(images.body, tint);
  const flesh = meanColor(body);
  const box = fitStage(body, rig.stage, size);

  ctx.fillStyle = "rgba(0,0,0,0.38)";
  ctx.beginPath();
  ctx.ellipse(size * 0.5, size * 0.9, size * 0.22, size * 0.045, 0, 0, Math.PI * 2);
  ctx.fill();

  if (images.tail && rig.useTail && rig.tail && phenotype.tail) {
    const tail = preparePart(images.tail, tint);
    pastePlug(ctx, tail, box, rig.tail, tailPlugFor(phenotype.tail), rig.tailScale ?? 0.34);
  }

  ctx.drawImage(body, box.x, box.y, box.w, box.h);
  fillSocket(ctx, box, rig.neck, flesh);
  for (const cap of rig.caps) {
    fillSocket(ctx, box, cap, flesh);
  }
  for (const foot of rig.feet) {
    drawPaw(ctx, box.x + foot.x * box.w, box.y + foot.y * box.h, box.w * 0.042, flesh);
  }

  if (images.head) {
    const head = preparePart(images.head);
    const headBox = pastePlug(ctx, head, box, rig.neck, headRig.plug, rig.headScale);
    drawEyeGlows(ctx, headBox, headRig.eyes, element);
  }
}

const imageCache = new Map<string, Promise<HTMLImageElement>>();

export function loadPartImage(rel: string) {
  const src = partSrc(rel);
  const cached = imageCache.get(src);
  if (cached) {
    return cached;
  }
  const pending = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`part missing: ${rel}`));
    image.src = src;
  });
  imageCache.set(src, pending);
  return pending;
}

export async function loadPhenotypeImages(phenotype: CreaturePhenotype) {
  const rels = phenotypePartRels(phenotype);
  const loaded = await Promise.all(
    rels.map(async (rel) => {
      try {
        return [rel, await loadPartImage(rel)] as const;
      } catch {
        return [rel, null] as const;
      }
    }),
  );
  const byRel = new Map(loaded);
  const pick = (rel: string | null) => {
    if (!rel) return undefined;
    return byRel.get(rel) ?? undefined;
  };
  return {
    tail: pick(phenotype.tail),
    body: pick(phenotype.body),
    head: pick(phenotype.head),
  };
}

export function phenotypeFromCreature(input: PhenotypeInput) {
  return assemblePhenotype(input);
}
