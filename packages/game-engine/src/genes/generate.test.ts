import { cardBelongsToSpecies, getCardDefinition } from "@nexora/config";
import { GENETIC_CARD_LOCI } from "@nexora/types";
import { describe, expect, it } from "vitest";
import { generateCreatureBlueprint } from "./generate";

describe("generateCreatureBlueprint", () => {
  it("cria starter uma vez com 10 loci e hash estável", () => {
    const a = generateCreatureBlueprint({ seed: 9001, speciesKey: "pyron", origin: "STARTER" });
    const b = generateCreatureBlueprint({ seed: 9001, speciesKey: "pyron", origin: "STARTER" });
    expect(a.loci).toHaveLength(GENETIC_CARD_LOCI.length);
    expect(a.geneticHash).toBe(b.geneticHash);
    expect(a.genes.HP).toBe(b.genes.HP);
    expect(a.headExpressed).toBe("DRACONIC");
    expect(a.bodyPlanExpressed).toBe("QUADRUPED");
    expect(a.chassis?.chassisId).toBe("GENORYX_CORE_CHASSIS_V1");
    expect(a.chassis).toEqual(b.chassis);
  });

  it("cartas do starter respeitam a tipagem da espécie", () => {
    const fire = generateCreatureBlueprint({ seed: 11, speciesKey: "pyron", origin: "STARTER" });
    const water = generateCreatureBlueprint({ seed: 12, speciesKey: "nympha", origin: "STARTER" });
    const earth = generateCreatureBlueprint({ seed: 13, speciesKey: "terranox", origin: "WILD" });
    for (const locus of fire.loci) {
      const card = getCardDefinition(locus.expressed.cardFamily);
      expect(card && cardBelongsToSpecies(card, "pyron")).toBe(true);
    }
    for (const locus of water.loci) {
      const card = getCardDefinition(locus.expressed.cardFamily);
      expect(card && cardBelongsToSpecies(card, "nympha")).toBe(true);
    }
    expect(earth.elementPrimary).toBe("EARTH");
    for (const locus of earth.loci) {
      const card = getCardDefinition(locus.expressed.cardFamily);
      expect(card && cardBelongsToSpecies(card, "terranox")).toBe(true);
    }
  });

  it("sementes diferentes divergem", () => {
    const a = generateCreatureBlueprint({ seed: 1, speciesKey: "nympha", origin: "WILD" });
    const b = generateCreatureBlueprint({ seed: 2, speciesKey: "nympha", origin: "WILD" });
    expect(a.geneticHash).not.toBe(b.geneticHash);
  });

  it("nível do encontro não muda o DNA — a captura deve persistir o mesmo indivíduo", () => {
    const fought = generateCreatureBlueprint({ seed: 4242, speciesKey: "florune", origin: "WILD", level: 6, name: "Florune" });
    const captured = generateCreatureBlueprint({ seed: 4242, speciesKey: "florune", origin: "WILD", level: 1 });
    expect(captured.geneticHash).toBe(fought.geneticHash);
    expect(captured.chassis).toEqual(fought.chassis);
    expect(captured.loci.map((row) => row.expressed.cardFamily)).toEqual(fought.loci.map((row) => row.expressed.cardFamily));
  });
});
