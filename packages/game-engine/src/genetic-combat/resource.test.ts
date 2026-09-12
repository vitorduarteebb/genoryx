import { explainPersonalResource } from "@nexora/config";
import { describe, expect, it } from "vitest";
import { createBattleState } from "../battle/create";
import { reduceBattle } from "../battle/reduce";
import type { BattleState, Combatant } from "../battle/types";
import { generateCreatureBlueprint } from "../genes/generate";
import { applyResourceEvent, decayPersonalResources, spendPersonalResource } from "./resource-runtime";
import { buildPersonalResource, hydratePersonalResource, type ResourceVariant } from "./resource";

const bases = { baseHp: 90, baseAtk: 120, baseDef: 40, baseMag: 85, baseRes: 75, baseSpd: 100 };

function definition(variant: ResourceVariant) {
  const blueprint = generateCreatureBlueprint({ seed: 11, speciesKey: "pyron", origin: "STARTER" });
  const manifest = blueprint.combatManifest!;
  return buildPersonalResource({
    blueprint,
    expression: manifest.expression,
    rolls: manifest.rolls,
    birthSeed: manifest.birthSeed,
    verbs: ["BITE", "CHARGE"],
    archetype: variant === "PREDATORY_FURNACE" ? "PREDATOR" : "TANK",
    quirks: variant === "UNSTABLE_HEART" ? ["UNSTABLE_CORE"] : [],
    forceVariant: variant,
  });
}

function battleWith(variant: ResourceVariant): { state: BattleState; actor: Combatant; foe: Combatant } {
  const hero = generateCreatureBlueprint({ seed: 11, speciesKey: "pyron", origin: "STARTER" });
  const wild = generateCreatureBlueprint({ seed: 22, speciesKey: "florune", origin: "WILD" });
  const def = definition(variant);
  hero.combatManifest = {
    ...hero.combatManifest!,
    identity: { ...hero.combatManifest!.identity, resource: def },
  };
  const state = createBattleState({
    id: "res-test",
    seed: 77,
    type: "PVE",
    sideA: { id: "a", characterId: "char-a", displayName: "A", creatures: [{ blueprint: hero, bases, creatureId: "c1" }] },
    sideB: { id: "b", displayName: "Florune", creatures: [{ blueprint: wild, bases: { ...bases, baseHp: 80 } }] },
    wildSpeciesKey: "florune",
  });
  return { state, actor: state.sides[0].creatures[0]!, foe: state.sides[1].creatures[0]! };
}

