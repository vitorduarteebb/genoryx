import type { WorldMapKey } from "@nexora/types";
import * as Phaser from "phaser";
import { hexCss, MAP_THEME } from "./palette";
import { mulberry32 } from "./rng";

function canvasTexture(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  paint: (ctx: CanvasRenderingContext2D, rng: () => number) => void,
  seed: number,
) {
  if (scene.textures.exists(key)) {
    return;
  }
  const texture = scene.textures.createCanvas(key, width, height);
  if (!texture) {
    return;
  }
  paint(texture.getContext(), mulberry32(seed));
  texture.refresh();
}

export function ensureWorldTextures(scene: Phaser.Scene) {
  canvasTexture(
    scene,
    "world-vignette",
    1280,
    720,
    (ctx) => {
      const glow = ctx.createRadialGradient(640, 400, 160, 640, 360, 820);
      glow.addColorStop(0, "rgba(0,0,0,0)");
      glow.addColorStop(0.55, "rgba(7,6,12,0.06)");
      glow.addColorStop(0.82, "rgba(7,6,12,0.38)");
      glow.addColorStop(1, "rgba(7,6,12,0.78)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, 1280, 720);
      const rim = ctx.createLinearGradient(0, 0, 0, 90);
      rim.addColorStop(0, "rgba(228,195,106,0.08)");
      rim.addColorStop(1, "rgba(228,195,106,0)");
      ctx.fillStyle = rim;
      ctx.fillRect(0, 0, 1280, 90);
    },
    1,
  );

  (["haven", "verdantis"] as const).forEach((mapKey: WorldMapKey, index) => {
    const theme = MAP_THEME[mapKey];
    canvasTexture(
      scene,
      `grass-${mapKey}`,
      96,
      96,
      (ctx, rng) => {
        ctx.fillStyle = hexCss(theme.grass);
        ctx.fillRect(0, 0, 96, 96);
        for (let i = 0; i < 18; i += 1) {
          ctx.globalAlpha = 0.06 + rng() * 0.12;
          ctx.fillStyle = hexCss(rng() > 0.5 ? theme.grassSpeck : theme.leaf);
          ctx.beginPath();
          ctx.ellipse(rng() * 96, rng() * 96, 16 + rng() * 28, 8 + rng() * 14, rng() * Math.PI, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 0.16;
        for (let i = 0; i < 7; i += 1) {
          ctx.fillStyle = hexCss(theme.leaf);
          ctx.beginPath();
          ctx.ellipse(rng() * 96, rng() * 96, 2 + rng() * 3, 3 + rng() * 4, rng() * Math.PI, 0, Math.PI * 2);
          ctx.fill();
        }
        if (mapKey === "haven") {
          ctx.globalAlpha = 0.22;
          ctx.fillStyle = hexCss(0xe4c36a);
          for (let i = 0; i < 2; i += 1) {
            ctx.beginPath();
            ctx.arc(8 + rng() * 80, 8 + rng() * 80, 1, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1;
      },
      11 + index,
    );

    canvasTexture(
      scene,
      `dirt-${mapKey}`,
      96,
      96,
      (ctx, rng) => {
        ctx.fillStyle = hexCss(theme.dirt);
        ctx.fillRect(0, 0, 96, 96);
        for (let i = 0; i < 28; i += 1) {
          ctx.globalAlpha = 0.1 + rng() * 0.22;
          ctx.fillStyle = hexCss(rng() > 0.5 ? 0x3a2a1c : 0x8a6a48);
          ctx.beginPath();
          ctx.ellipse(rng() * 96, rng() * 96, 6 + rng() * 14, 3 + rng() * 7, rng() * Math.PI, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 0.35;
        for (let i = 0; i < 16; i += 1) {
          ctx.fillStyle = hexCss(0x2a1c12);
          ctx.fillRect(rng() * 96, rng() * 96, 1 + rng() * 2, 1 + rng() * 2);
        }
        ctx.globalAlpha = 1;
      },
      21 + index,
    );

    canvasTexture(
      scene,
      `cobble-${mapKey}`,
      96,
      96,
      (ctx, rng) => {
        ctx.fillStyle = hexCss(0x2a2436);
        ctx.fillRect(0, 0, 96, 96);
        const tones = [0x5a5568, 0x3a3548, 0x6a6478, 0x484458];
        for (let y = 0; y < 6; y += 1) {
          for (let x = 0; x < 6; x += 1) {
            const ox = (y % 2) * 8;
            ctx.globalAlpha = 0.72 + rng() * 0.22;
            ctx.fillStyle = hexCss(tones[Math.floor(rng() * tones.length)] ?? theme.cobble);
            roundRect(ctx, x * 16 + ox + 1, y * 16 + 1, 13, 12, 3);
            ctx.fill();
            if (rng() > 0.78) {
              ctx.globalAlpha = 0.2;
              ctx.fillStyle = hexCss(theme.leaf);
              ctx.fillRect(x * 16 + ox + 3, y * 16 + 8, 6, 2);
            }
          }
        }
        ctx.globalAlpha = 1;
      },
      31 + index,
    );

    canvasTexture(
      scene,
      `water-${mapKey}`,
      96,
      96,
      (ctx, rng) => {
        const wash = ctx.createLinearGradient(0, 0, 96, 96);
        wash.addColorStop(0, hexCss(theme.water));
        wash.addColorStop(0.55, hexCss(theme.waterDeep));
        wash.addColorStop(1, hexCss(theme.water));
        ctx.fillStyle = wash;
        ctx.fillRect(0, 0, 96, 96);
        ctx.strokeStyle = "rgba(255,255,255,0.16)";
        ctx.lineWidth = 1.2;
        for (let i = 0; i < 8; i += 1) {
          ctx.beginPath();
          ctx.moveTo(rng() * 20, 6 + i * 12);
          ctx.quadraticCurveTo(48, i * 11, 96 - rng() * 18, 10 + i * 12);
          ctx.stroke();
        }
        ctx.fillStyle = "rgba(126,224,214,0.18)";
        for (let i = 0; i < 5; i += 1) {
          ctx.beginPath();
          ctx.arc(rng() * 96, rng() * 96, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      },
      41 + index,
    );
  });

  canvasTexture(
    scene,
    "leaf-tuft",
    36,
    36,
    (ctx, rng) => {
      ctx.clearRect(0, 0, 36, 36);
      for (let i = 0; i < 6; i += 1) {
        ctx.fillStyle = hexCss(rng() > 0.4 ? 0x1f3828 : 0x14241a);
        ctx.beginPath();
        ctx.ellipse(18 + (rng() - 0.5) * 12, 22, 3.2, 11, (rng() - 0.5) * 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    51,
  );

  canvasTexture(
    scene,
    "flower-dot",
    18,
    18,
    (ctx) => {
      ctx.fillStyle = hexCss(0x3a2c18);
      ctx.beginPath();
      ctx.arc(9, 9, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = hexCss(0x6a5030);
      ctx.beginPath();
      ctx.arc(9, 9, 1, 0, Math.PI * 2);
      ctx.fill();
    },
    61,
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
