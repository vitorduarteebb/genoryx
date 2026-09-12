import { describe, expect, it } from "vitest";
import { generateCreatureBlueprint } from "../genes/generate";
import { breedingCostGold, calculateBreeding } from "./calculate";

describe("breeding", () => {
  it("mesmo seed + mesmos pais = mesmo filhote", () => {
    const a = generateCreatureBlueprint({ seed: 4, speciesKey: "pyron", origin: "STARTER" });
    const b = generateCreatureBlueprint({ seed: 5, speciesKey: "nympha", origin: "WILD" });
    const one = calculateBreeding({ seed: 99, parentA: a, parentB: b });
    const two = calculateBreeding({ seed: 99, parentA: a, parentB: b });
    expect(one.offspring.geneticHash).toBe(two.offspring.geneticHash);
    expect(one.offspring.loci).toHaveLength(10);
    expect(one.offspring.generation).toBe(1);
  });

  it("custo config-driven: 250 * (1 + 0.40 * usos)", () => {
    expect(breedingCostGold(0, 0)).toBe(250);
    expect(breedingCostGold(1, 0)).toBe(350);
    expect(breedingCostGold(4, 4)).toBe(1050);
  });
});
