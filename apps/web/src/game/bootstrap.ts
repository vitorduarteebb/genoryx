import { tokens } from "@nexora/ui";
import * as Phaser from "phaser";
import { HavenScene } from "./scenes/haven-scene";

export function createNexoraGame(parent: HTMLElement, accessToken: string, mapKey: string) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: tokens.canvasWidth,
    height: tokens.canvasHeight,
    backgroundColor: tokens.colors.void,
    banner: false,
    scene: [HavenScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    callbacks: {
      preBoot: (game) => {
        game.registry.set("accessToken", accessToken);
        game.registry.set("mapKey", mapKey);
      },
    },
  });
}
