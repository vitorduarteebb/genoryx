import * as Phaser from "phaser";
import { mulberry32 } from "./rng";

function make(
  scene: Phaser.Scene,
  key: string,
  w: number,
  h: number,
  paint: (ctx: CanvasRenderingContext2D, rng: () => number) => void,
  seed: number,
) {
  if (scene.textures.exists(key)) {
    return key;
  }
  const texture = scene.textures.createCanvas(key, w, h);
  if (!texture) {
    return key;
  }
  paint(texture.getContext(), mulberry32(seed));
  texture.refresh();
  return key;
}

function noise(ctx: CanvasRenderingContext2D, rng: () => number, w: number, h: number, alpha: number) {
  const data = ctx.getImageData(0, 0, w, h);
  for (let i = 0; i < data.data.length; i += 4) {
    const n = (rng() - 0.5) * 28;
    data.data[i] = Math.max(0, Math.min(255, data.data[i] + n));
    data.data[i + 1] = Math.max(0, Math.min(255, data.data[i + 1] + n));
    data.data[i + 2] = Math.max(0, Math.min(255, data.data[i + 2] + n));
    data.data[i + 3] = Math.min(255, data.data[i + 3] + (rng() < 0.08 ? 8 : 0));
  }
  ctx.putImageData(data, 0, 0);
  ctx.globalAlpha = alpha;
}

export function ensurePaintKit(scene: Phaser.Scene) {
  make(
    scene,
    "gx-moss",
    256,
    256,
    (ctx, rng) => {
      ctx.fillStyle = "#0a120e";
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 90; i += 1) {
        ctx.globalAlpha = 0.04 + rng() * 0.1;
        ctx.fillStyle = rng() > 0.45 ? "#15241c" : "#0e1c16";
        ctx.beginPath();
        ctx.ellipse(rng() * 256, rng() * 256, 18 + rng() * 50, 10 + rng() * 28, rng() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = 0; i < 40; i += 1) {
        ctx.globalAlpha = 0.05;
        ctx.fillStyle = "#1c3326";
        ctx.beginPath();
        ctx.ellipse(rng() * 256, rng() * 256, 6 + rng() * 16, 3 + rng() * 8, rng(), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      noise(ctx, rng, 256, 256, 1);
    },
    101,
  );

  make(
    scene,
    "gx-soil",
    256,
    256,
    (ctx, rng) => {
      ctx.fillStyle = "#1c1610";
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 70; i += 1) {
        ctx.globalAlpha = 0.08 + rng() * 0.12;
        ctx.fillStyle = rng() > 0.5 ? "#2a2218" : "#3a2c20";
        ctx.beginPath();
        ctx.ellipse(rng() * 256, rng() * 256, 20 + rng() * 40, 8 + rng() * 16, rng(), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      noise(ctx, rng, 256, 256, 1);
    },
    111,
  );

  make(
    scene,
    "gx-canopy",
    180,
    200,
    (ctx, rng) => {
      ctx.clearRect(0, 0, 180, 200);
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath();
      ctx.ellipse(92, 188, 58, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1a120c";
      ctx.fillRect(82, 118, 14, 68);
      ctx.fillStyle = "#2a1c12";
      ctx.fillRect(86, 118, 4, 68);
      const blobs = [
        [90, 88, 62, "#0c1a12"],
        [62, 96, 48, "#122218"],
        [118, 94, 50, "#0e2016"],
        [78, 62, 44, "#163024"],
        [108, 58, 40, "#1a3828"],
        [94, 48, 36, "#0a1810"],
      ] as const;
      for (const [x, y, r, color] of blobs) {
        ctx.globalAlpha = 0.88;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(x + (rng() - 0.5) * 6, y, r * (0.9 + rng() * 0.15), r * 0.72, rng() * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = "#7ee0d6";
      ctx.beginPath();
      ctx.arc(108, 54, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    },
    121,
  );

  make(
    scene,
    "gx-crystal",
    88,
    140,
    (ctx) => {
      ctx.clearRect(0, 0, 88, 140);
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.beginPath();
      ctx.ellipse(44, 128, 22, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      const glow = ctx.createLinearGradient(44, 10, 44, 128);
      glow.addColorStop(0, "rgba(210, 246, 240, 0.95)");
      glow.addColorStop(0.35, "rgba(80, 196, 188, 0.85)");
      glow.addColorStop(1, "rgba(18, 48, 52, 0.95)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.moveTo(44, 8);
      ctx.lineTo(68, 78);
      ctx.lineTo(52, 126);
      ctx.lineTo(36, 126);
      ctx.lineTo(20, 80);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(228,195,106,0.28)";
      ctx.beginPath();
      ctx.moveTo(44, 16);
      ctx.lineTo(54, 74);
      ctx.lineTo(44, 110);
      ctx.lineTo(40, 74);
      ctx.closePath();
      ctx.fill();
    },
    131,
  );

  make(
    scene,
    "gx-ruin",
    220,
    170,
    (ctx) => {
      ctx.clearRect(0, 0, 220, 170);
      ctx.fillStyle = "rgba(0,0,0,0.38)";
      ctx.beginPath();
      ctx.ellipse(110, 158, 90, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2a2620";
      ctx.fillRect(18, 88, 184, 62);
      ctx.fillStyle = "#3a3630";
      ctx.fillRect(28, 98, 164, 18);
      ctx.fillStyle = "#1c1a16";
      ctx.fillRect(36, 28, 22, 70);
      ctx.fillRect(98, 8, 20, 90);
      ctx.fillRect(158, 38, 20, 60);
      ctx.fillStyle = "#4a463c";
      ctx.fillRect(36, 28, 22, 8);
      ctx.fillRect(98, 8, 20, 8);
      ctx.fillStyle = "rgba(126,224,214,0.18)";
      ctx.fillRect(100, 40, 16, 4);
      ctx.fillRect(100, 52, 16, 4);
    },
    141,
  );

  make(
    scene,
    "gx-boulder",
    110,
    70,
    (ctx, rng) => {
      ctx.clearRect(0, 0, 110, 70);
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath();
      ctx.ellipse(55, 62, 40, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2c281f";
      ctx.beginPath();
      ctx.ellipse(54, 40, 46, 22, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#3c382c";
      ctx.beginPath();
      ctx.ellipse(48, 34, 22, 12, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = "#e4c36a";
      ctx.beginPath();
      ctx.arc(62, 30, 5 + rng() * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    },
    151,
  );

  make(
    scene,
    "gx-grade",
    1280,
    720,
    (ctx) => {
      const g = ctx.createRadialGradient(640, 430, 80, 640, 360, 780);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(0.45, "rgba(6,10,12,0.12)");
      g.addColorStop(0.75, "rgba(4,8,10,0.48)");
      g.addColorStop(1, "rgba(2,4,6,0.82)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 1280, 720);
      const wash = ctx.createLinearGradient(0, 0, 0, 720);
      wash.addColorStop(0, "rgba(18, 36, 40, 0.28)");
      wash.addColorStop(0.45, "rgba(0,0,0,0)");
      wash.addColorStop(1, "rgba(8, 6, 4, 0.22)");
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, 1280, 720);
    },
    161,
  );
}

export function spr(scene: Phaser.Scene, key: string, x: number, y: number, scale = 1, depth?: number) {
  const image = scene.add.image(x, y, key).setScale(scale).setOrigin(0.5, 1);
  image.setDepth(depth ?? 180 + y);
  return image;
}
