import { describe, expect, it } from "vitest";
import { buildEggGenerationKey } from "../src/modules/egg-visuals/egg-visuals.service";
import { presentCrossPotential } from "../src/modules/breeding/breeding.present";
import { calculateCrossPotential } from "@nexora/game-engine";

describe("egg generationKey", () => {
  it("é idempotente para o mesmo ovo", () => {
    const a = buildEggGenerationKey({ eggId: "e1", visualSeed: "seed", provider: "MOCK", modelVersion: "mock" });
    const b = buildEggGenerationKey({ eggId: "e1", visualSeed: "seed", provider: "MOCK", modelVersion: "mock" });
    expect(a).toBe(b);
  });

  it("provider diferente não colide", () => {
    const mock = buildEggGenerationKey({ eggId: "e1", visualSeed: "seed", provider: "MOCK", modelVersion: "mock" });
    const openai = buildEggGenerationKey({
      eggId: "e1",
      visualSeed: "seed",
      provider: "OPENAI",
      modelVersion: "gpt-image-2",
    });
    expect(mock).not.toBe(openai);
  });
});

describe("preview público", () => {
  it("CrossPotential serializado não inclui filho", () => {
    const row = presentCrossPotential(
      calculateCrossPotential(
        {
          speciesKey: "terranox",
          elementPrimary: "EARTH",
          generation: 0,
          fertility: 5,
          bodyPlan: "GOLEM",
          head: "BEAST",
          typology: "TANK",
        },
        {
          speciesKey: "florune",
          elementPrimary: "NATURE",
          generation: 0,
          fertility: 5,
          bodyPlan: "BIPED",
          head: "EXOTIC",
          typology: "HEAL",
        },
      ),
    );
    const blob = JSON.stringify(row);
    expect(blob).not.toContain("geneticHash");
    expect(blob).not.toContain("recessive");
    expect(blob).not.toContain("offspring");
  });
});
