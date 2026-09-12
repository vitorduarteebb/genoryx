import type { WorldNpc } from "@nexora/config";
import * as Phaser from "phaser";
import { WORLD_COLORS } from "./palette";
import { addWorldSprite, ensureWorldSprites } from "./sprite-kit";

const NPC_PALETTE: Record<
  string,
  { cloth: number; accent: number; hair: number; skin: number; title: string; cloak: number }
> = {
  professor: {
    cloth: 0x244858,
    accent: WORLD_COLORS.crystal,
    hair: 0x3a3a48,
    skin: 0xe0c4a0,
    title: "Professor",
    cloak: 0x1a3340,
  },
  breeder: {
    cloth: 0x5a2a48,
    accent: WORLD_COLORS.gold,
    hair: 0x6a2438,
    skin: 0xf0d0b0,
    title: "Criadora",
    cloak: 0x3a1c34,
  },
  blacksmith: {
    cloth: 0x4a2a20,
    accent: WORLD_COLORS.ember,
    hair: 0x2a1c14,
    skin: 0xd4a080,
    title: "Ferreiro",
    cloak: 0x2a1810,
  },
  merchant: {
    cloth: 0x3a3420,
    accent: WORLD_COLORS.gold,
    hair: 0x4a3420,
    skin: 0xe8c8a0,
    title: "Mercador",
    cloak: 0x2a2414,
  },
  arena: {
    cloth: 0x4a1c24,
    accent: 0xe05858,
    hair: 0x1a1420,
    skin: 0xc8a090,
    title: "Arena",
    cloak: 0x2a1014,
  },
  chamber: {
    cloth: 0x1a3040,
    accent: WORLD_COLORS.crystal,
    hair: 0xf0e0b0,
    skin: 0xe8d4b8,
    title: "Câmara",
    cloak: 0x102028,
  },
};

const NPC_TINT: Record<string, number> = {
  professor: 0x8ad0dc,
  breeder: 0xe8a8c4,
  blacksmith: 0xe09068,
  merchant: 0xe8d090,
  arena: 0xe07878,
  chamber: 0x88e0d4,
};

export function createPlayerActor(scene: Phaser.Scene, name: string, local: boolean) {
  ensureWorldSprites(scene);
  const accent = local ? WORLD_COLORS.gold : WORLD_COLORS.crystal;
  const height = local ? 92 : 84;
  const idle = addWorldSprite(scene, "hunter", height);
  const walkA = addWorldSprite(scene, "hunter-walk-a", height);
  const walkB = addWorldSprite(scene, "hunter-walk-b", height);
  if (!local) {
    idle?.setTint(0xa8c8d4);
    walkA?.setTint(0xa8c8d4);
    walkB?.setTint(0xa8c8d4);
  }
  walkA?.setVisible(false);
  walkB?.setVisible(false);
  const body = idle ?? drawFallbackHuman(scene, { local, accent });
  const figure = scene.add.container(0, 0, [body, walkA, walkB].filter(Boolean) as Phaser.GameObjects.GameObject[]);
  const ring = scene.add.ellipse(0, 6, 28, 10, accent, local ? 0.14 : 0.07);
  const parts: Phaser.GameObjects.GameObject[] = [ring, figure];
  if (!local) {
    const plate = namePlate(scene, name, accent);
    plate.y = -96;
    parts.push(plate);
  }
  const container = scene.add.container(0, 0, parts);
  container.setData("kind", "player");
  container.setData("figure", figure);
  container.setData("idle", idle);
  container.setData("walkA", walkA);
  container.setData("walkB", walkB);
  container.setData("ring", ring);
  container.setData("ringBase", local ? 0.14 : 0.07);
  container.setData("local", local);
  container.setData("dustAt", 0);
  container.setScale(1);
  container.setDepth(200);
  return container;
}

export function createNpcActor(scene: Phaser.Scene, npc: WorldNpc) {
  ensureWorldSprites(scene);
  const tone = NPC_PALETTE[npc.role] ?? NPC_PALETTE.professor;
  const sprite = addWorldSprite(scene, "hunter", 86);
  if (sprite) {
    sprite.setTint(NPC_TINT[npc.role] ?? tone.accent);
  }
  const figure = scene.add.container(0, 0, [
    sprite ??
      drawFallbackHuman(scene, {
        local: false,
        accent: tone.accent,
        cloth: tone.cloth,
        cloak: tone.cloak,
        hair: tone.hair,
        skin: tone.skin,
      }),
  ]);
  const plate = namePlate(scene, npc.name, tone.accent);
  plate.y = -94;
  plate.setVisible(false);
  const ring = scene.add.ellipse(0, 6, 26, 9, tone.accent, 0.1);
  const hint = scene.add
    .text(0, -100, "E", {
      fontFamily: "Cinzel, serif",
      fontSize: "12px",
      color: "#e4c36a",
    })
    .setOrigin(0.5, 1)
    .setVisible(false);
  const container = scene.add.container(npc.x, npc.y, [ring, figure, plate, hint]);
  container.setData("kind", "npc");
  container.setData("figure", figure);
  container.setData("ring", ring);
  container.setData("ringBase", 0.2);
  container.setData("hint", hint);
  container.setData("plate", plate);
  container.setData("npcKey", npc.key);
  container.setData("npcName", npc.name);
  container.setScale(1);
  container.setDepth(200 + npc.y);
  scene.tweens.add({
    targets: figure,
    y: { from: 0, to: -3 },
    duration: 1400 + (npc.x % 300),
    yoyo: true,
    repeat: -1,
    ease: "Sine.InOut",
  });
  return container;
}

