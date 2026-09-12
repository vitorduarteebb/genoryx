import type { Rect, WorldMapDefinition } from "@nexora/config";
import * as Phaser from "phaser";
import { MAP_THEME, WORLD_COLORS } from "./palette";
import { mulberry32 } from "./rng";
import { paintNpcStations } from "./stations";
import { paintVerdantisBiome } from "./verdantis-biome";

const BUILDING_STYLE: Record<string, { label: string; roof: number; roofLite: number; banner?: number }> = {
  "200,180": { label: "Arquivo", roof: 0x5a2438, roofLite: 0x7a3448 },
  "980,160": { label: "Arena", roof: 0x6a1c24, roofLite: 0x8a2c34, banner: 0xe05858 },
  "1500,240": { label: "Residência", roof: 0x4a2a48, roofLite: 0x6a3a60 },
  "1680,900": { label: "Depósito", roof: 0x4a3a28, roofLite: 0x6a5340 },
};

export function paintWorldMap(scene: Phaser.Scene, map: WorldMapDefinition) {
  const theme = MAP_THEME[map.key];
  scene.cameras.main.setBackgroundColor(theme.dusk);
  if (map.key !== "verdantis") {
    scene.add.tileSprite(map.width / 2, map.height / 2, map.width, map.height, `grass-${map.key}`).setDepth(0);
  }
  paintAtmosphere(scene, map);
  paintHorizon(scene, map);

  if (map.key === "haven") {
    paintHaven(scene, map);
  } else {
    paintVerdantis(scene, map);
  }

  for (const wall of map.colliders) {
    if (map.key === "haven" && wall.width === 140 && wall.height === 140) {
      paintFountain(scene, wall);
    } else if (map.key !== "verdantis") {
      paintBuilding(scene, wall, BUILDING_STYLE[`${wall.x},${wall.y}`]);
    }
  }

  for (const portal of map.portals) {
    paintPortal(scene, portal.zone);
  }

  paintNpcStations(scene, map);
  paintMapEdge(scene, map);
}

function paintHaven(scene: Phaser.Scene, map: WorldMapDefinition) {
  const cobble = `cobble-${map.key}`;
  const dirt = `dirt-${map.key}`;
  paintPath(scene, 640, 380, 840, 240, cobble);
  paintPath(scene, 360, 620, 200, 440, dirt);
  paintPath(scene, 1640, 760, 1320, 150, dirt);
  paintPath(scene, 1080, 520, 180, 300, dirt);
  paintWater(scene, map, { x: 1880, y: 1180, width: 420, height: 220 });
  const plaza = scene.add.graphics();
  plaza.fillStyle(0x1a2430, 0.35);
  plaza.fillEllipse(540, 520, 220, 90);
  plaza.lineStyle(2, WORLD_COLORS.crystal, 0.35);
  plaza.strokeEllipse(540, 520, 180, 70);
  plaza.setDepth(2);
  scatterProps(scene, map, 0x91);
  lanternRow(scene, 320, 760, 2260, 760, 10);
  lanternRow(scene, 280, 360, 1000, 360, 6);
  lanternRow(scene, 700, 500, 1500, 500, 5);
}

function paintVerdantis(scene: Phaser.Scene, map: WorldMapDefinition) {
  paintVerdantisBiome(scene, map);
  tallGrassPatch(scene, 300, 860, 220, 120);
  tallGrassPatch(scene, 980, 780, 200, 100);
  tallGrassPatch(scene, 1320, 480, 180, 90);
  shaftLights(scene, map);
}

function paintPath(scene: Phaser.Scene, x: number, y: number, width: number, height: number, texture: string) {
  const rim = scene.add.graphics();
  rim.fillStyle(0x1a120c, 0.32);
  rim.fillRoundedRect(x - width / 2 - 8, y - height / 2 - 8, width + 16, height + 16, 18);
  rim.setDepth(1);
  scene.add.tileSprite(x, y, width, height, texture).setDepth(1);
}

