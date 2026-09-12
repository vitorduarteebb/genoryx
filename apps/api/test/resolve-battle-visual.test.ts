import { resolveBattleCreatureVisual } from "@nexora/config";
import { describe, expect, it } from "vitest";

describe("resolveBattleCreatureVisual", () => {
  it("3D READY vence retrato", () => {
    const visual = resolveBattleCreatureVisual({
      modelUrl: "/models/florune.glb?v=abc",
      portrait: { url: "/portraits/florune.png", provider: "OPENAI", status: "READY" },
      lifeStage: "BABY",
      bodyPlan: "BIPED",
    });
    expect(visual.renderMode).toBe("MODEL_3D");
    expect(visual.source).toBe("creature-3d");
    expect(visual.portraitUrl).toContain("florune");
  });

  it("wild sem instance usa species master, nunca quadrado", () => {
    const visual = resolveBattleCreatureVisual({
      speciesMaster: { portraitUrl: "/card-art/x/image?v=1", provider: "OPENAI" },
      lifeStage: "BABY",
    });
    expect(visual.renderMode).toBe("SPECIES_MASTER");
    expect(visual.portraitUrl).toBeTruthy();
  });

  it("sem asset vira silhueta, não cor", () => {
    const visual = resolveBattleCreatureVisual({ lifeStage: "BABY" });
    expect(visual.renderMode).toBe("SILHOUETTE");
    expect(visual.portraitUrl).toBeNull();
    expect(visual.modelUrl).toBeNull();
    expect(visual.forming).toBe(false);
  });

  it("retrato PENDING sem URL marca forming, ainda sem quadrado", () => {
    const visual = resolveBattleCreatureVisual({
      portrait: { status: "PENDING" },
      lifeStage: "BABY",
    });
    expect(visual.renderMode).toBe("SILHOUETTE");
    expect(visual.forming).toBe(true);
  });
});
