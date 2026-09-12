import * as Phaser from "phaser";
import { speciesColor, speciesTitle, SPECIES_ELEMENT, WORLD_COLORS } from "./palette";
import { addWorldSprite, ensureWorldSprites, WORLD_SPRITE_SRC, type WorldSpriteKey } from "./sprite-kit";

export const VERDANTIS_WILDS = [
  { speciesKey: "florune", x: 620, y: 460 },
  { speciesKey: "terranox", x: 1380, y: 360 },
  { speciesKey: "nympha", x: 1580, y: 880 },
  { speciesKey: "florune", x: 800, y: 1040 },
  { speciesKey: "nympha", x: 480, y: 520 },
  { speciesKey: "terranox", x: 1100, y: 900 },
  { speciesKey: "florune", x: 1320, y: 720 },
] as const;

function spriteKind(speciesKey: string): WorldSpriteKey {
  return speciesKey in WORLD_SPRITE_SRC ? (speciesKey as WorldSpriteKey) : "florune";
}

export function createWildActor(
  scene: Phaser.Scene,
  speciesKey: string,
  x: number,
  y: number,
  extras?: { family?: string; companion?: boolean; temperament?: string },
) {
  ensureWorldSprites(scene);
  const color = speciesColor(speciesKey);
  const height =
    extras?.family === "BOSS" ? 120 : extras?.family === "ELITE" ? 98 : extras?.family === "UNCOMMON" ? 82 : extras?.companion ? 58 : 72;
  const sprite = addWorldSprite(scene, spriteKind(speciesKey), height);
  const figure = sprite
    ? scene.add.container(0, 0, [sprite])
    : (() => {
        const body = scene.add.graphics();
        drawSpecies(body, speciesKey, color);
        return scene.add.container(0, 0, [body]);
      })();
  const aura = scene.add.ellipse(0, 4, height * 0.55, 12, color, extras?.companion ? 0.14 : 0.08);
  const plate = extras?.companion
    ? undefined
    : (() => {
        const label = scene.add
          .text(0, 0, speciesTitle(speciesKey), {
            fontFamily: "Cinzel, serif",
            fontSize: "13px",
            color: "#f4efe4",
          })
          .setOrigin(0.5, 1);
        const bg = scene.add.rectangle(0, -2, Math.max(64, label.width + 16), 18, WORLD_COLORS.ink, 0.72);
        bg.setStrokeStyle(1, color, 0.55);
        bg.setOrigin(0.5, 1);
        const box = scene.add.container(0, -height - 6, [bg, label]);
        box.setVisible(false);
        return box;
      })();
  const parts: Phaser.GameObjects.GameObject[] = plate ? [aura, figure, plate] : [aura, figure];
  const container = scene.add.container(x, y, parts);
  container.setData("kind", extras?.companion ? "companion" : "wild");
  container.setData("figure", figure);
  container.setData("aura", aura);
  container.setData("plate", plate);
  container.setData("speciesKey", speciesKey);
  container.setData("speciesName", speciesTitle(speciesKey));
  container.setData("temperament", extras?.temperament ?? "WILD");
  container.setData("home", { x, y });
  container.setData("heading", (x * 0.017 + y * 0.013) % (Math.PI * 2));
  container.setData("wait", 0);
  container.setData(
    "speed",
    speciesKey === "terranox" ? 42 : speciesKey === "noctyr" ? 78 : speciesKey === "nympha" ? 64 : 56,
  );
  container.setData("roam", extras?.family === "BOSS" ? 70 : extras?.companion ? 8 : 170);
  container.setScale(1);
  container.setDepth(200 + y);
  return container;
}

