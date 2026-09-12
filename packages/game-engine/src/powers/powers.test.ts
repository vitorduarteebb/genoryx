import { describe, expect, it } from "vitest";
import { createSeededRandom } from "../random/random-service";
import { generatePowerCards } from "./cards";
import { evaluateFusionAvailability, familyFor, fusionIdentity } from "./fusion";
import { backfillGeneticPower } from "./generate-power";
import { inheritGeneticPower, rollPowerInheritance, seedForInheritanceRoll } from "./inherit";
import { battleFusionProof, breedingPowerProof, creaturePowerProof } from "./proof";
import { guardTrigger, emptyResonance } from "./resonance";
import { withinBudget } from "./budget";
import { effectBudgetByLocus } from "@nexora/config";

describe("genetic powers V1", () => {
  it("prova Pyron / Florune / Terranox com 10 manifestações", () => {
    for (const species of ["pyron", "florune", "terranox"] as const) {
      const row = creaturePowerProof(species);
      expect(row.cards).toHaveLength(10);
      expect(row.cards[0]?.role).toBe("CORE_ATTACK");
      expect(row.cards[9]?.role).toBe("ULTIMATE");
      expect(row.cards[9]?.cost).toBeGreaterThan(row.cards[0]?.cost ?? 0);
      for (const card of row.cards) {
        if (!card.catalogKey) {
          expect(withinBudget(card.effects, effectBudgetByLocus[card.locus].budget)).toBe(true);
        }
      }
      if (species === "terranox") {
        expect(row.cards[0]?.namePt).toBe("Pisada Sísmica");
        expect(row.cards[0]?.name).toBe("Quake Stomp");
        expect(row.cards[0]?.effects[0]?.value).toBe(17);
        expect(row.cards[0]?.text).toContain("17");
      }
    }
    expect(creaturePowerProof("pyron").power.typology).toBe("BURN");
    expect(creaturePowerProof("florune").power.typology).toBe("HEAL");
    expect(creaturePowerProof("terranox").power.typology).toBe("TANK");
  });

  it("mesmo power + seed gera as mesmas 10 cartas", () => {
    const power = creaturePowerProof("pyron").power;
    const a = generatePowerCards({ power, speciesKey: "pyron", seed: 9 });
    const b = generatePowerCards({ power, speciesKey: "pyron", seed: 9 });
    expect(a.map((row) => row.catalogKey)).toEqual(b.map((row) => row.catalogKey));
    expect(a.map((row) => row.text)).toEqual(b.map((row) => row.text));
  });

  it("herança 1/3 com seeds conhecidos", () => {
    const father = backfillGeneticPower({
      creatureId: "fa",
      speciesKey: "pyron",
      element: "FIRE",
      geneticHash: "a",
    });
    const mother = backfillGeneticPower({
      creatureId: "mo",
      speciesKey: "florune",
      element: "NATURE",
      geneticHash: "b",
    });
    const seedA = seedForInheritanceRoll(0);
    const seedB = seedForInheritanceRoll(1);
    const seedC = seedForInheritanceRoll(2);
    expect(rollPowerInheritance(createSeededRandom(seedA))).toBe(0);
    expect(rollPowerInheritance(createSeededRandom(seedB))).toBe(1);
    expect(rollPowerInheritance(createSeededRandom(seedC))).toBe(2);
    const inheritedA = inheritGeneticPower({
      rng: createSeededRandom(seedA),
      childId: "c",
      childElement: "FIRE",
      parentA: { genome: father.genome, lineageId: father.lineageId, creatureId: "fa" },
      parentB: { genome: mother.genome, lineageId: mother.lineageId, creatureId: "mo" },
    });
    expect(inheritedA.originType).toBe("INHERITED_FATHER");
    expect(inheritedA.lineageId).toBe(father.lineageId);
    const inheritedB = inheritGeneticPower({
      rng: createSeededRandom(seedB),
      childId: "c",
      childElement: "NATURE",
      parentA: { genome: father.genome, lineageId: father.lineageId, creatureId: "fa" },
      parentB: { genome: mother.genome, lineageId: mother.lineageId, creatureId: "mo" },
    });
    expect(inheritedB.originType).toBe("INHERITED_MOTHER");
    const created = inheritGeneticPower({
      rng: createSeededRandom(seedC),
      childId: "c",
      childElement: "FIRE",
      parentA: { genome: father.genome, lineageId: father.lineageId, creatureId: "fa" },
      parentB: { genome: mother.genome, lineageId: mother.lineageId, creatureId: "mo" },
    });
    expect(created.originType).toBe("MUTATED_NEW");
    expect(created.lineageId).not.toBe(father.lineageId);
    expect(breedingPowerProof().runs).toHaveLength(3);
  });

  it("fusão order-independent e BURN+BURN não conta", () => {
    expect(fusionIdentity(["TANK", "BURN"])).toBe(fusionIdentity(["BURN", "TANK"]));
    expect(familyFor(["BURN", "TANK"])?.key).toBe("LIVING_FURNACE");
    expect(familyFor(["TANK", "BURN"])?.key).toBe("LIVING_FURNACE");
    expect(familyFor(["BURN", "BURN"])).toBeNull();
    expect(familyFor(["CONTROL", "HEAL", "BURN"])?.key).toBe("PHOENIX_CYCLE");
    expect(familyFor(["BURN", "HEAL", "CONTROL"])?.key).toBe("PHOENIX_CYCLE");
    const early = evaluateFusionAvailability({
      typologies: ["BURN", "TANK", "HEAL"],
      round: 4,
      resonance: 8,
      momentum: 2,
    });
    expect(early.every((row) => !row.ready)).toBe(true);
    const later = battleFusionProof();
    expect(later.round1to4).toEqual([]);
    expect(later.livingFurnace?.ready).toBe(true);
    expect(later.vitalAshes?.ready).toBe(true);
  });

  it("anti-loop corta profundidade", () => {
    let state = emptyResonance();
    const first = guardTrigger(state, "burn-heal");
    expect(first.ok).toBe(true);
    const again = guardTrigger(first.next, "burn-heal");
    expect(again.ok).toBe(false);
    let deep = first.next;
    for (let i = 0; i < 5; i += 1) {
      const step = guardTrigger(deep, `x${i}`);
      deep = step.next;
    }
    expect(deep.triggerDepth).toBeLessThanOrEqual(3);
  });
});