function paintAtmosphere(scene: Phaser.Scene, map: WorldMapDefinition) {
  const theme = MAP_THEME[map.key];
  const wash = scene.add.rectangle(map.width / 2, map.height / 2, map.width, map.height, theme.dusk, 0.16);
  wash.setDepth(3);
  if (map.key === "haven") {
    const moon = scene.add.circle(420, 180, 90, 0xe4c36a, 0.06);
    moon.setDepth(2);
    const halo = scene.add.circle(420, 180, 160, WORLD_COLORS.crystal, 0.04);
    halo.setDepth(2);
  }
}

function paintHorizon(scene: Phaser.Scene, map: WorldMapDefinition) {
  const g = scene.add.graphics();
  g.fillStyle(map.key === "haven" ? 0x14101c : 0x0a1610, 0.85);
  g.fillEllipse(map.width * 0.2, 20, 520, 90);
  g.fillEllipse(map.width * 0.55, 10, 640, 80);
  g.fillEllipse(map.width * 0.88, 24, 420, 70);
  g.fillStyle(map.key === "haven" ? 0x1c1830 : 0x123820, 0.7);
  g.fillEllipse(map.width * 0.35, 36, 300, 50);
  g.setDepth(2);
}

function paintMapEdge(scene: Phaser.Scene, map: WorldMapDefinition) {
  const g = scene.add.graphics();
  g.fillStyle(0x07060c, 0.45);
  g.fillRect(0, 0, map.width, 28);
  g.fillRect(0, map.height - 36, map.width, 36);
  g.fillRect(0, 0, 28, map.height);
  g.fillRect(map.width - 28, 0, 28, map.height);
  g.setDepth(4);
}

function paintWater(scene: Phaser.Scene, map: WorldMapDefinition, rect: Rect) {
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  const water = scene.add.tileSprite(cx, cy, rect.width, rect.height, `water-${map.key}`).setDepth(1);
  scene.tweens.add({
    targets: water,
    tilePositionX: 96,
    duration: 7000,
    repeat: -1,
  });
  const rim = scene.add.graphics();
  rim.lineStyle(7, MAP_THEME[map.key].waterDeep, 0.75);
  rim.strokeRoundedRect(rect.x, rect.y, rect.width, rect.height, 22);
  rim.setDepth(2);
  const glint = scene.add.ellipse(cx, cy - rect.height * 0.18, rect.width * 0.42, 18, 0xffffff, 0.08);
  glint.setDepth(2);
  scene.tweens.add({
    targets: glint,
    alpha: { from: 0.05, to: 0.18 },
    duration: 1800,
    yoyo: true,
    repeat: -1,
  });
}

function paintBuilding(
  scene: Phaser.Scene,
  wall: Rect,
  style?: { label: string; roof: number; roofLite: number; banner?: number },
) {
  const cx = wall.x + wall.width / 2;
  const cy = wall.y + wall.height / 2;
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.3);
  g.fillRoundedRect(wall.x + 10, wall.y + 16, wall.width, wall.height, 6);
  g.fillStyle(0x2b2436);
  g.fillRoundedRect(wall.x, wall.y, wall.width, wall.height, 8);
  g.fillStyle(0x3a3148);
  g.fillRoundedRect(wall.x + 8, wall.y + 12, wall.width - 16, wall.height - 22, 4);
  g.fillStyle(style?.roof ?? 0x6a2430);
  g.fillTriangle(wall.x - 14, wall.y + 8, cx, wall.y - 42, wall.x + wall.width + 14, wall.y + 8);
  g.fillStyle(style?.roofLite ?? 0x8a3440);
  g.fillTriangle(wall.x + 10, wall.y + 8, cx, wall.y - 26, wall.x + wall.width - 10, wall.y + 8);
  const windows = Math.max(2, Math.floor(wall.width / 70));
  for (let i = 0; i < windows; i += 1) {
    const wx = wall.x + 22 + i * ((wall.width - 36) / windows);
    g.fillStyle(WORLD_COLORS.gold, 0.78);
    g.fillRoundedRect(wx, wall.y + wall.height * 0.38, 16, 18, 2);
    g.fillStyle(0xfff3c0, 0.18);
    g.fillCircle(wx + 8, wall.y + wall.height * 0.38 + 8, 10);
  }
  g.fillStyle(0x1a1420);
  g.fillRoundedRect(cx - 13, wall.y + wall.height - 38, 26, 30, 3);
  if (style?.banner) {
    g.fillStyle(style.banner, 0.9);
    g.fillRect(cx + wall.width * 0.28, wall.y - 8, 5, 28);
    g.fillTriangle(cx + wall.width * 0.28 + 5, wall.y - 8, cx + wall.width * 0.28 + 20, wall.y + 2, cx + wall.width * 0.28 + 5, wall.y + 10);
  }
  g.setDepth(200 + wall.y + wall.height);
}

