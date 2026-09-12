import { describe, expect, it } from "vitest";
import { presentModel } from "../src/common/creature-model-present";
import { sanitizeMeshyError } from "../src/modules/creature-models/meshy.client";

describe("presentModel", () => {
  it("só devolve READY com URL versionada", () => {
    expect(presentModel({ lifeStage: "BABY", modelAssets: [] })).toBeNull();
    const presented = presentModel({
      lifeStage: "BABY",
      modelAssets: [
        {
          lifeStage: "BABY",
          status: "READY",
          publicUrl: "/creature-models/m1/model",
          modelHash: "aabbccddeeff0011",
          version: 1,
        },
      ],
    });
    expect(presented?.url).toContain("/creature-models/m1/model");
    expect(presented?.url).toContain("v=aabbccddeeff0011");
  });
});

describe("Meshy client", () => {
  it("não vaza token em erro", () => {
    expect(sanitizeMeshyError("Bearer msy_secret_123 failed")).toBe("Bearer *** failed");
  });
});
