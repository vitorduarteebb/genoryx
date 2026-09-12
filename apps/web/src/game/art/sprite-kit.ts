import * as Phaser from "phaser";

export const WORLD_SPRITE_SRC = {
  hunter: "/game/actors/gx-hunter.png",
  "hunter-walk-a": "/game/actors/gx-hunter-walk-a.png",
  "hunter-walk-b": "/game/actors/gx-hunter-walk-b.png",
  florune: "/game/actors/gx-florune.png",
  terranox: "/game/actors/gx-terranox.png",
  nympha: "/game/actors/gx-nympha.png",
  noctyr: "/game/actors/gx-noctyr.png",
  pyron: "/game/actors/gx-pyron.png",
} as const;

export type WorldSpriteKey = keyof typeof WORLD_SPRITE_SRC;

export function preloadWorldSprites(scene: Phaser.Scene) {
  for (const [key, src] of Object.entries(WORLD_SPRITE_SRC)) {
    scene.load.image(`raw-${key}`, src);
  }
}

export function ensureWorldSprites(scene: Phaser.Scene) {
  for (const key of Object.keys(WORLD_SPRITE_SRC) as WorldSpriteKey[]) {
    cutout(scene, `raw-${key}`, worldSpriteKey(key));
  }
}

export function worldSpriteKey(speciesOrRole: string) {
  return `gx-actor-${speciesOrRole}`;
}

export function hasWorldSprite(scene: Phaser.Scene, speciesOrRole: string) {
  return scene.textures.exists(worldSpriteKey(speciesOrRole));
}

export function addWorldSprite(scene: Phaser.Scene, kind: string, height: number) {
  if (!hasWorldSprite(scene, kind)) {
    return null;
  }
  const image = scene.add.image(0, 0, worldSpriteKey(kind));
  const source = image.texture.getSourceImage() as CanvasImageSource;
  const width = imageWidth(source);
  const fullHeight = imageHeight(source) || 1;
  image.setDisplaySize(height * (width / fullHeight), height);
  image.setOrigin(0.5, 1);
  return image;
}

function cutout(scene: Phaser.Scene, from: string, to: string) {
  if (scene.textures.exists(to) || !scene.textures.exists(from)) {
    return;
  }
  const source = scene.textures.get(from).getSourceImage() as CanvasImageSource;
  const width = imageWidth(source);
  const height = imageHeight(source);
  if (width < 8 || height < 8) {
    return;
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  ctx.drawImage(source, 0, 0);
  floodClear(ctx, width, height);
  const trimmed = trimCanvas(canvas);
  scene.textures.addCanvas(to, trimmed);
}

function floodClear(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const pixels = ctx.getImageData(0, 0, width, height);
  const data = pixels.data;
  const seen = new Uint8Array(width * height);
  const queue = [0, width - 1, (height - 1) * width, height * width - 1];
  const isBackdrop = (index: number) => {
    const i = index * 4;
    return data[i] < 28 && data[i + 1] < 28 && data[i + 2] < 28;
  };
  while (queue.length) {
    const index = queue.pop();
    if (index === undefined || seen[index] || !isBackdrop(index)) {
      continue;
    }
    seen[index] = 1;
    data[index * 4 + 3] = 0;
    const x = index % width;
    const y = (index - x) / width;
    if (x > 0) queue.push(index - 1);
    if (x + 1 < width) queue.push(index + 1);
    if (y > 0) queue.push(index - width);
    if (y + 1 < height) queue.push(index + width);
  }
  ctx.putImageData(pixels, 0, 0);
}

function trimCanvas(source: HTMLCanvasElement) {
  const ctx = source.getContext("2d");
  if (!ctx) {
    return source;
  }
  const pixels = ctx.getImageData(0, 0, source.width, source.height).data;
  let minX = source.width;
  let minY = source.height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      if (pixels[(y * source.width + x) * 4 + 3] > 18) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX) {
    return source;
  }
  const pad = 6;
  const sx = Math.max(0, minX - pad);
  const sy = Math.max(0, minY - pad);
  const sw = Math.min(source.width - sx, maxX - minX + 1 + pad * 2);
  const sh = Math.min(source.height - sy, maxY - minY + 1 + pad * 2);
  const trimmed = document.createElement("canvas");
  trimmed.width = sw;
  trimmed.height = sh;
  trimmed.getContext("2d")?.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);
  return trimmed;
}

function imageWidth(image: CanvasImageSource) {
  if (image instanceof HTMLImageElement) {
    return image.naturalWidth || image.width;
  }
  if (image instanceof HTMLCanvasElement) {
    return image.width;
  }
  return (image as { width: number }).width;
}

function imageHeight(image: CanvasImageSource) {
  if (image instanceof HTMLImageElement) {
    return image.naturalHeight || image.height;
  }
  if (image instanceof HTMLCanvasElement) {
    return image.height;
  }
  return (image as { height: number }).height;
}
