import { describe, expect, it } from "vitest";
import { assembleCreatureCardKit } from "./kit";
import { generateCreatureBlueprint } from "../genes/generate";
import {
  auditSealedCard,
  kitRoleCoverage,
  refineSealedCard,
  refineSealedKit,
  summarizeContentPass,
  type SealedCardInput,
} from "./content-pass";
import { buildShowcaseTrio, compositionChecklist } from "./content-pass-showcase";
import { isCardKitManifest, kitCardsToDefinitions } from "./kit";

const SAMPLE_KIT: SealedCardInput[] = [
  {
    key: "labareda",
    name: "Labareda Incandescente",
    locus: "G3",
    cost: 1,
    element: "FIRE",
    function: "ATTACK",
    effects: [
      { op: "DAMAGE", value: 11 },
      { op: "APPLY_STATUS", status: "BURN", duration: 3 },
    ],
  },
  {
    key: "pulso",
    name: "Pulso Ardente",
    locus: "G5",
    cost: 1,
    element: "FIRE",
    function: "BUFF",
    effects: [
      { op: "CONSUME_RESOURCE", value: 2, resource: "HEAT", condition: { resourceAtLeast: 1 } },
      { op: "GAIN_ENERGY", value: 1 },
    ],
  },
  {
    key: "veu",
    name: "Véu Ardente",
    locus: "G4",
    cost: 1,
    element: "FIRE",
    function: "SHIELD",
    effects: [{ op: "SHIELD", value: 18 }],
  },
  {
    key: "guarda",
    name: "Guarda Ardente",
    locus: "G8",
    cost: 1,
    element: "FIRE",
    function: "SHIELD",
    effects: [{ op: "SHIELD", value: 19 }],
  },
  {
    key: "descarga",
    name: "Descarga Elétrica",
    locus: "G5",
    cost: 1,
    element: "ELECTRIC",
    function: "BUFF",
    effects: [{ op: "GAIN_ENERGY", value: 1 }],
  },
  {
    key: "retorno",
    name: "Retorno Ígneo",
    locus: "G7",
    cost: 1,
    element: "FIRE",
    function: "COUNTER",
    type: "REACTION",
    effects: [
      { op: "DAMAGE", value: 9, condition: { targetHas: "BURN" } },
      { op: "SHIELD", value: 10, condition: { targetHas: "BURN" } },
    ],
  },
  {
    key: "prisao",
    name: "Prisão Ardente",
    locus: "G6",
    cost: 2,
    element: "FIRE",
    function: "CONTROL",
    effects: [
      { op: "APPLY_STATUS", status: "BURN", duration: 2 },
      { op: "DAMAGE", value: 8 },
    ],
  },
  {
    key: "marca",
    name: "Marca Incandescente",
    locus: "G2",
    cost: 1,
    element: "FIRE",
    function: "DEBUFF",
    effects: [
      { op: "APPLY_STATUS", status: "BURN", duration: 2 },
      { op: "DAMAGE", value: 6 },
    ],
  },
  {
    key: "mordida",
    name: "Mordida Ardente",
    locus: "G1",
    cost: 2,
    element: "FIRE",
    function: "ATTACK",
    effects: [
      { op: "DAMAGE", value: 14 },
      { op: "APPLY_STATUS", status: "BURN", duration: 2 },
    ],
  },
];

