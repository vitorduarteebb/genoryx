import { paletteForSpecies } from "@nexora/config";
import type { CardArtGenerationSpec } from "@nexora/game-engine";
import { hexToRgb, solidPng } from "../../creature-visuals/encode-png";
import type { CardArtProvider, CardArtQaReport, GeneratedCardArt } from "./types";

const ELEMENT_HEX: Record<string, string> = {
  NATURE: "#5DBE6E",
  FIRE: "#D4513C",
  WATER: "#4EB8C8",
  ELECTRIC: "#E8C84A",
  VOID: "#4A2A6A",
  ARCANE: "#B48CFF",
  EARTH: "#C4A06A",
};

function passingQa(): CardArtQaReport {
  return {
    validImage: true,
    noSignificantText: true,
    noCardFrame: true,
    elementCoherent: true,
    conceptCoherent: true,
    styleMatch: true,
    extraUnexpectedTraits: [],
    missingTraits: [],
    overallScore: 1,
    criticalErrors: [],
  };
}

export class MockCardArtProvider implements CardArtProvider {
  async generateCardArt(spec: CardArtGenerationSpec, _prompt?: string, references?: Buffer[]): Promise<GeneratedCardArt> {
    const portrait = references?.find((row) => row.length > 256);
    if (portrait) {
      return {
        bytes: portrait,
        mimeType: "image/png",
        model: "mock",
        modelSnapshot: "mock-creature-portrait",
      };
    }
    const species = spec.speciesAffinity[0] ?? "florune";
    const hex = ELEMENT_HEX[spec.element] ?? paletteForSpecies(species).primaryColor;
    return {
      bytes: solidPng(256, 256, hexToRgb(hex)),
      mimeType: "image/png",
      model: "mock",
      modelSnapshot: "mock",
    };
  }

  async validateCardArt(): Promise<CardArtQaReport> {
    return passingQa();
  }
}