function paintFountain(scene: Phaser.Scene, wall: Rect) {
  const cx = wall.x + wall.width / 2;
  const cy = wall.y + wall.height / 2;
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.25);
  g.fillEllipse(cx + 4, cy + 12, 128, 50);
  g.fillStyle(0x3a3548);
  g.fillEllipse(cx, cy + 8, 124, 48);
  g.fillStyle(0x2a2436);
  g.fillEllipse(cx, cy + 8, 108, 38);
  g.fillStyle(0x1f5a68, 0.92);
  g.fillEllipse(cx, cy + 4, 96, 32);
  g.fillStyle(0x7ee0d6, 0.38);
  g.fillCircle(cx, cy - 8, 16);
  g.fillStyle(WORLD_COLORS.gold);
  g.fillCircle(cx, cy - 24, 8);
  g.setDepth(200 + wall.y + wall.height);
  const spray = scene.add.ellipse(cx, cy - 6, 24, 12, 0x7ee0d6, 0.22);
  spray.setDepth(202 + wall.y + wall.height);
  scene.tweens.add({ targets: spray, scaleX: 1.7, scaleY: 1.9, alpha: 0, duration: 1400, repeat: -1 });
}

function paintPortal(scene: Phaser.Scene, zone: Rect) {
  const cx = zone.x + zone.width / 2;
  const cy = zone.y + zone.height / 2;
  const g = scene.add.graphics();
  g.fillStyle(0x061018, 0.55);
  g.fillEllipse(cx, cy + 8, zone.width * 0.92, zone.height * 0.55);
  g.fillStyle(0x102028, 0.9);
  g.fillRoundedRect(zone.x + 10, zone.y + 18, 16, zone.height - 32, 4);
  g.fillRoundedRect(zone.x + zone.width - 26, zone.y + 18, 16, zone.height - 32, 4);
  g.lineStyle(2, WORLD_COLORS.crystal, 0.45);
  g.beginPath();
  g.arc(cx, zone.y + 30, zone.width * 0.28, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(340), false);
  g.strokePath();
  g.setDepth(6);
  const gate = scene.add.ellipse(cx, cy, zone.width * 0.42, zone.height * 0.68, WORLD_COLORS.crystal, 0.1);
  gate.setDepth(7);
  scene.tweens.add({
    targets: gate,
    alpha: { from: 0.06, to: 0.18 },
    scaleX: { from: 0.94, to: 1.06 },
    duration: 1800,
    yoyo: true,
    repeat: -1,
  });
}

function lanternRow(scene: Phaser.Scene, x1: number, y1: number, x2: number, y2: number, count: number) {
  for (let i = 0; i < count; i += 1) {
    const t = count === 1 ? 0 : i / (count - 1);
    paintLantern(scene, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t);
  }
}

function paintLantern(scene: Phaser.Scene, x: number, y: number) {
  const g = scene.add.graphics();
  g.fillStyle(0x1a1420);
  g.fillRect(x - 3, y - 30, 6, 30);
  g.fillStyle(WORLD_COLORS.gold, 0.96);
  g.fillRoundedRect(x - 8, y - 42, 16, 14, 3);
  g.setDepth(200 + y);
  const glow = scene.add.circle(x, y - 36, 26, WORLD_COLORS.gold, 0.16);
  glow.setDepth(199 + y);
  const pool = scene.add.ellipse(x, y + 4, 46, 14, WORLD_COLORS.gold, 0.08);
  pool.setDepth(5);
  scene.tweens.add({
    targets: glow,
    alpha: { from: 0.1, to: 0.3 },
    duration: 900 + (x % 400),
    yoyo: true,
    repeat: -1,
  });
}