export function setActorFacing(actor: Phaser.GameObjects.Container, facing: string) {
  const figure = actor.getData("figure") as Phaser.GameObjects.Container | undefined;
  if (!figure) {
    return;
  }
  actor.setData("facing", facing);
  figure.setScale(facing === "left" ? -1 : 1, figure.scaleY || 1);
}

export function setActorWalking(actor: Phaser.GameObjects.Container, walking: boolean, time: number, scene?: Phaser.Scene) {
  const figure = actor.getData("figure") as Phaser.GameObjects.Container | undefined;
  if (!figure) {
    return;
  }
  const stride = Math.sin(time / 92);
  figure.y = walking ? stride * 7 : Math.sin(time / 380) * 1.4;
  figure.rotation = walking ? stride * 0.08 : 0;
  const face = actor.getData("facing") === "left" ? -1 : 1;
  figure.setScale(face, walking ? 0.9 + Math.abs(stride) * 0.12 : 1);
  const idle = actor.getData("idle") as Phaser.GameObjects.Image | undefined;
  const walkA = actor.getData("walkA") as Phaser.GameObjects.Image | undefined;
  const walkB = actor.getData("walkB") as Phaser.GameObjects.Image | undefined;
  if (idle && walkA && walkB) {
    const useB = walking && Math.floor(time / 150) % 2 === 1;
    idle.setVisible(!walking);
    walkA.setVisible(walking && !useB);
    walkB.setVisible(walking && useB);
  }
  if (walking && scene && time - Number(actor.getData("dustAt") ?? 0) > 160) {
    actor.setData("dustAt", time);
    const puff = scene.add.ellipse(actor.x - 8, actor.y + 4, 14, 6, 0xc8d4c0, 0.22);
    puff.setDepth(190 + actor.y);
    scene.tweens.add({
      targets: puff,
      x: actor.x - 22,
      alpha: 0,
      scale: 1.6,
      duration: 280,
      onComplete: () => puff.destroy(),
    });
  }
}

export function setActorFocus(actor: Phaser.GameObjects.Container, focused: boolean) {
  const ring = actor.getData("ring") as Phaser.GameObjects.Ellipse | undefined;
  const hint = actor.getData("hint") as Phaser.GameObjects.Text | undefined;
  const plate = actor.getData("plate") as Phaser.GameObjects.Container | undefined;
  const base = Number(actor.getData("ringBase") ?? 0.16);
  ring?.setAlpha(focused ? 0.5 : base);
  ring?.setScale(focused ? 1.28 : 1);
  hint?.setVisible(focused);
  plate?.setVisible(focused);
}

export function sortActorDepth(actor: Phaser.GameObjects.Container) {
  actor.setDepth(200 + actor.y);
}

function namePlate(scene: Phaser.Scene, name: string, color: number) {
  const label = scene.add
    .text(0, 0, name, {
      fontFamily: "Source Sans 3, sans-serif",
      fontSize: "12px",
      color: "#f4efe4",
    })
    .setOrigin(0.5, 1);
  const bg = scene.add.rectangle(0, -2, Math.max(58, label.width + 16), 17, WORLD_COLORS.ink, 0.78);
  bg.setStrokeStyle(1, color, 0.6);
  bg.setOrigin(0.5, 1);
  return scene.add.container(0, 0, [bg, label]);
}

function drawFallbackHuman(
  scene: Phaser.Scene,
  tone: { cloth?: number; accent: number; skin?: number; hair?: number; cloak?: number; local: boolean },
) {
  const body = scene.add.graphics();
  drawHumanoid(body, {
    cloth: tone.cloth ?? 0x3a2a18,
    accent: tone.accent,
    skin: tone.skin ?? 0xf0d0b0,
    hair: tone.hair ?? 0x3a2418,
    cloak: tone.cloak ?? 0x2a1c10,
    local: tone.local,
  });
  return body;
}

function drawHumanoid(
  g: Phaser.GameObjects.Graphics,
  tone: { cloth: number; accent: number; skin: number; hair: number; cloak: number; local: boolean },
) {
  g.fillStyle(0x000000, 0.34);
  g.fillEllipse(0, 13, 24, 8);
  g.fillStyle(tone.cloak, 0.95);
  g.fillTriangle(-4, -10, -17, 8, 3, 8);
  g.fillStyle(0x1a1420);
  g.fillRoundedRect(-8, 2, 6, 11, 2);
  g.fillRoundedRect(2, 2, 6, 11, 2);
  g.fillStyle(tone.cloth);
  g.fillRoundedRect(-9, -13, 18, 17, 5);
  g.fillStyle(tone.accent, 0.95);
  g.fillRect(-9, -1, 18, 3);
  g.fillStyle(tone.skin);
  g.fillCircle(0, -20, 7.4);
  g.fillRoundedRect(6, -16, 3, 6, 1);
  g.fillStyle(tone.hair);
  g.fillEllipse(0, -24, 15, 9);
  g.fillStyle(0x1a1420, 0.85);
  g.fillCircle(3, -20, 1.15);
  if (tone.local) {
    g.fillStyle(WORLD_COLORS.gold, 0.9);
    g.fillTriangle(-8, -8, -18, 4, -6, 5);
    g.fillStyle(WORLD_COLORS.crystal, 0.95);
    g.fillCircle(5, -18, 1.7);
  }
}