describe("personal resource", () => {
  it("A — ganha Heat só quando a regra da criatura define", () => {
    const { state, actor, foe } = battleWith("MAGMA_CORE");
    applyResourceEvent(state, { trigger: "APPLY_STATUS", actor, target: foe, status: "BURN" });
    expect(actor.resources?.HEAT).toBe(1);
    applyResourceEvent(state, { trigger: "GAIN_SHIELD", actor, target: actor, shieldAmount: 12 });
    expect(actor.resources?.HEAT).toBe(2);
  });

  it("B — evento inválido não gera Heat", () => {
    const { state, actor, foe } = battleWith("MAGMA_CORE");
    applyResourceEvent(state, { trigger: "APPLY_STATUS", actor, target: foe, status: "POISON" });
    applyResourceEvent(state, { trigger: "CRITICAL_HIT", actor, target: foe, crit: true });
    expect(actor.resources?.HEAT ?? 0).toBe(0);
  });

  it("C — não ultrapassa maxStacks", () => {
    const { state, actor, foe } = battleWith("MAGMA_CORE");
    for (let i = 0; i < 6; i += 1) {
      applyResourceEvent(state, { trigger: "APPLY_STATUS", actor, target: foe, status: "BURN" });
    }
    expect(actor.resources?.HEAT).toBe(3);
  });

  it("D — consumo correto", () => {
    const { state, actor, foe } = battleWith("MAGMA_CORE");
    applyResourceEvent(state, { trigger: "APPLY_STATUS", actor, target: foe, status: "BURN" });
    applyResourceEvent(state, { trigger: "GAIN_SHIELD", actor, target: actor, shieldAmount: 10 });
    expect(spendPersonalResource(state, actor, "G9")).toBe(true);
    expect(actor.resources?.HEAT).toBe(1);
  });

  it("E — threshold registra quando cruzado", () => {
    const { state, actor, foe } = battleWith("MAGMA_CORE");
    applyResourceEvent(state, { trigger: "APPLY_STATUS", actor, target: foe, status: "BURN" });
    applyResourceEvent(state, { trigger: "GAIN_SHIELD", actor, target: actor, shieldAmount: 10 });
    expect(state.log.some((row) => row.type === "RESOURCE_THRESHOLD")).toBe(true);
  });

  it("F — decay remove 1 no fim do turno", () => {
    const { state, actor, foe } = battleWith("MOMENTUM_FLOW");
    applyResourceEvent(state, { trigger: "DEAL_DAMAGE", actor, target: foe });
    expect(actor.resources?.MOMENTUM).toBe(1);
    decayPersonalResources(state, state.sides[0], "END_OF_TURN");
    expect(actor.resources?.MOMENTUM).toBe(0);
  });

  it("G — tooltip nasce das regras reais", () => {
    const def = definition("MAGMA_CORE");
    const help = explainPersonalResource(def, "pt-BR");
    expect(help.generate.some((row) => row.label.toLowerCase().includes("queimadura"))).toBe(true);
    expect(help.generate.some((row) => row.label.toLowerCase().includes("escudo"))).toBe(true);
    expect(help.debug).toContain("APPLY_STATUS:BURN");
    expect(help.simple.toLowerCase()).not.toContain("trigger_gain");
  });

  it("H — duas criaturas HEAT explicam mecânicas diferentes", () => {
    const magma = explainPersonalResource(definition("MAGMA_CORE"), "pt-BR");
    const hunt = explainPersonalResource(definition("PREDATORY_FURNACE"), "pt-BR");
    expect(magma.title).toBe(hunt.title);
    expect(magma.generate.map((row) => row.label).join("|")).not.toBe(hunt.generate.map((row) => row.label).join("|"));
    expect(hunt.generate.some((row) => row.label.toLowerCase().includes("crítico"))).toBe(true);
    expect(magma.generate.some((row) => row.label.toLowerCase().includes("crítico"))).toBe(false);
  });

  it("I — hydrate duas vezes não muda a definição", () => {
    const raw = definition("UNSTABLE_HEART");
    const a = hydratePersonalResource(raw);
    const b = hydratePersonalResource(a);
    expect(b).toEqual(a);
    const legacy = hydratePersonalResource({
      id: "HEAT",
      displayName: "Calor",
      maxStacks: 3,
      generateTriggers: ["APPLY_BURN", "GAIN_SHIELD"],
      consumeTriggers: ["SIGNATURE", "SUPREME"],
    });
    expect(hydratePersonalResource(legacy)).toEqual(legacy);
    expect(legacy?.generationRules).toHaveLength(2);
  });

  it("J/K — servidor recusa carta que exige recurso", () => {
    const { state } = battleWith("MAGMA_CORE");
    const side = state.sides[0];
    side.energy = 10;
    const card =
      side.hand.find((row) => row.locus === "G10") ??
      side.deck.find((row) => row.locus === "G10");
    if (card && !side.hand.includes(card)) {
      side.hand.push(card);
    }
    if (!card) {
      expect(side.creatures[0]?.resources?.HEAT ?? 0).toBe(0);
      return;
    }
    const next = reduceBattle(state, { type: "PLAY_CARD", cardInstanceId: card.instanceId });
    expect(next.log.some((row) => row.type === "REJECT" && row.text.includes("recurso"))).toBe(true);
    expect(next.sides[0].creatures[0]?.resources?.HEAT ?? 0).toBe(0);
  });

  it("L — combate começa em current/max corretos", () => {
    const { actor } = battleWith("MAGMA_CORE");
    expect(actor.resources?.HEAT).toBe(0);
    expect(actor.resourceCap?.HEAT).toBe(3);
    expect(`${actor.resources?.HEAT}/${actor.resourceCap?.HEAT}`).toBe("0/3");
  });

  it("entrega 5 identidades distintas e 2 HEAT diferentes", () => {
    const variants: ResourceVariant[] = ["MAGMA_CORE", "PREDATORY_FURNACE", "UNSTABLE_HEART", "RAGE_BLOOD", "SPORE_COLONY"];
    const rows = variants.map((variant) => {
      const def = definition(variant);
      return { variant, type: def.resourceType, help: explainPersonalResource(def, "pt-BR") };
    });
    expect(new Set(rows.map((row) => row.variant)).size).toBe(5);
    expect(rows.filter((row) => row.type === "HEAT")).toHaveLength(3);
    expect(new Set(rows.filter((row) => row.type === "HEAT").map((row) => row.help.simple)).size).toBe(3);
    expect(rows.some((row) => row.type === "RAGE")).toBe(true);
    expect(rows.some((row) => row.type === "SPORE")).toBe(true);
  });
});
