import * as Phaser from "phaser";
import { spr } from "./paint-kit";
import { mulberry32 } from "./rng";

/** Floresta crepuscular — composição, sem rótulos de mapa, sem geometria de brinquedo. */
export function paintVerdantisBiome(scene: Phaser.Scene, map: { width: number; height: number }) {
  scene.add.tileSprite(map.width / 2, map.height / 2, map.width, map.height, "gx-moss").setDepth(0);
  paintShade(scene, map);
  paintTrail(scene);
  paintRiver(scene);
  grove(scene, 160, 700, 7, 0.95);
  grove(scene, 480, 640, 14, 1);
  crystals(scene, 820, 420);
  spr(scene, "gx-ruin", 1180, 300, 1.15, 190);
  grove(scene, 1180, 240, 6, 0.85);
  rocks(scene, 1480, 720);
  grove(scene, 1480, 640, 5, 1.05);
  ring(scene, 1680, 390);
  spr(scene, "gx-ruin", 1680, 340, 0.7, 170);
  grove(scene, 1880, 620, 4, 1.1);
  gate(scene, 1880, 700);
  mist(scene);
}

function paintShade(scene: Phaser.Scene, map: { width: number; height: number }) {
  const g = scene.add.graphics();
  g.fillStyle(0x050a08, 0.55);
  g.fillEllipse(400, 180, 900, 220);
  g.fillEllipse(1400, 140, 800, 180);
  g.fillEllipse(700, 1100, 700, 200);
  g.fillStyle(0x08140e, 0.35);
  g.fillEllipse(1000, 560, 1100, 320);
  g.setDepth(1);
}

function paintTrail(scene: Phaser.Scene) {
  const points = [
    [180, 700],
    [360, 670],
    [520, 620],
    [700, 500],
    [880, 540],
    [1100, 640],
    [1320, 700],
    [1500, 720],
    [1660, 540],
    [1780, 420],
  ] as const;
  for (let i = 0; i < points.length - 1; i += 1) {
    const [ax, ay] = points[i];
    const [bx, by] = points[i + 1];
    for (let s = 0; s <= 6; s += 1) {
      const t = s / 6;
      scene.add
        .image(ax + (bx - ax) * t, ay + (by - ay) * t, "gx-soil")
        .setDisplaySize(92, 42)
        .setAlpha(0.88)
        .setDepth(2);
    }
  }
}

function paintRiver(scene: Phaser.Scene) {
  const water = scene.add.graphics();
  water.fillStyle(0x071820, 0.95);
  water.fillEllipse(900, 990, 680, 160);
  water.fillEllipse(1120, 1050, 360, 100);
  water.fillStyle(0x12343c, 0.7);
  water.fillEllipse(900, 982, 560, 110);
  water.setDepth(3);
  const sheen = scene.add.ellipse(860, 958, 240, 20, 0x7ee0d6, 0.06);
  sheen.setDepth(4);
  scene.tweens.add({
    targets: sheen,
    alpha: { from: 0.03, to: 0.1 },
    x: { from: 820, to: 940 },
    duration: 4800,
    yoyo: true,
    repeat: -1,
  });
}

function grove(scene: Phaser.Scene, x: number, y: number, count: number, scale: number) {
  const rng = mulberry32(Math.round(x * 11 + y));
  for (let i = 0; i < count; i += 1) {
    const px = x + (rng() - 0.5) * 160;
    const py = y + (rng() - 0.5) * 90;
    spr(scene, "gx-canopy", px, py, (0.72 + rng() * 0.45) * scale, 170 + py);
  }
}

function crystals(scene: Phaser.Scene, x: number, y: number) {
  scene.add.ellipse(x, y + 16, 240, 100, 0x0a1814, 0.55).setDepth(2);
  spr(scene, "gx-crystal", x - 36, y + 8, 0.85);
  spr(scene, "gx-crystal", x + 8, y - 6, 1.2);
  spr(scene, "gx-crystal", x + 42, y + 14, 0.7);
  const glow = scene.add.circle(x + 8, y - 40, 54, 0x7ee0d6, 0.07);
  glow.setDepth(6);
  scene.tweens.add({
    targets: glow,
    alpha: { from: 0.04, to: 0.12 },
    duration: 2200,
    yoyo: true,
    repeat: -1,
  });
}

function rocks(scene: Phaser.Scene, x: number, y: number) {
  scene.add.ellipse(x, y + 18, 300, 120, 0x14100c, 0.5).setDepth(2);
  spr(scene, "gx-boulder", x - 70, y + 10, 1.2);
  spr(scene, "gx-boulder", x + 20, y - 4, 1.45);
  spr(scene, "gx-boulder", x + 86, y + 18, 0.9);
}

function ring(scene: Phaser.Scene, x: number, y: number) {
  const edge = scene.add.ellipse(x, y + 10, 210, 88, 0x1a1010, 0.35);
  edge.setStrokeStyle(2, 0x6a3030, 0.35);
  edge.setDepth(3);
}

function gate(scene: Phaser.Scene, x: number, y: number) {
  const veil = scene.add.ellipse(x, y - 10, 64, 108, 0x7ee0d6, 0.08);
  veil.setDepth(7);
  scene.tweens.add({
    targets: veil,
    alpha: { from: 0.05, to: 0.16 },
    scaleX: { from: 0.92, to: 1.08 },
    duration: 1800,
    yoyo: true,
    repeat: -1,
  });
}

function mist(scene: Phaser.Scene) {
  for (let i = 0; i < 6; i += 1) {
    const cloud = scene.add.ellipse(220 + i * 300, 280 + (i % 2) * 160, 340, 80, 0xc8ddd4, 0.035);
    cloud.setDepth(8);
    scene.tweens.add({
      targets: cloud,
      x: `+=${30}`,
      alpha: { from: 0.02, to: 0.06 },
      duration: 7000 + i * 400,
      yoyo: true,
      repeat: -1,
    });
  }
}
