import type { WorldMapDefinition, WorldNpc } from "@nexora/config";
import * as Phaser from "phaser";
import { WORLD_COLORS } from "./palette";

export function paintNpcStations(scene: Phaser.Scene, map: WorldMapDefinition) {
  for (const npc of map.npcs) {
    if (npc.role === "breeder") {
      paintLyraAltar(scene, npc);
    } else if (npc.role === "merchant") {
      paintTheoStall(scene, npc);
    } else if (npc.role === "professor") {
      paintKaelLectern(scene, npc);
    } else if (npc.role === "blacksmith") {
      paintOrinForge(scene, npc);
    } else if (npc.role === "arena") {
      paintArenaBanner(scene, npc);
    } else if (npc.role === "chamber") {
      paintGenesisChamber(scene, npc);
    }
  }
}

function paintLyraAltar(scene: Phaser.Scene, npc: WorldNpc) {
  const x = npc.x;
  const y = npc.y + 18;
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.28);
  g.fillEllipse(x + 2, y + 10, 70, 20);
  g.fillStyle(0x2a2436);
  g.fillRoundedRect(x - 28, y - 8, 56, 16, 6);
  g.fillStyle(0x3a3148);
  g.fillRoundedRect(x - 18, y - 22, 10, 18, 3);
  g.fillRoundedRect(x + 8, y - 22, 10, 18, 3);
  g.fillStyle(WORLD_COLORS.gold, 0.85);
  g.fillCircle(x, y - 28, 6);
  g.fillStyle(WORLD_COLORS.crystal, 0.7);
  g.fillCircle(x, y - 40, 4);
  g.setDepth(160 + y);
  const shard = scene.add.circle(x, y - 40, 10, WORLD_COLORS.gold, 0.16);
  shard.setDepth(161 + y);
  scene.tweens.add({
    targets: shard,
    y: y - 48,
    alpha: { from: 0.12, to: 0.32 },
    duration: 1600,
    yoyo: true,
    repeat: -1,
  });
}

function paintTheoStall(scene: Phaser.Scene, npc: WorldNpc) {
  const x = npc.x - 36;
  const y = npc.y + 8;
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.25);
  g.fillEllipse(x + 4, y + 14, 64, 16);
  g.fillStyle(0x4a3424);
  g.fillRoundedRect(x - 22, y - 6, 48, 16, 3);
  g.fillStyle(WORLD_COLORS.gold, 0.88);
  g.fillTriangle(x - 28, y - 6, x + 28, y - 6, x, y - 28);
  g.fillStyle(0x6a2430, 0.7);
  g.fillTriangle(x - 20, y - 6, x + 20, y - 6, x, y - 20);
  g.fillStyle(0x2a1c14);
  g.fillRect(x - 20, y - 6, 4, 18);
  g.fillRect(x + 16, y - 6, 4, 18);
  g.fillStyle(WORLD_COLORS.gold, 0.8);
  g.fillCircle(x - 8, y + 4, 2.4);
  g.fillCircle(x + 2, y + 6, 2);
  g.setDepth(160 + y);
}

function paintKaelLectern(scene: Phaser.Scene, npc: WorldNpc) {
  const x = npc.x + 28;
  const y = npc.y + 6;
  const g = scene.add.graphics();
  g.fillStyle(0x2a2436);
  g.fillRoundedRect(x - 10, y - 8, 20, 14, 3);
  g.fillStyle(0x1a1420);
  g.fillRect(x - 3, y + 4, 6, 10);
  g.fillStyle(WORLD_COLORS.crystal, 0.85);
  g.fillCircle(x, y - 16, 5);
  g.setDepth(160 + y);
  const glow = scene.add.circle(x, y - 16, 14, WORLD_COLORS.crystal, 0.14);
  glow.setDepth(159 + y);
  scene.tweens.add({
    targets: glow,
    alpha: { from: 0.08, to: 0.24 },
    duration: 1200,
    yoyo: true,
    repeat: -1,
  });
}

function paintOrinForge(scene: Phaser.Scene, npc: WorldNpc) {
  const x = npc.x + 26;
  const y = npc.y + 10;
  const g = scene.add.graphics();
  g.fillStyle(0x3a3a40);
  g.fillRoundedRect(x - 14, y - 4, 28, 10, 3);
  g.fillStyle(0x2a2a30);
  g.fillRect(x - 4, y + 4, 8, 8);
  g.fillStyle(WORLD_COLORS.ember, 0.9);
  g.fillCircle(x, y - 10, 4);
  g.setDepth(160 + y);
  const ember = scene.add.circle(x, y - 12, 12, WORLD_COLORS.ember, 0.18);
  ember.setDepth(159 + y);
  scene.tweens.add({
    targets: ember,
    alpha: { from: 0.1, to: 0.32 },
    scale: { from: 0.85, to: 1.2 },
    duration: 700,
    yoyo: true,
    repeat: -1,
  });
}

function paintArenaBanner(scene: Phaser.Scene, npc: WorldNpc) {
  const x = npc.x + 24;
  const y = npc.y;
  const g = scene.add.graphics();
  g.fillStyle(0x1a1420);
  g.fillRect(x - 2, y - 36, 4, 40);
  g.fillStyle(0xe05858, 0.9);
  g.fillTriangle(x, y - 36, x + 18, y - 26, x, y - 16);
  g.fillStyle(WORLD_COLORS.gold, 0.8);
  g.fillCircle(x, y - 38, 3);
  g.setDepth(160 + y);
}

function paintGenesisChamber(scene: Phaser.Scene, npc: WorldNpc) {
  const x = npc.x;
  const y = npc.y + 22;
  const g = scene.add.graphics();
  g.fillStyle(0x061018, 0.55);
  g.fillEllipse(x, y + 10, 88, 28);
  g.lineStyle(2, WORLD_COLORS.crystal, 0.7);
  g.strokeCircle(x, y - 6, 34);
  g.lineStyle(1.4, WORLD_COLORS.gold, 0.55);
  g.strokeCircle(x, y - 6, 22);
  g.fillStyle(WORLD_COLORS.crystal, 0.28);
  g.fillCircle(x, y - 6, 10);
  g.fillStyle(WORLD_COLORS.gold, 0.8);
  g.fillCircle(x - 18, y + 4, 3);
  g.fillCircle(x + 16, y + 6, 2.4);
  g.setDepth(155 + y);
  scene.tweens.add({
    targets: g,
    alpha: { from: 0.72, to: 1 },
    duration: 1400,
    yoyo: true,
    repeat: -1,
  });
}
