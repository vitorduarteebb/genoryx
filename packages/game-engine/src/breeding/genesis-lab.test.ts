import { incubationConfig } from "@nexora/config";
import { describe, expect, it } from "vitest";
import { generateCreatureBlueprint } from "../genes/generate";
import { calculateBreeding, incubationMsForGrade } from "./calculate";
import {
  calculateCrossPotential,
  crossPotentialHasNoChild,
  parentPotentialFromBlueprint,
} from "./cross-potential";
import { buildEggImagePrompt, eggPromptExposesSecrets, eggSpecFromGenome } from "./egg-prompt";
import { deriveEggVisualGenome, eggVisualExposesSecrets } from "./egg-visual";
import { complexityIgnoresCombatStats, scoreGenesisComplexity } from "./genesis-complexity";

function terranoxFlorune() {
  const parentA = generateCreatureBlueprint({
    seed: 11,
    speciesKey: "terranox",
    origin: "STARTER",
    gender: "MALE",
  });
  const parentB = generateCreatureBlueprint({
    seed: 22,
    speciesKey: "florune",
    origin: "STARTER",
    gender: "FEMALE",
  });
  return { parentA, parentB };
}

describe("genesis lab engine", () => {
  it("mesmo seed + mesmos pais = mesmo filhote", () => {
    const { parentA, parentB } = terranoxFlorune();
    const one = calculateBreeding({ seed: 99, parentA, parentB });
    const two = calculateBreeding({ seed: 99, parentA, parentB });
    expect(one.offspring.geneticHash).toBe(two.offspring.geneticHash);
    expect(one.offspring.loci).toHaveLength(10);
    expect(one.genesisGrade).toBe(two.genesisGrade);
  });

  it("grade determina hatchAt e o cliente não entra na fórmula", () => {
    expect(incubationMsForGrade("COMMON")).toBe(incubationConfig.alpha.COMMON * 60_000);
    expect(incubationMsForGrade("REFINED")).toBe(incubationConfig.alpha.REFINED * 60_000);
    expect(incubationMsForGrade("RARE")).toBe(incubationConfig.alpha.RARE * 60_000);
    expect(incubationMsForGrade("EXCEPTIONAL")).toBe(incubationConfig.alpha.EXCEPTIONAL * 60_000);
    expect(incubationMsForGrade("GENESIS")).toBe(incubationConfig.alpha.GENESIS * 60_000);
    expect(incubationMsForGrade("COMMON")).toBe(0);
    expect(incubationMsForGrade("GENESIS")).toBe(0);
  });

  it("CrossPotential não revela o filho", () => {
    const { parentA, parentB } = terranoxFlorune();
    const child = calculateBreeding({ seed: 7, parentA, parentB }).offspring;
    const potential = calculateCrossPotential(
      parentPotentialFromBlueprint(parentA, { typology: "TANK" }),
      parentPotentialFromBlueprint(parentB, { typology: "HEAL" }),
    );
    expect(crossPotentialHasNoChild(potential)).toBe(true);
    expect(JSON.stringify(potential)).not.toContain(child.geneticHash);
    expect(potential.possibleElements.length).toBeGreaterThan(0);
    expect(potential.powerInheritance).toEqual({ parentA: 1, parentB: 1, novel: 1 });
  });

  it("GenesisGrade não usa poder de combate cru", () => {
    const { parentA, parentB } = terranoxFlorune();
    const child = calculateBreeding({ seed: 3, parentA, parentB }).offspring;
    const weak = scoreGenesisComplexity({
      parentA: { ...parentA, genes: { ...parentA.genes, ATK: "F", HP: "F" } },
      parentB,
      child: { ...child, genes: { ...child.genes, ATK: "F", HP: "F" } },
    });
    const strong = scoreGenesisComplexity({
      parentA: { ...parentA, genes: { ...parentA.genes, ATK: "SS", HP: "SS" } },
      parentB,
      child: { ...child, genes: { ...child.genes, ATK: "SS", HP: "SS" } },
    });
    expect(weak.score).toBe(strong.score);
    expect(complexityIgnoresCombatStats({ score: weak.score, grade: weak.grade, breakdown: weak.breakdown })).toBe(
      true,
    );
  });

  it("novo poder e mutação sobem o grade sem alterar o genome", () => {
    const { parentA, parentB } = terranoxFlorune();
    const child = calculateBreeding({ seed: 3, parentA, parentB }).offspring;
    const hash = child.geneticHash;
    const base = scoreGenesisComplexity({ parentA, parentB, child, powerOrigin: "INHERITED" });
    const neu = scoreGenesisComplexity({ parentA, parentB, child, powerOrigin: "NEW" });
    expect(neu.score).toBeGreaterThan(base.score);
    expect(child.geneticHash).toBe(hash);
  });

  it("arte do ovo é determinística e não expõe recessivos", () => {
    const { parentA, parentB } = terranoxFlorune();
    const bred = calculateBreeding({ seed: 44, parentA, parentB, powerOrigin: "NEW" });
    const one = deriveEggVisualGenome({
      child: bred.offspring,
      parentA,
      parentB,
      genesisGrade: bred.genesisGrade,
      powerOrigin: "NEW",
      eggKey: "egg-1",
    });
    const two = deriveEggVisualGenome({
      child: bred.offspring,
      parentA,
      parentB,
      genesisGrade: bred.genesisGrade,
      powerOrigin: "NEW",
      eggKey: "egg-1",
    });
    expect(one).toEqual(two);
    expect(eggVisualExposesSecrets(one)).toBe(false);
    const prompt = buildEggImagePrompt(eggSpecFromGenome("egg-1", one));
    expect(eggPromptExposesSecrets(prompt)).toBe(false);
    expect(prompt).toContain("ONLY the egg");
    expect(prompt).not.toContain(bred.offspring.loci[0]?.recessive.cardFamily ?? "___");
  });

  it("ovos da mesma combinação podem divergir com seeds diferentes", () => {
    const { parentA, parentB } = terranoxFlorune();
    const a = calculateBreeding({ seed: 101, parentA, parentB });
    const b = calculateBreeding({ seed: 202, parentA, parentB });
    const eggA = deriveEggVisualGenome({
      child: a.offspring,
      parentA,
      parentB,
      genesisGrade: a.genesisGrade,
      eggKey: "a",
    });
    const eggB = deriveEggVisualGenome({
      child: b.offspring,
      parentA,
      parentB,
      genesisGrade: b.genesisGrade,
      eggKey: "b",
    });
    expect(eggA.visualSeed === eggB.visualSeed && a.offspring.geneticHash === b.offspring.geneticHash).toBe(false);
  });
});
