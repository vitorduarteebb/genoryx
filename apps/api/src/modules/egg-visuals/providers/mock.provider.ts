import { hexToRgb, solidPng } from "../../creature-visuals/encode-png";
import type { EggImageProvider, GeneratedEggImage } from "./types";

function sizeFromSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % 17;
  }
  return 40 + hash;
}

export class MockEggImageProvider implements EggImageProvider {
  async generateEgg(prompt: string, primaryColor: string): Promise<GeneratedEggImage> {
    const size = sizeFromSeed(prompt);
    return {
      bytes: solidPng(size, size, hexToRgb(primaryColor)),
      mimeType: "image/png",
      model: "mock",
      modelSnapshot: "mock",
    };
  }
}