describe("content-pass v2", () => {
  it("conciliates Descarga Elétrica with a real discharge", () => {
    const refined = refineSealedCard(SAMPLE_KIT.find((row) => row.key === "descarga")!);
    expect(refined.effects.some((row) => row.op === "DAMAGE")).toBe(true);
    expect(refined.effects.some((row) => row.op === "GAIN_ENERGY")).toBe(true);
    expect(refined.domain).toBe("MAGIC");
    expect(refined.speed).toBe("FAST");
  });

  it("makes Mordida physical and keeps Burn", () => {
    const refined = refineSealedCard(SAMPLE_KIT.find((row) => row.key === "mordida")!);
    expect(refined.domain).toBe("PHYSICAL");
    expect(refined.effects.some((row) => row.status === "BURN")).toBe(true);
  });

  it("aligns Pulso resource require to consume", () => {
    const before = auditSealedCard(SAMPLE_KIT.find((row) => row.key === "pulso")!);
    expect(before.problems).toContain("require≠consume");
    const refined = refineSealedCard(SAMPLE_KIT.find((row) => row.key === "pulso")!);
    const consume = refined.effects.find((row) => row.op === "CONSUME_RESOURCE")!;
    expect(consume.condition?.resourceAtLeast).toBe(consume.value);
    expect(refined.speed).toBe("FAST");
  });

  it("differentiates near-duplicate shields by function", () => {
    const refined = refineSealedKit(SAMPLE_KIT);
    const veu = refined[SAMPLE_KIT.findIndex((row) => row.key === "veu")]!;
    const guarda = refined[SAMPLE_KIT.findIndex((row) => row.key === "guarda")]!;
    expect(guarda.effects.some((row) => row.condition?.selfPosition === "FRONT")).toBe(true);
    expect(veu.effects.some((row) => row.op === "REMOVE_STATUS")).toBe(true);
    expect(veu.speed).toBe("FAST");
    expect(guarda.roles).toContain("POSITIONING");
  });

  it("turns Marca into Mark setup and Prisão into Heavy control", () => {
    const kit = refineSealedKit(SAMPLE_KIT);
    const marca = kit[SAMPLE_KIT.findIndex((row) => row.key === "marca")]!;
    const prisao = kit[SAMPLE_KIT.findIndex((row) => row.key === "prisao")]!;
    expect(marca.effects.some((row) => row.status === "MARKED")).toBe(true);
    expect(prisao.speed).toBe("HEAVY");
    expect(prisao.roles).toContain("CONTROL");
  });

  it("keeps Retorno as reaction with explicit status payoff", () => {
    const refined = refineSealedCard(SAMPLE_KIT.find((row) => row.key === "retorno")!);
    expect(refined.speed).toBe("VERY_FAST");
    expect(refined.roles).toContain("REACTION");
    expect(refined.effects.some((row) => row.op === "SHIELD" && !row.condition)).toBe(true);
    expect(refined.effects.some((row) => row.op === "DAMAGE" && row.condition?.targetHas === "BURN")).toBe(true);
  });

  it("applies anatomy and gene lean without rewriting sealed names", () => {
    const refined = refineSealedCard({
      key: "asa",
      name: "Rajada Alada",
      locus: "G2",
      cost: 1,
      element: "ELECTRIC",
      function: "MOBILITY",
      effects: [{ op: "DAMAGE", value: 9 }],
      anatomy: ["wings", "agile"],
      genes: { SPD: "A", PRECISION: "A", ATK: "B" },
      verbs: ["FLIGHT"],
    });
    expect(refined.tags).toContain("FLIGHT");
    expect(refined.speed).toBe("FAST");
    expect(refined.effects.some((row) => row.op === "GAIN_MOMENTUM" || row.status === "MARKED")).toBe(true);
  });

  it("is deterministic", () => {
    const a = refineSealedKit(SAMPLE_KIT);
    const b = refineSealedKit(SAMPLE_KIT);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("audits full sealed population", () => {
    let audited = 0;
    let changed = 0;
    const problemBuckets = new Map<string, number>();
    for (let i = 0; i < 120; i += 1) {
      const species = (["pyron", "sparkyn", "terranox", "florune", "voltaris", "nympha"] as const)[i % 6]!;
      const blueprint = generateCreatureBlueprint({ seed: 31_000 + i * 13, speciesKey: species, origin: i % 4 === 0 ? "STARTER" : "WILD" });
      const kit = assembleCreatureCardKit({ creatureId: `full-${i}`, blueprint });
      const inputs: SealedCardInput[] = kit.cards.map((card) => ({
        key: card.cardFamily,
        name: card.namePt,
        locus: card.locus,
        cost: card.cost,
        element: card.element,
        function: card.function,
        tier: card.tier,
        targetType: card.targetType,
        effects: card.effects,
        genes: blueprint.genes,
        anatomy: card.modifierGenes,
        quirks: kit.combat?.identity.quirks.map((row) => row.key) ?? [],
        verbs: kit.combat?.identity.verbs ?? [],
      }));
      const summary = summarizeContentPass(inputs);
      audited += summary.audited;
      changed += summary.changed;
      for (const problem of summary.problemsBefore) {
        const key = problem.split(": ").slice(1).join(": ") || problem;
        problemBuckets.set(key, (problemBuckets.get(key) ?? 0) + 1);
      }
      const refined = refineSealedKit(inputs);
      const coverage = kitRoleCoverage(refined);
      expect(coverage.hasPressure || coverage.hasDefense).toBe(true);
      expect(refined.every((row) => row.effects.filter((effect) => effect.op !== "CONSUME_RESOURCE").length <= 3)).toBe(true);
    }
    expect(audited).toBe(1200);
    expect(changed).toBeGreaterThan(400);
    expect(problemBuckets.size).toBeGreaterThan(0);
  });

  it("Kyrum / Brynix / Doron compositions create strategies", () => {
    const trio = buildShowcaseTrio();
    for (const row of [trio.Kyrum, trio.Brynix, trio.Doron]) {
      expect(row.kit.cards).toHaveLength(10);
      expect(row.refined).toHaveLength(10);
      expect(row.kit.cards.map((card) => card.namePt)).toEqual(row.refined.map((card) => card.name));
    }
    expect(trio.Kyrum.blueprint.genes.ATK).toBe("S");
    expect(trio.Brynix.blueprint.genes.MAG).toBe("A");
    expect(trio.Brynix.blueprint.genes.ATK).toBe("E");
    expect(trio.Doron.blueprint.genes.DEF).toBe("S");

    const checklist = compositionChecklist(trio);
    expect(checklist.frontline).toBe(true);
    expect(checklist.setup).toBe(true);
    expect(checklist.pressure).toBe(true);
    expect(checklist.finisher).toBe(true);
    expect(checklist.reaction).toBe(true);
    expect(checklist.allyCombo).toBe(true);
    expect(checklist.adversaryAnswer).toBe(true);
    expect(checklist.timing).toBe(true);
    expect(checklist.targeting).toBe(true);
    expect(checklist.resource).toBe(true);
    expect(checklist.synergyCards).toBeGreaterThan(2);
    expect(checklist.counterCards).toBeGreaterThan(0);
  });

  it("sealed genesis loci refine without renaming", () => {
    const blueprint = generateCreatureBlueprint({ seed: 55_001, speciesKey: "pyron", origin: "STARTER" });
    const cards = blueprint.loci.map((locus) => locus.expressed).filter(isCardKitManifest);
    const names = cards.map((card) => card.namePt);
    const refined = kitCardsToDefinitions(cards, { genes: blueprint.genes });
    expect(refined.map((row) => row.name)).toEqual(names);
  });
});
