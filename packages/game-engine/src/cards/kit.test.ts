import { CARD_GEN_VERSION, cardKitSlots, getCardDefinition } from "@nexora/config";
import { GENETIC_CARD_LOCI } from "@nexora/types";
import { describe, expect, it } from "vitest";
import { createBattleState } from "../battle/create";
import { reduceBattle } from "../battle/reduce";
import { blueprintFromParents, generateCreatureBlueprint } from "../genes/generate";
import { budgetUsed } from "../powers/budget";
import { collectCardContributions } from "./deck";
import { assembleCreatureCardKit, isCardKitManifest, kitSeed, kitToDefinition } from "./kit";

const bases = { baseHp: 90, baseAtk: 120, baseDef: 40, baseMag: 85, baseRes: 75, baseSpd: 100 };

function kitFor(speciesKey: string, seed: number, origin: "STARTER" | "WILD" = "STARTER") {
  const blueprint = generateCreatureBlueprint({ seed, speciesKey, origin });
  return {
    blueprint,
    kit: assembleCreatureCardKit({ creatureId: `id:${speciesKey}:${seed}`, blueprint }),
  };
}

describe("creature card kit G1–G10", () => {
  it("A — DNA diferente produz kits diferentes", () => {
    const sparkyn = kitFor("sparkyn", 101).kit;
    const pyron = kitFor("pyron", 101).kit;
    const florune = kitFor("florune", 101).kit;
    expect(sparkyn.cards.map((row) => row.namePt)).not.toEqual(pyron.cards.map((row) => row.namePt));
    expect(pyron.cards.map((row) => row.namePt)).not.toEqual(florune.cards.map((row) => row.namePt));
    expect(sparkyn.cards.every((row) => row.element === "ELECTRIC")).toBe(true);
    expect(pyron.cards.every((row) => row.element === "FIRE")).toBe(true);
  });

  it("B — mesma seed + mesmo DNA = mesmo kit", () => {
    const a = kitFor("sparkyn", 2026).kit;
    const b = kitFor("sparkyn", 2026).kit;
    expect(a).toEqual(b);
    expect(kitSeed({ creatureId: "id:sparkyn:2026", geneticHash: kitFor("sparkyn", 2026).blueprint.geneticHash })).toBe(
      kitSeed({ creatureId: "id:sparkyn:2026", geneticHash: kitFor("sparkyn", 2026).blueprint.geneticHash }),
    );
  });

  it("C — nenhum kit nasce com 10 cartas iguais", () => {
    for (const species of ["sparkyn", "pyron", "florune"] as const) {
      const names = kitFor(species, 7).kit.cards.map((row) => row.namePt);
      expect(new Set(names).size).toBe(10);
    }
  });

  it("D — G9 é SIGNATURE e G10 é SUPREME", () => {
    const kit = kitFor("sparkyn", 9).kit;
    expect(kit.cards.find((row) => row.locus === "G9")?.tier).toBe("SIGNATURE");
    expect(kit.cards.find((row) => row.locus === "G10")?.tier).toBe("SUPREME");
    expect(kitToDefinition(kit.cards.find((row) => row.locus === "G10")!).type).toBe("ULTIMATE");
    const sample = kitToDefinition(kit.cards[0]!);
    expect(sample.tags).toEqual([kit.cards[0]!.function, kit.cards[0]!.tier]);
    expect(sample.visualTags).toEqual([...kit.cards[0]!.modifierGenes]);
  });

  it("E — sorte só desloca o budget; efeitos ficam no teto do locus", () => {
    const kit = kitFor("terranox", 44).kit;
    for (const card of kit.cards) {
      expect(card.luckRoll).toBeGreaterThanOrEqual(0);
      expect(card.luckRoll).toBeLessThanOrEqual(1);
      expect(budgetUsed(card.effects)).toBeLessThanOrEqual(cardKitSlots[card.locus].budget);
      expect(card.powerBudget).toBe(cardKitSlots[card.locus].budget);
    }
  });

  it("F — energia fica entre 1 e 4", () => {
    const kit = kitFor("voltaris", 12).kit;
    expect(kit.cards.map((row) => row.cost)).toEqual([
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
    ]);
    for (const card of kit.cards) {
      expect(card.cost).toBeGreaterThanOrEqual(1);
      expect(card.cost).toBeLessThanOrEqual(4);
    }
    expect(kit.cards.find((row) => row.locus === "G1")?.cost).toBeLessThanOrEqual(2);
    expect(kit.cards.find((row) => row.locus === "G10")?.cost).toBeGreaterThanOrEqual(3);
  });

  it("G — breeding muda o pool herdado", () => {
    const father = generateCreatureBlueprint({ seed: 3, speciesKey: "pyron", origin: "STARTER" });
    const mother = generateCreatureBlueprint({ seed: 8, speciesKey: "sparkyn", origin: "WILD" });
    const child = blueprintFromParents(1001, father, mother, 0, 0, 0);
    const solo = assembleCreatureCardKit({ creatureId: "solo", blueprint: mother });
    const inherited = child.loci
      .map((locus) => locus.expressed)
      .filter(isCardKitManifest)
      .flatMap((card) => card.derivedFrom.inherited);
    expect(inherited.length).toBeGreaterThan(0);
    expect(inherited).not.toEqual(solo.cards.flatMap((card) => card.derivedFrom.inherited));
  });

  it("H — pais incompatíveis não liberam Fire puro num elétrico sem mutação/secundário", () => {
    const blueprint = generateCreatureBlueprint({ seed: 15, speciesKey: "sparkyn", origin: "STARTER" });
    const kit = assembleCreatureCardKit({
      creatureId: "sparkyn-no-fire",
      blueprint,
      parents: [{ element: "FIRE", families: ["ember_strike", "living_furnace"] }],
    });
    expect(kit.cards.every((row) => row.element === "ELECTRIC")).toBe(true);
    expect(kit.cards.some((row) => row.element === "FIRE")).toBe(false);
  });

  it("I — kit versionado não é tratado como legado", () => {
    const card = kitFor("sparkyn", 1).kit.cards[0];
    expect(isCardKitManifest(card)).toBe(true);
    expect(isCardKitManifest({ ...card, generatorVersion: "gxr-kit-v0" })).toBe(false);
    expect(isCardKitManifest({ cardFamily: "spark_jolt", variant: "alpha-v1" })).toBe(false);
    expect(["gxr-kit-v1", "gxr-gce-v1"]).toContain(card?.generatorVersion);
  });

  it("J — G1–G10 cobrem papéis distintos", () => {
    const kit = kitFor("florune", 33).kit;
    expect(kit.cards.map((row) => row.locus)).toEqual(GENETIC_CARD_LOCI.map((row) => row.key));
    expect(kit.cards.map((row) => row.function)).toEqual(
      expect.arrayContaining(["ATTACK", "SHIELD", "COUNTER"]),
    );
  });

  it("K — cardFamily permanece no catálogo da espécie quando existe", () => {
    const { blueprint, kit } = kitFor("pyron", 11);
    for (const card of kit.cards) {
      const catalog = getCardDefinition(card.cardFamily);
      expect(catalog).toBeTruthy();
      expect(catalog?.species.includes(blueprint.speciesKey) || catalog?.element === "FIRE").toBe(true);
    }
  });

  it("L — combate usa a ficha resolved, não o nome do catálogo", () => {
    const { blueprint, kit } = kitFor("sparkyn", 77);
    const sealed = { ...blueprint, loci: blueprint.loci.map((locus, index) => ({ ...locus, expressed: kit.cards[index]! })) };
    const rows = collectCardContributions([{ blueprint: sealed, creatureId: "spark-1" }]);
    const genetic = rows.filter((row) => row.locus);
    expect(genetic).toHaveLength(10);
    for (const row of genetic) {
      const manifest = kit.cards.find((card) => card.locus === row.locus);
      expect(row.resolved?.name).toBe(manifest?.namePt);
      expect(row.resolved?.cost).toBe(manifest?.cost);
      expect(row.resolved?.name).not.toBe(getCardDefinition(row.definitionKey)?.name);
    }

    const state = createBattleState({
      id: "kit-combat",
      seed: 5,
      type: "PVE",
      sideA: {
        id: "a",
        displayName: "A",
        creatures: [{ blueprint: sealed, bases, creatureId: "spark-1" }],
      },
      sideB: {
        id: "b",
        displayName: "B",
        creatures: [{ blueprint: generateCreatureBlueprint({ seed: 2, speciesKey: "florune", origin: "WILD" }), bases }],
      },
    });
    const playable = state.sides[0].hand.find((row) => row.resolved && row.resolved.cost <= state.sides[0].energy);
    expect(playable?.resolved).toBeTruthy();
    if (!playable) {
      return;
    }
    const after = reduceBattle(state, { type: "PLAY_CARD", cardInstanceId: playable.instanceId });
    expect(after.log.some((row) => row.type === "REJECT")).toBe(false);
    expect(after.sides[0].energy).toBe(state.sides[0].energy - playable.resolved!.cost);
  });
});
