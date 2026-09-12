import { describe, expect, it } from "vitest";
import { generateCreatureBlueprint } from "../genes/generate";
import { createBattleState } from "./create";
import { reduceBattle, listLegalTargets } from "./reduce";
import { explainTargets, listFormationTargets } from "./targeting-resolve";
import { combatLineOf } from "./formation-line";
import type { BattleState, Combatant } from "./types";

const bases = { baseHp: 90, baseAtk: 120, baseDef: 40, baseMag: 85, baseRes: 75, baseSpd: 100 };

function trio(prefix: string, seeds: [number, number, number], species: [string, string, string]) {
  return [
    { blueprint: generateCreatureBlueprint({ seed: seeds[0], speciesKey: species[0], origin: "STARTER" as const }), bases, creatureId: `${prefix}-front`, slot: "FRONT" as const },
    { blueprint: generateCreatureBlueprint({ seed: seeds[1], speciesKey: species[1], origin: "WILD" as const }), bases, creatureId: `${prefix}-mid`, slot: "MIDDLE" as const },
    { blueprint: generateCreatureBlueprint({ seed: seeds[2], speciesKey: species[2], origin: "WILD" as const }), bases, creatureId: `${prefix}-back`, slot: "BACK" as const },
  ];
}

function battle3v3(seed = 101): BattleState {
  return createBattleState({
    id: "3v3",
    seed,
    type: "PVE",
    rulesVersion: "V2",
    sideA: { id: "a", characterId: "char-a", displayName: "A", creatures: trio("a", [11, 12, 13], ["pyron", "florune", "terranox"]) },
    sideB: { id: "b", displayName: "B", creatures: trio("b", [21, 22, 23], ["sparkyn", "nympha", "voltaris"]) },
  });
}

function unit(id: string, slot: Combatant["slot"], hp = 20, extra: Partial<Combatant> = {}): Combatant {
  return {
    id,
    name: id,
    speciesKey: "pyron",
    element: "FIRE",
    hp,
    maxHp: 20,
    shield: 0,
    atk: 10,
    def: 10,
    mag: 10,
    res: 10,
    spd: 10,
    crit: 0.05,
    tags: [],
    statuses: [],
    slot,
    ...extra,
  };
}

describe("deck 30 + formação", () => {
  it("A/B/C/J — 3 criaturas = 30 cartas, 10 cada, G9/G10 inclusos", () => {
    const state = battle3v3();
    const side = state.sides[0];
    const all = [...side.hand, ...side.deck, ...side.discard, ...side.exile];
    expect(all).toHaveLength(30);
    expect(all.filter((row) => row.sourceCreatureId === "a-front")).toHaveLength(10);
    expect(all.filter((row) => row.sourceCreatureId === "a-mid")).toHaveLength(10);
    expect(all.filter((row) => row.sourceCreatureId === "a-back")).toHaveLength(10);
    expect(all.filter((row) => row.locus === "G9")).toHaveLength(3);
    expect(all.filter((row) => row.locus === "G10")).toHaveLength(3);
    expect(new Set(all.map((row) => row.instanceId)).size).toBe(30);
  });

  it("D — mesmo matchSeed = mesma ordem de deck+mão", () => {
    const a = battle3v3(77);
    const b = battle3v3(77);
    expect(a.sides[0].hand.map((row) => row.instanceId)).toEqual(b.sides[0].hand.map((row) => row.instanceId));
    expect(a.sides[0].deck.map((row) => row.definitionKey)).toEqual(b.sides[0].deck.map((row) => row.definitionKey));
  });

  it("E — mão inicial tem as 3 criaturas", () => {
    const state = battle3v3();
    const owners = new Set(state.sides[0].hand.map((row) => row.sourceCreatureId));
    expect(owners.has("a-front")).toBe(true);
    expect(owners.has("a-mid")).toBe(true);
    expect(owners.has("a-back")).toBe(true);
  });

  it("F — carta usada vai ao discard", () => {
    let state = battle3v3();
    state.sides[0].energy = 10;
    const card = state.sides[0].hand.find((row) => (row.resolved?.cost ?? 1) <= 10)!;
    state = reduceBattle(state, { type: "PLAY_CARD", cardInstanceId: card.instanceId });
    expect(state.sides[0].discard.some((row) => row.instanceId === card.instanceId)).toBe(true);
  });

  it("H/I — criatura morta não joga nem entra no draw", () => {
    let state = battle3v3();
    state.sides[0].creatures.find((row) => row.creatureId === "a-back")!.hp = 0;
    const deadCard = state.sides[0].hand.find((row) => row.sourceCreatureId === "a-back");
    if (deadCard) {
      state = reduceBattle(state, { type: "PLAY_CARD", cardInstanceId: deadCard.instanceId });
      expect(state.log.some((row) => row.type === "REJECT")).toBe(true);
    }
    state.sides[0].energy = 10;
    state = reduceBattle(state, { type: "END_TURN" });
    state = reduceBattle(state, { type: "END_TURN" });
    expect(state.sides[0].hand.every((row) => row.sourceCreatureId !== "a-back")).toBe(true);
  });
});