function tallGrassPatch(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
  const rng = mulberry32(Math.round(x * 13 + y));
  for (let i = 0; i < 34; i += 1) {
    const px = x + rng() * width;
    const py = y + rng() * height;
    const blade = scene.add.image(px, py, "leaf-tuft").setDepth(180 + py);
    blade.setScale(0.95 + rng() * 0.7);
    blade.setAlpha(0.78);
    scene.tweens.add({
      targets: blade,
      angle: { from: -7, to: 7 },
      duration: 1400 + rng() * 800,
      yoyo: true,
      repeat: -1,
    });
  }
}

function scatterProps(scene: Phaser.Scene, map: WorldMapDefinition, seed: number) {
  const rng = mulberry32(seed + map.width);
  const blocked = [...map.colliders, ...map.portals.map((row) => row.zone)];
  const count = map.key === "haven" ? 40 : 28;
  for (let i = 0; i < count; i += 1) {
    const x = 80 + rng() * (map.width - 160);
    const y = 80 + rng() * (map.height - 160);
    if (blocked.some((rect) => inside(x, y, rect, 70))) {
      continue;
    }
    if (map.npcs.some((npc) => Math.hypot(npc.x - x, npc.y - y) < 80)) {
      continue;
    }
    if (rng() > 0.36) {
      paintTree(scene, x, y, rng);
    } else if (map.key === "verdantis") {
      scene.add.image(x, y, rng() > 0.5 ? "leaf-tuft" : "flower-dot").setDepth(180 + y);
    } else {
      scene.add.circle(x, y, 3, WORLD_COLORS.gold, 0.28).setDepth(2);
    }
  }
}

function paintTree(scene: Phaser.Scene, x: number, y: number, rng: () => number) {
  const g = scene.add.graphics();
  const canopy = 24 + rng() * 18;
  g.fillStyle(0x000000, 0.24);
  g.fillEllipse(x + 4, y + 8, canopy * 1.45, 13);
  g.fillStyle(0x4a3424);
  g.fillRect(x - 4, y - 22, 8, 30);
  g.fillStyle(0x163820);
  g.fillCircle(x - 2, y - 22, canopy * 0.7);
  g.fillStyle(0x1f4a2a);
  g.fillCircle(x - 12, y - 32, canopy * 0.6);
  g.fillStyle(0x2f7a40);
  g.fillCircle(x + 11, y - 34, canopy * 0.66);
  g.fillStyle(0x3d8a4a);
  g.fillCircle(x - 2, y - 44, canopy * 0.55);
  g.fillStyle(0x4a9a52, 0.7);
  g.fillCircle(x + 6, y - 38, canopy * 0.32);
  if (rng() > 0.7) {
    g.fillStyle(WORLD_COLORS.gold, 0.55);
    g.fillCircle(x + 6, y - 28, 2);
  }
  g.setDepth(200 + y);
}

function shaftLights(scene: Phaser.Scene, map: WorldMapDefinition) {
  const rng = mulberry32(map.width + 19);
  for (let i = 0; i < 5; i += 1) {
    const x = 200 + rng() * (map.width - 400);
    const beam = scene.add.ellipse(x, 220 + rng() * 200, 40, 220, WORLD_COLORS.crystal, 0.05);
    beam.setDepth(3);
    scene.tweens.add({
      targets: beam,
      alpha: { from: 0.03, to: 0.1 },
      duration: 2200 + rng() * 800,
      yoyo: true,
      repeat: -1,
    });
  }
}

function inside(x: number, y: number, rect: Rect, pad: number) {
  return x >= rect.x - pad && x <= rect.x + rect.width + pad && y >= rect.y - pad && y <= rect.y + rect.height + pad;
}
