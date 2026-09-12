import { assemblePhenotype } from "@nexora/config";
import { describe, expect, it } from "vitest";

describe("assemblePhenotype", () => {
  it("monta Pyron com corpo quádrupede, cabeça dracônica e cartas de fogo", () => {
    const row = assemblePhenotype({ speciesKey: "pyron", seed: 11 });
    expect(row.body).toBe("body/quadruped.png");
    expect(row.head).toBe("head/draconic.png");
    expect(row.tail).toBe("tail/blade.png");
    expect(row.limbs).toBeNull();
    expect(row.eyes.startsWith("eyes/")).toBe(true);
    expect(row.horns?.startsWith("horns/")).toBe(true);
  });

  it("respeita tipagem: Nympha aquática, Florune bípede, Terranox golem", () => {
    const water = assemblePhenotype({ speciesKey: "nympha", seed: 2 });
    const nature = assemblePhenotype({ speciesKey: "florune", seed: 3 });
    const earth = assemblePhenotype({ speciesKey: "terranox", seed: 4 });
    expect(water.body).toBe("body/aquatic.png");
    expect(water.head).toBe("head/serpent.png");
    expect(water.limbs).toBeNull();
    expect(nature.body).toBe("body/biped.png");
    expect(nature.head).toBe("head/exotic.png");
    expect(earth.body).toBe("body/biped-heavy.png");
    expect(earth.head).toBe("head/beast.jpg");
    expect(earth.limbs).toBeNull();
    expect(earth.tail).toBeNull();
    expect(nature.limbs).toBeNull();
    expect(nature.tail).toBeNull();
  });

  it("mesmo seed gera o mesmo fenótipo", () => {
    const a = assemblePhenotype({ speciesKey: "pyron", bodyPlan: "QUADRUPED", head: "DRACONIC", seed: 9001 });
    const b = assemblePhenotype({ speciesKey: "pyron", bodyPlan: "QUADRUPED", head: "DRACONIC", seed: 9001 });
    expect(a).toEqual(b);
  });
});
