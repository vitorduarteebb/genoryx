import { resolveCreatureVisual, versionedVisualUrl } from "@nexora/config";
import { describe, expect, it } from "vitest";

describe("resolveCreatureVisual", () => {
  it("READY do lifeStage atual vence e versiona a URL", () => {
    const visual = resolveCreatureVisual({
      lifeStage: "YOUNG",
      assets: [
        { lifeStage: "BABY", status: "READY", publicUrl: "/baby.png", imageHash: "aaaabbbbccccdddd" },
        { lifeStage: "YOUNG", status: "READY", publicUrl: "/young.png", imageHash: "1111222233334444" },
      ],
    });
    expect(visual.source).toBe("canonical");
    expect(visual.lifeStage).toBe("YOUNG");
    expect(visual.url).toBe(versionedVisualUrl("/young.png", "1111222233334444"));
  });

  it("BABY não usa YOUNG; ADULT pode cair para estágio anterior READY", () => {
    const baby = resolveCreatureVisual({
      lifeStage: "BABY",
      assets: [{ lifeStage: "YOUNG", status: "READY", publicUrl: "/young.png", imageHash: "hash" }],
    });
    expect(baby.url).toBeNull();
    expect(baby.source).toBe("legacy");

    const adult = resolveCreatureVisual({
      lifeStage: "ADULT",
      assets: [{ lifeStage: "YOUNG", status: "READY", publicUrl: "/young.png", imageHash: "abcd1234abcd1234" }],
    });
    expect(adult.lifeStage).toBe("YOUNG");
    expect(adult.url).toContain("/young.png");
  });

  it("sem asset READY devolve forming ou fallback, nunca URL quebrada", () => {
    const forming = resolveCreatureVisual({
      lifeStage: "BABY",
      assets: [{ lifeStage: "BABY", status: "PENDING", publicUrl: null }],
    });
    expect(forming.url).toBeNull();
    expect(forming.source).toBe("forming");

    const missing = resolveCreatureVisual({ lifeStage: "BABY", assets: [] });
    expect(missing.url).toBeNull();
    expect(missing.source).toBe("legacy");
  });

  it("OPENAI READY vence MOCK READY no mesmo estágio", () => {
    const visual = resolveCreatureVisual({
      lifeStage: "BABY",
      preferredProvider: "OPENAI",
      assets: [
        { lifeStage: "BABY", status: "READY", publicUrl: "/mock.png", imageHash: "mockhashmockhash", provider: "MOCK" },
        { lifeStage: "BABY", status: "READY", publicUrl: "/openai.png", imageHash: "openaihashopenai", provider: "OPENAI" },
      ],
    });
    expect(visual.provider).toBe("OPENAI");
    expect(visual.url).toContain("/openai.png");
    expect(visual.source).toBe("canonical");
  });

  it("coleção pode cair no MOCK; reveal estrito não mostra MOCK", () => {
    const collection = resolveCreatureVisual({
      lifeStage: "BABY",
      preferredProvider: "OPENAI",
      assets: [{ lifeStage: "BABY", status: "READY", publicUrl: "/mock.png", imageHash: "mockhashmockhash", provider: "MOCK" }],
    });
    expect(collection.provider).toBe("MOCK");
    expect(collection.source).toBe("fallback");

    const reveal = resolveCreatureVisual({
      lifeStage: "BABY",
      preferredProvider: "OPENAI",
      strictPreferred: true,
      assets: [
        { lifeStage: "BABY", status: "READY", publicUrl: "/mock.png", imageHash: "mockhashmockhash", provider: "MOCK" },
        { lifeStage: "BABY", status: "PENDING", publicUrl: null, provider: "OPENAI" },
      ],
    });
    expect(reveal.url).toBeNull();
    expect(reveal.source).toBe("forming");
  });
});
