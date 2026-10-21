import type { WorldAssetDef } from "@nexora/config";

const images = new Map<string, HTMLImageElement | "missing">();
const inflight = new Map<string, Promise<HTMLImageElement | null>>();

function pickSrc(def: WorldAssetDef, dpr: number) {
  return dpr >= 1.5 && def.src2x ? def.src2x : def.src;
}

function loadImage(src: string) {
  const cached = images.get(src);
  if (cached === "missing") return Promise.resolve(null);
  if (cached) return Promise.resolve(cached);
  const pending = inflight.get(src);
  if (pending) return pending;
  const job = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      images.set(src, img);
      inflight.delete(src);
      resolve(img);
    };
    img.onerror = () => {
      images.set(src, "missing");
      inflight.delete(src);
      resolve(null);
    };
    img.src = src;
  });
  inflight.set(src, job);
  return job;
}

export async function loadWorldAssetImage(def: WorldAssetDef, dpr = 1) {
  if (def.status !== "READY") return null;
  const img = await loadImage(pickSrc(def, dpr));
  if (img || !def.src2x || dpr < 1.5) return img;
  return loadImage(def.src);
}

export function peekWorldAssetImage(def: WorldAssetDef, dpr = 1) {
  const hit = images.get(pickSrc(def, dpr));
  if (hit && hit !== "missing") return hit;
  const fallback = images.get(def.src);
  return fallback && fallback !== "missing" ? fallback : null;
}

export function unloadWorldImages(prefix: string) {
  for (const [src, value] of images) {
    if (!src.startsWith(prefix)) continue;
    if (value !== "missing") value.src = "";
    images.delete(src);
  }
}