export function tickWild(actor: Phaser.GameObjects.Container, delta: number, time = 0) {
  if (actor.getData("kind") === "companion") {
    const figure = actor.getData("figure") as Phaser.GameObjects.Container | undefined;
    figure?.setY(Math.sin(time / 220) * 3);
    actor.setDepth(200 + actor.y);
    return;
  }
  const home = actor.getData("home") as { x: number; y: number };
  let heading = Number(actor.getData("heading") ?? 0);
  let wait = Number(actor.getData("wait") ?? 0);
  const speed = Number(actor.getData("speed") ?? 56);
  const roam = Number(actor.getData("roam") ?? 160);
  const figure = actor.getData("figure") as Phaser.GameObjects.Container | undefined;
  wait -= delta;
  if (wait > 0) {
    figure?.setY(Math.sin(time / 280) * 2);
    figure?.setScale(Math.cos(heading) < 0 ? -1 : 1, 1);
    actor.setData("wait", wait);
    actor.setDepth(200 + actor.y);
    return;
  }
  const dt = delta / 1000;
  actor.x += Math.cos(heading) * speed * dt;
  actor.y += Math.sin(heading) * speed * dt;
  if (Math.hypot(actor.x - home.x, actor.y - home.y) > roam) {
    heading = Math.atan2(home.y - actor.y, home.x - actor.x);
    wait = 280;
  } else if ((Math.floor(time / 80) + Math.round(actor.x)) % 37 === 0) {
    heading += (Math.sin(time * 0.002 + actor.x) - 0.15) * 1.4;
    if (Math.abs(Math.sin(time * 0.001 + actor.y)) > 0.92) {
      wait = 420 + (actor.x % 500);
    }
  }
  actor.setData("heading", heading);
  actor.setData("wait", wait);
  const stride = Math.sin(time / 110);
  figure?.setY(stride * 6);
  figure?.setScale(Math.cos(heading) < 0 ? -1 : 1, 0.9 + Math.abs(stride) * 0.12);
  actor.setDepth(200 + actor.y);
}

export function setWildFocus(actor: Phaser.GameObjects.Container, focused: boolean) {
  const plate = actor.getData("plate") as Phaser.GameObjects.Container | undefined;
  const aura = actor.getData("aura") as Phaser.GameObjects.Ellipse | undefined;
  plate?.setVisible(focused);
  aura?.setAlpha(focused ? 0.28 : 0.08);
}

export function pulseWild(scene: Phaser.Scene, actor: Phaser.GameObjects.Container) {
  const color = speciesColor(String(actor.getData("speciesKey") ?? ""));
  flashCaptureBurst(scene, actor.x, actor.y, color);
  scene.tweens.add({
    targets: actor,
    scale: { from: 1.08, to: 1 },
    duration: 420,
    yoyo: true,
    repeat: 2,
  });
}

export function flashCaptureBurst(scene: Phaser.Scene, x: number, y: number, color: number) {
  for (let i = 0; i < 7; i += 1) {
    const ring = scene.add.circle(x, y, 6 + i * 3, color, 0.28);
    ring.setDepth(8000);
    scene.tweens.add({
      targets: ring,
      scale: 2.8 + i * 0.2,
      alpha: 0,
      duration: 520 + i * 50,
      onComplete: () => ring.destroy(),
    });
  }
}

function drawSpecies(g: Phaser.GameObjects.Graphics, speciesKey: string, color: number) {
  g.fillStyle(0x000000, 0.3);
  g.fillEllipse(0, 13, 26, 8);
  const element = SPECIES_ELEMENT[speciesKey] ?? "ARCANE";
  if (speciesKey === "terranox") {
    g.fillStyle(0x6a5340);
    g.fillRoundedRect(-13, -12, 26, 22, 5);
    g.fillStyle(color, 0.85);
    g.fillRoundedRect(-9, -22, 18, 12, 4);
    g.fillStyle(0x2f5a38, 0.7);
    g.fillCircle(-6, -8, 4);
    g.fillCircle(7, -4, 3);
    return;
  }
  if (speciesKey === "nympha") {
    g.fillStyle(color, 0.9);
    g.fillEllipse(-2, 0, 28, 12);
    g.fillCircle(13, -10, 7);
    return;
  }
  if (speciesKey === "florune") {
    g.fillStyle(0x2f6a38);
    g.fillRect(-3, -2, 6, 14);
    g.fillStyle(color);
    g.fillEllipse(0, -12, 18, 14);
    return;
  }
  if (speciesKey === "pyron" || element === "FIRE") {
    g.fillStyle(color, 0.95);
    g.fillEllipse(0, -2, 22, 13);
    g.fillCircle(12, -9, 7);
    return;
  }
  g.fillStyle(color, 0.95);
  g.fillEllipse(0, -2, 20, 12);
  g.fillCircle(11, -8, 6);
}
