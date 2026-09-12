import type { CreatureVisualGenerationSpec } from "@nexora/game-engine";
import { hexToRgb, solidPng } from "../encode-png";
import type { CreatureImageProvider, GeneratedCreatureImage, VisualQaReport } from "./types";

function placeholderPng(spec: CreatureVisualGenerationSpec): Buffer {
  const rgb = hexToRgb(spec.primaryColor);
  const size = spec.lifeStage === "ADULT" ? 64 : spec.lifeStage === "YOUNG" ? 48 : 32;
  return solidPng(size, size, rgb);
}

function passingQa(): VisualQaReport {
  return {
    bodyPlanMatch: true,
    headMatch: true,
    eyeMatch: true,
    hornMatch: true,
    limbsMatch: true,
    tailMatch: true,
    backMatch: true,
    patternMatch: true,
    colorsMatch: true,
    temperamentMatch: true,
    mutationMatch: true,
    lifeStageMatch: true,
    extraUnexpectedTraits: [],
    missingTraits: [],
    overallScore: 1,
    criticalErrors: [],
  };
}

export class MockCreatureImageProvider implements CreatureImageProvider {
  async generateInitialCreature(spec: CreatureVisualGenerationSpec, _prompt?: string): Promise<GeneratedCreatureImage> {
    return {
      bytes: placeholderPng(spec),
      mimeType: "image/png",
      model: "mock",
      modelSnapshot: "mock",
    };
  }

  async evolveCreatureVisual(
    spec: CreatureVisualGenerationSpec,
    _prompt?: string,
    _references?: Buffer[],
  ): Promise<GeneratedCreatureImage> {
    return {
      bytes: placeholderPng(spec),
      mimeType: "image/png",
      model: "mock",
      modelSnapshot: "mock",
    };
  }

  async validateCreatureVisual(): Promise<VisualQaReport> {
    return passingQa();
  }
}