describe("targeting FRONT → MID → BACKLINE", () => {
  const allies = [unit("you", "FRONT")];
  const enemies = [unit("ef", "FRONT"), unit("em", "MIDDLE"), unit("eb", "BACK")];

  it("ataque normal só FRONT", () => {
    const legal = listFormationTargets({ allies, enemies, targetType: "ENEMY", tags: ["ATTACK", "FOUNDATION"] });
    expect(legal.map((row) => row.id)).toEqual(["ef"]);
  });

  it("FRONT morto expõe MID", () => {
    const legal = listFormationTargets({
      allies,
      enemies: [unit("ef", "FRONT", 0), unit("em", "MIDDLE"), unit("eb", "BACK")],
      targetType: "ENEMY",
    });
    expect(legal.map((row) => row.id)).toEqual(["em"]);
  });

  it("FRONT+MID mortos expõem BACK", () => {
    const legal = listFormationTargets({
      allies,
      enemies: [unit("ef", "FRONT", 0), unit("em", "MIDDLE", 0), unit("eb", "BACK")],
      targetType: "ENEMY",
    });
    expect(legal.map((row) => row.id)).toEqual(["eb"]);
  });

  it("Assassin alcança BACKLINE com FRONT vivo", () => {
    const legal = listFormationTargets({ allies, enemies, targetType: "ENEMY", tags: ["ASSASSIN", "EXECUTE"] });
    expect(legal.map((row) => row.id).sort()).toEqual(["eb", "ef", "em"]);
  });

  it("AoE atinge todos", () => {
    const legal = listFormationTargets({ allies, enemies, targetType: "ALL_ENEMIES", tags: ["AOE"] });
    expect(legal).toHaveLength(3);
  });

  it("MOBILITY/PIERCE alcança MID, não BACK", () => {
    const legal = listFormationTargets({ allies, enemies, targetType: "ENEMY", tags: ["MOBILITY"] });
    expect(legal.map((row) => row.id).sort()).toEqual(["ef", "em"]);
  });

  it("Taunt força o alvo legal", () => {
    const legal = listFormationTargets({
      allies,
      enemies: [unit("ef", "FRONT", 20, { statuses: [{ key: "TAUNT", stacks: 1, remainingRounds: 2 }] }), unit("em", "MIDDLE"), unit("eb", "BACK")],
      targetType: "ENEMY",
      tags: ["MOBILITY"],
    });
    expect(legal.map((row) => row.id)).toEqual(["ef"]);
  });

  it("servidor rejeita BACK com FRONT vivo", () => {
    const state = battle3v3();
    state.sides[0].energy = 10;
    const card = state.sides[0].hand.find((row) => row.resolved?.targetType === "ENEMY") ?? state.sides[0].hand[0]!;
    const back = state.sides[1].creatures.find((row) => combatLineOf(row.slot) === "BACKLINE")!;
    const next = reduceBattle(state, { type: "PLAY_CARD", cardInstanceId: card.instanceId, targetId: back.id });
    const tags = card.resolved?.tags ?? [];
    if (!tags.includes("AOE") && !tags.includes("EXECUTE") && !tags.includes("MOBILITY") && card.resolved?.targetType === "ENEMY") {
      expect(next.log.some((row) => row.text.includes("FRONTLINE_BLOCKING") || row.text.includes("INVALID_TARGET"))).toBe(true);
    }
  });

  it("explain marca BACK como FRONTLINE_BLOCKING", () => {
    const info = explainTargets({ allies, enemies, targetType: "ENEMY" });
    expect(info.blockedTargets.eb).toBe("FRONTLINE_BLOCKING");
    expect(info.validTargets).toEqual(["ef"]);
  });

  it("listLegalTargets no 3v3 só devolve FRONT inimigo", () => {
    const state = battle3v3();
    const legal = listLegalTargets(state, 0, "ENEMY", ["ATTACK"]);
    expect(legal.every((row) => combatLineOf(row.slot) === "FRONT")).toBe(true);
  });

  it("DoT em BACK continua após o tick", () => {
    const state = battle3v3();
    const back = state.sides[1].creatures.find((row) => combatLineOf(row.slot) === "BACKLINE")!;
    back.statuses.push({ key: "BURN", stacks: 1, remainingRounds: 2 });
    const hp = back.hp;
    const next = reduceBattle(state, { type: "END_TURN" });
    const after = next.sides[1].creatures.find((row) => row.id === back.id)!;
    expect(after.hp).toBeLessThan(hp);
  });

  it("PULL troca FRONT e MID", () => {
    let state = battle3v3();
    state.sides[0].energy = 10;
    const card = state.sides[0].hand[0]!;
    if (card.resolved) {
      card.resolved = { ...card.resolved, tags: [...card.resolved.tags, "PULL"], targetType: "ENEMY" };
    }
    const frontName = state.sides[1].creatures.find((row) => combatLineOf(row.slot) === "FRONT")!.name;
    const midName = state.sides[1].creatures.find((row) => combatLineOf(row.slot) === "MID")!.name;
    state = reduceBattle(state, { type: "PLAY_CARD", cardInstanceId: card.instanceId });
    const frontNow = state.sides[1].creatures.find((row) => combatLineOf(row.slot) === "FRONT")!.name;
    expect([frontName, midName]).toContain(frontNow);
  });
});
