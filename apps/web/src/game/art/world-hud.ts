import * as Phaser from "phaser";
import { MAP_THEME, speciesColor, speciesTitle, WORLD_COLORS } from "./palette";

export type WorldHud = {
  root: Phaser.GameObjects.Container;
  setStatus: (mapName: string, players: number, coords: string) => void;
  setPrompt: (text: string) => void;
  setDialogue: (name: string, text: string) => void;
  clearDialogue: () => void;
  setEncounter: (row: { speciesKey: string; level: number } | null) => void;
};

export function createWorldHud(scene: Phaser.Scene, mapKey = "haven"): WorldHud {
  const plaque = scene.add.graphics();
  plaque.fillStyle(WORLD_COLORS.ink, 0.62);
  plaque.fillRoundedRect(0, 0, 210, 36, 10);
  plaque.lineStyle(1, WORLD_COLORS.crystal, 0.35);
  plaque.strokeRoundedRect(0, 0, 210, 36, 10);
  const title = scene.add.text(14, 7, "", {
    fontFamily: "Cinzel, serif",
    fontSize: "16px",
    color: "#e4c36a",
  });
  const plaqueBox = scene.add.container(16, 12, [plaque, title]);

  const promptBg = scene.add.graphics();
  const prompt = scene.add.text(0, 0, "", {
    fontFamily: "Source Sans 3, sans-serif",
    fontSize: "15px",
    color: "#7ee0d6",
  });
  const promptBox = scene.add.container(16, 58, [promptBg, prompt]);

  const talkBg = scene.add.graphics();
  const talkName = scene.add.text(20, 10, "", {
    fontFamily: "Cinzel, serif",
    fontSize: "16px",
    color: "#e4c36a",
  });
  const talkText = scene.add.text(20, 34, "", {
    fontFamily: "Source Sans 3, sans-serif",
    fontSize: "16px",
    color: "#f4efe4",
    wordWrap: { width: 1180 },
  });
  const talkBox = scene.add.container(16, 552, [talkBg, talkName, talkText]);
  talkBox.setVisible(false);

  const bannerBg = scene.add.graphics();
  const bannerKicker = scene.add
    .text(0, 0, "ENCONTRO SELVAGEM", {
      fontFamily: "Source Sans 3, sans-serif",
      fontSize: "12px",
      color: "#7ee0d6",
    })
    .setOrigin(0.5, 0);
  const bannerTitle = scene.add
    .text(0, 22, "", {
      fontFamily: "Cinzel, serif",
      fontSize: "28px",
      color: "#e4c36a",
    })
    .setOrigin(0.5, 0);
  const bannerHint = scene.add
    .text(0, 56, "G · enfrentar", {
      fontFamily: "Source Sans 3, sans-serif",
      fontSize: "15px",
      color: "#f4efe4",
    })
    .setOrigin(0.5, 0);
  const banner = scene.add.container(640, 88, [bannerBg, bannerKicker, bannerTitle, bannerHint]);
  banner.setVisible(false);

  const vignette = scene.add.image(640, 360, "world-vignette").setScrollFactor(0).setDepth(9000);
  const dusk = MAP_THEME[mapKey as keyof typeof MAP_THEME]?.dusk ?? WORLD_COLORS.void;
  vignette.setTint(mapKey === "verdantis" ? 0x6a8878 : 0xb8a8c8);
  scene.add.rectangle(640, 360, 1280, 720, dusk, 0.08).setScrollFactor(0).setDepth(8990);
  const root = scene.add.container(0, 0, [plaqueBox, promptBox, talkBox, banner]);
  root.setScrollFactor(0);
  root.setDepth(9100);

  const paintPrompt = (text: string) => {
    prompt.setText(text);
    promptBg.clear();
    if (!text) {
      return;
    }
    promptBg.fillStyle(WORLD_COLORS.ink, 0.74);
    promptBg.fillRoundedRect(-8, -6, prompt.width + 24, 30, 8);
    promptBg.lineStyle(1, WORLD_COLORS.crystal, 0.4);
    promptBg.strokeRoundedRect(-8, -6, prompt.width + 24, 30, 8);
  };

  return {
    root,
    setStatus(mapName) {
      title.setText(mapName);
    },
    setPrompt: paintPrompt,
    setDialogue(name, text) {
      talkName.setText(name);
      talkText.setText(text);
      talkBg.clear();
      talkBg.fillStyle(WORLD_COLORS.ink, 0.88);
      talkBg.fillRoundedRect(0, 0, 1248, 140, 16);
      talkBg.lineStyle(1, WORLD_COLORS.gold, 0.45);
      talkBg.strokeRoundedRect(0, 0, 1248, 140, 16);
      talkBg.lineStyle(1, WORLD_COLORS.crystal, 0.2);
      talkBg.lineBetween(20, 28, 220, 28);
      talkBox.setVisible(true);
    },
    clearDialogue() {
      talkBox.setVisible(false);
    },
    setEncounter(row) {
      if (!row) {
        banner.setVisible(false);
        return;
      }
      bannerTitle.setText(`${speciesTitle(row.speciesKey)}  ·  Nv ${row.level}`);
      bannerTitle.setColor(`#${speciesColor(row.speciesKey).toString(16).padStart(6, "0")}`);
      bannerBg.clear();
      bannerBg.fillStyle(WORLD_COLORS.ink, 0.86);
      bannerBg.fillRoundedRect(-220, -14, 440, 96, 16);
      bannerBg.lineStyle(2, speciesColor(row.speciesKey), 0.75);
      bannerBg.strokeRoundedRect(-220, -14, 440, 96, 16);
      banner.setVisible(true);
    },
  };
}

export function spawnAmbient(scene: Phaser.Scene, mapKey: string) {
  const count = mapKey === "verdantis" ? 48 : 18;
  for (let i = 0; i < count; i += 1) {
    const mote = scene.add.circle(
      80 + Math.random() * 2400,
      80 + Math.random() * 1500,
      mapKey === "verdantis" ? 2.2 : 1.7,
      mapKey === "verdantis" ? WORLD_COLORS.crystal : WORLD_COLORS.gold,
      0.38,
    );
    mote.setDepth(9);
    scene.tweens.add({
      targets: mote,
      y: `-=${22 + Math.random() * 36}`,
      alpha: { from: 0.12, to: 0.55 },
      duration: 2200 + Math.random() * 1800,
      yoyo: true,
      repeat: -1,
    });
  }
}
