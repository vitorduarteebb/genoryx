import { GENETIC_ENGINE_VERSION } from "@nexora/config";
import { describe, expect, it } from "vitest";
import { blueprintFromParents, generateCreatureBlueprint } from "../genes/generate";
import { assembleGeneticCombat } from "./assemble";
import { clauseReady } from "./runtime";
import { collectCombatGallery } from "./sample";
import { simulateCombatPopulation } from "./simulate";
import { partySynergyLinks } from "./synergy";
import { validateKit } from "./validate";

describe("genetic combat engine", () => {
  it("congela identidade: mesmo genome + birthSeed = mesmo kit", () => {
    const blueprint = generateCreatureBlueprint({ seed: 20260911, speciesKey: "pyron", origin: "STARTER" });
    const a = assembleGeneticCombat({ creatureId: "alpha", blueprint });
    const b = assembleGeneticCombat({ creatureId: "alpha", blueprint });
    expect(a).toEqual(b);
    expect(a.engineVersion).toBe(GENETIC_ENGINE_VERSION);
    expect(validateKit(a.cards)).toBeNull();
    expect(a.cards).toHaveLength(10);
    expect(a.cards[8]?.tier).toBe("SIGNATURE");
    expect(a.cards[9]?.tier).toBe("SUPREME");
    expect(a.cards.every((row) => row.cost >= 1 && row.cost <= 4)).toBe(true);
    expect(Math.max(...a.cards.map((row) => row.effects.filter((effect) => effect.op === "DAMAGE").reduce((sum, effect) => sum + (effect.value ?? 0), 0)))).toBeLessThanOrEqual(40);
  });

  it("starter não nasce injogável", () => {
    const blueprint = generateCreatureBlueprint({ seed: 7, speciesKey: "terranox", origin: "STARTER" });
    const manifest = blueprint.combatManifest!;
    expect(manifest.rolls.coherence).toBeGreaterThanOrEqual(55);
    expect(manifest.cards.some((row) => row.cost <= 2)).toBe(true);
  });

  it("condição de posição falha fora do FRONT", () => {
    expect(clauseReady({ op: "DAMAGE", value: 10, condition: { selfPosition: "FRONT" } }, { slot: "BACK" } as never, undefined)).toBe(false);
    expect(clauseReady({ op: "DAMAGE", value: 10, condition: { selfPosition: "FRONT" } }, { slot: "FRONT" } as never, undefined)).toBe(true);
  });

  it("irmãos dos mesmos pais divergem", () => {
    const father = generateCreatureBlueprint({ seed: 11, speciesKey: "pyron", origin: "STARTER" });
    const mother = generateCreatureBlueprint({ seed: 22, speciesKey: "terranox", origin: "WILD" });
    const a = blueprintFromParents(101, father, mother, 0.2, 0.2, 0.1);
    const b = blueprintFromParents(202, father, mother, 0.2, 0.2, 0.1);
    expect(a.combatManifest?.fingerprint).not.toBe(b.combatManifest?.fingerprint);
  });

  it("amostra cobre qualidade multidimensional", () => {
    const rows = Array.from({ length: 24 }, (_, index) => {
      const species = ["pyron", "terranox", "florune", "sparkyn", "nympha", "voltaris"][index % 6]!;
      const origin = index < 4 ? "STARTER" : "WILD" as const;
      const blueprint = generateCreatureBlueprint({ seed: 4000 + index * 13, speciesKey: species, origin });
      return blueprint.combatManifest!;
    });
    expect(rows.some((row) => row.rolls.coherence >= 80 && row.rolls.efficiency >= 60)).toBe(true);
    expect(rows.some((row) => row.rolls.coherence < 50 || row.rolls.efficiency < 50)).toBe(true);
    expect(rows.some((row) => row.identity.quirks.length > 0 || row.identity.anomaly)).toBe(true);
    expect(new Set(rows.map((row) => row.identity.archetype)).size).toBeGreaterThan(1);
  });

  it("time de três pode formar ligações de sinergia", () => {
    const a = generateCreatureBlueprint({ seed: 3, speciesKey: "florune", origin: "STARTER" });
    const b = generateCreatureBlueprint({ seed: 4, speciesKey: "sparkyn", origin: "STARTER" });
    const c = generateCreatureBlueprint({ seed: 5, speciesKey: "pyron", origin: "STARTER" });
    const links = partySynergyLinks([
      { creatureId: "a", name: "A", manifest: a.combatManifest! },
      { creatureId: "b", name: "B", manifest: b.combatManifest! },
      { creatureId: "c", name: "C", manifest: c.combatManifest! },
    ]);
    expect(Array.isArray(links)).toBe(true);
  });
});

describe("genetic combat simulation", () => {
  it("população virtual mede diversidade sem NFT", () => {
    const { stats } = simulateCombatPopulation(200);
    expect(stats.count).toBe(200);
    expect(stats.averageCost).toBeGreaterThan(1);
    expect(stats.averageCost).toBeLessThan(4);
    expect(stats.averageSimilarity).toBeLessThan(0.95);
    expect(Object.keys(stats.identityCounts).length).toBeGreaterThan(1);
  });

  it("galeria cobre 20 criaturas e 5 times", () => {
    const { samples, teams } = collectCombatGallery(240);
    expect(samples.length).toBeGreaterThanOrEqual(20);
    expect(teams).toHaveLength(5);
    const labels = new Set(samples.map((row) => row.label));
    expect(labels.has("excelente")).toBe(true);
    expect(labels.has("ruim")).toBe(true);
    expect(labels.has("irmao-a")).toBe(true);
    expect(samples.find((row) => row.label === "irmao-a")?.fingerprint).not.toBe(
      samples.find((row) => row.label === "irmao-b")?.fingerprint,
    );
  });
});
