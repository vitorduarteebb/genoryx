import { resolveCreatureGameAsset } from "@nexora/config";
import { describe, expect, it } from "vitest";

describe("resolveCreatureGameAsset", () => {
  it("prioriza 3D READY e nunca devolve quadrado", () => {
    const visual = resolveCreatureGameAsset({
      modelUrl: "/models/florune.glb",
      portrait: { url: "/portraits/florune.png", imageHash: "abcd", provider: "OPENAI", status: "READY" },
    });
    expect(visual.renderMode).toBe("MODEL_3D");
    expect(visual.source).toBe("creature-3d");
    expect(visual.modelUrl).toBe("/models/florune.glb");
  });

  it("silhueta Genesis quando não há arte", () => {
    const visual = resolveCreatureGameAsset({ lifeStage: "BABY" });
    expect(visual.renderMode).toBe("SILHOUETTE");
    expect(visual.portraitUrl).toBeNull();
    expect(visual.modelUrl).toBeNull();
  });
});
