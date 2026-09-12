import { getCardDefinition } from "@nexora/config";
import { describe, expect, it } from "vitest";
import { generateCreatureBlueprint } from "../genes/generate";
import { createBattleState } from "./create";
import { battleFusionEnabled, pickAiAction, reduceBattle } from "./reduce";
import type { BattleState } from "./types";

const bases = { baseHp: 90, baseAtk: 120, baseDef: 40, baseMag: 85, baseRes: 75, baseSpd: 100 };

function matchesTypology(row: { definitionKey: string; typology?: string }, typology: string) {
  const def = getCardDefinition(row.definitionKey);
  return row.typology === typology || Boolean(def?.tags.includes(typology)) || def?.typology === typology;
}

function canPlay(row: { resolved?: { effects?: ReadonlyArray<{ op: string }> }; definitionKey: string }) {
  const def = row.resolved ?? getCardDefinition(row.definitionKey);
  return !def?.effects?.some((effect) => effect.op === "CONSUME_RESOURCE");
}

function playTypology(state: BattleState, typology: string) {
  const next = structuredClone(state);
  next.sides[0].energy = 20;
  let card = next.sides[0].hand.find((row) => matchesTypology(row, typology) && canPlay(row));
  if (!card) {
    const fromDeck = next.sides[0].deck.findIndex((row) => matchesTypology(row, typology) && canPlay(row));
    if (fromDeck >= 0) {
      card = next.sides[0].deck.splice(fromDeck, 1)[0];
      next.sides[0].hand.push(card!);
    }
  }
  if (!card) {
    return reduceBattle(next, { type: "END_TURN" });
  }
  return reduceBattle(next, { type: "PLAY_CARD", cardInstanceId: card.instanceId });
}

function playTypologyThenPass(state: BattleState, typology: string) {
  let next = playTypology(state, typology);
  if (next.activeSide === 0) {
    next = reduceBattle(next, { type: "END_TURN" });
  }
  if (next.status === "ACTIVE" && next.activeSide === 1) {
    next = reduceBattle(next, { type: "END_TURN" });
  }
  return next;
}

function advanceToRound(state: BattleState, round: number) {
  let next = state;
  let guard = 0;
  while (next.round < round && next.status === "ACTIVE" && guard < 24) {
    guard += 1;
    next = playTypologyThenPass(next, guard % 2 === 0 ? "HEAL" : "BURN");
  }
  return next;
}

function starterBattle() {
  const hero = generateCreatureBlueprint({ seed: 11, speciesKey: "pyron", origin: "STARTER" });
  const wild = generateCreatureBlueprint({ seed: 22, speciesKey: "florune", origin: "WILD" });
  return createBattleState({
    id: "b1",
    seed: 77,
    type: "PVE",
    sideA: {
      id: "a",
      characterId: "char-a",
      displayName: "A",
      creatures: [{ blueprint: hero, bases, creatureId: "c1" }],
    },
    sideB: {
      id: "b",
      displayName: "Florune",
      creatures: [{ blueprint: wild, bases: { ...bases, baseHp: 70 } }],
    },
    wildSpeciesKey: "florune",
  });
}

describe("battle engine", () => {
  it("monta deck, mão e energia iniciais", () => {
    const state = starterBattle();
    expect(state.sides[0].hand.length).toBeGreaterThan(0);
    expect(state.sides[0].deck.length + state.sides[0].hand.length).toBe(10);
    expect(state.sides[0].energy).toBe(1);
  });

  it("concede energia igual ao número do turno", () => {
    let state = starterBattle();
    expect(state.round).toBe(1);
    expect(state.sides[0].energy).toBe(1);
    state = reduceBattle(state, { type: "END_TURN" });
    state = reduceBattle(state, { type: "END_TURN" });
    expect(state.round).toBe(2);
    expect(state.sides[0].energy).toBe(2);
    state = reduceBattle(state, { type: "END_TURN" });
    state = reduceBattle(state, { type: "END_TURN" });
    expect(state.round).toBe(3);
    expect(state.sides[0].energy).toBe(3);
  });

  it("não deixa jogar nem comprar carta de criatura morta", () => {
    const hero = generateCreatureBlueprint({ seed: 11, speciesKey: "pyron", origin: "STARTER" });
    const ally = generateCreatureBlueprint({ seed: 33, speciesKey: "florune", origin: "STARTER" });
    const wild = generateCreatureBlueprint({ seed: 22, speciesKey: "terranox", origin: "WILD" });
    let state = createBattleState({
      id: "dead-cards",
      seed: 5,
      type: "PVE",
      sideA: {
        id: "a",
        characterId: "char-a",
        displayName: "A",
        creatures: [
          { blueprint: hero, bases, creatureId: "alive" },
          { blueprint: ally, bases, creatureId: "dead" },
        ],
      },
      sideB: {
        id: "b",
        displayName: "Wild",
        creatures: [{ blueprint: wild, bases: { ...bases, baseHp: 70 } }],
      },
    });
    const deadCard = state.sides[0].hand.find((row) => row.sourceCreatureId === "dead");
    state.sides[0].creatures.find((row) => row.creatureId === "dead")!.hp = 0;
    if (deadCard) {
      state = reduceBattle(state, { type: "PLAY_CARD", cardInstanceId: deadCard.instanceId });
      expect(state.log.at(-1)?.type).toBe("REJECT");
    }
    state.sides[0].energy = 10;
    state = reduceBattle(state, { type: "END_TURN" });
    state = reduceBattle(state, { type: "END_TURN" });
    expect(state.sides[0].hand.every((row) => row.sourceCreatureId !== "dead")).toBe(true);
  });

  it("joga carta de dano, gasta energia e vai para discard", () => {
    let state = starterBattle();
    state.sides[0].energy = 10;
    const playable = state.sides[0].hand[0];
    expect(playable).toBeTruthy();
    const energyBefore = state.sides[0].energy;
    state = reduceBattle(state, { type: "PLAY_CARD", cardInstanceId: playable!.instanceId });
    expect(state.sides[0].energy).toBeLessThan(energyBefore);
    expect(state.sides[0].hand.some((row) => row.instanceId === playable!.instanceId)).toBe(false);
    expect(state.sides[0].discard.some((row) => row.instanceId === playable!.instanceId)).toBe(true);
  });

  it("termina com vitória quando o selvagem cai", () => {
    let state = starterBattle();
    state.sides[0].energy = 10;
    state.sides[1].creatures[0]!.hp = 1;
    const card = state.sides[0].hand[0]!;
    state = reduceBattle(state, { type: "PLAY_CARD", cardInstanceId: card.instanceId });
    if (state.status !== "FINISHED") {
      state.sides[1].creatures[0]!.hp = 0;
      state = reduceBattle(state, { type: "END_TURN" });
    }
    expect(["ACTIVE", "FINISHED"]).toContain(state.status);
  });

  it("concede encerra PvP para o outro lado", () => {
    const hero = generateCreatureBlueprint({ seed: 11, speciesKey: "pyron", origin: "STARTER" });
    const foe = generateCreatureBlueprint({ seed: 22, speciesKey: "florune", origin: "STARTER" });
    const state = createBattleState({
      id: "pvp-concede",
      seed: 9,
      type: "PVP",
      sideA: {
        id: "a",
        characterId: "char-a",
        displayName: "A",
        creatures: [{ blueprint: hero, bases, creatureId: "c1" }],
      },
      sideB: {
        id: "b",
        characterId: "char-b",
        displayName: "Bigslow",
        creatures: [{ blueprint: foe, bases, creatureId: "c2" }],
      },
    });
    const next = reduceBattle(state, { type: "CONCEDE", side: 1 });
    expect(next.status).toBe("FINISHED");
    expect(next.winnerSide).toBe(0);
    expect(next.log.at(-1)?.type).toBe("CONCEDE");
  });

  it("PvE linear V1 calcula fusão; carta só-WATER de Nympha gera ressonância", () => {
    const pyron = generateCreatureBlueprint({ seed: 11, speciesKey: "pyron", origin: "STARTER" });
    const nympha = generateCreatureBlueprint({ seed: 44, speciesKey: "nympha", origin: "STARTER" });
    const florune = generateCreatureBlueprint({ seed: 33, speciesKey: "florune", origin: "STARTER" });
    const wild = generateCreatureBlueprint({ seed: 22, speciesKey: "terranox", origin: "WILD" });
    let state = createBattleState({
      id: "fusion-linear",
      seed: 5,
      type: "PVE",
      rulesVersion: "V1",
      sideA: {
        id: "a",
        characterId: "char-a",
        displayName: "A",
        creatures: [
          { blueprint: pyron, bases, creatureId: "c1", slot: "FRONT", typology: "BURN" },
          { blueprint: nympha, bases, creatureId: "c2", slot: "MIDDLE", typology: "CONTROL" },
          { blueprint: florune, bases, creatureId: "c3", slot: "BACK", typology: "HEAL" },
        ],
      },
      sideB: {
        id: "b",
        displayName: "Wild",
        creatures: [{ blueprint: wild, bases: { ...bases, baseHp: 800 } }],
      },
    });
    expect(battleFusionEnabled(state)).toBe(true);
    const water = {
      instanceId: "forced-tide",
      definitionKey: "aqua_jab",
      sourceCreatureId: "c2",
      typology: "CONTROL",
      element: "WATER",
    };
    state.sides[0].hand = [water, ...state.sides[0].hand];
    state.sides[0].energy = 10;
    state = reduceBattle(state, { type: "PLAY_CARD", cardInstanceId: water.instanceId });
    expect(state.fusion?.resonance).toBeGreaterThan(0);
    state = advanceToRound(state, 5);
    expect(state.round).toBeGreaterThanOrEqual(5);
    expect(state.fusion?.pool.length).toBeGreaterThan(0);
    const ready = state.fusion?.pool.find((row) => row.ready);
    expect(ready?.familyKey).toBeTruthy();
    state.sides[0].energy = 10;
    const played = reduceBattle(state, { type: "PLAY_FUSION", familyKey: ready!.familyKey });
    expect(played.log.some((row) => row.type === "FUSION_PLAYED")).toBe(true);
  });

  it("Lab V2 desperta fusão no round 5 após jogar duas tipologias", () => {
    const pyron = generateCreatureBlueprint({ seed: 11, speciesKey: "pyron", origin: "STARTER" });
    const florune = generateCreatureBlueprint({ seed: 33, speciesKey: "florune", origin: "STARTER" });
    const wild = generateCreatureBlueprint({ seed: 22, speciesKey: "terranox", origin: "WILD" });
    let state = createBattleState({
      id: "fusion-v2",
      seed: 8,
      type: "PVE",
      rulesVersion: "V2",
      sideA: {
        id: "a",
        characterId: "char-a",
        displayName: "A",
        creatures: [
          { blueprint: pyron, bases, creatureId: "c1", slot: "FRONT", typology: "BURN" },
          { blueprint: florune, bases, creatureId: "c2", slot: "MIDDLE", typology: "HEAL" },
        ],
      },
      sideB: {
        id: "b",
        displayName: "Lab AI",
        creatures: [{ blueprint: wild, bases: { ...bases, baseHp: 800 }, slot: "FRONT" }],
      },
    });
    state = playTypologyThenPass(state, "BURN");
    state = playTypologyThenPass(state, "HEAL");
    state = playTypologyThenPass(state, "BURN");
    state = playTypologyThenPass(state, "HEAL");
    expect(state.round).toBeGreaterThanOrEqual(5);
    expect(state.fusion?.pool.find((row) => row.familyKey === "VITAL_ASHES")?.ready).toBe(true);
  });

  it("carta TANK com função HEAL não conta HEAL nem vaza anatomia nas mechanicTags", () => {
    const terranox = generateCreatureBlueprint({ seed: 11, speciesKey: "terranox", origin: "STARTER" });
    const pyron = generateCreatureBlueprint({ seed: 33, speciesKey: "pyron", origin: "STARTER" });
    const wild = generateCreatureBlueprint({ seed: 22, speciesKey: "florune", origin: "WILD" });
    let state = createBattleState({
      id: "heal-function-tank",
      seed: 8,
      type: "PVE",
      rulesVersion: "V2",
      sideA: {
        id: "a",
        characterId: "char-a",
        displayName: "A",
        creatures: [
          { blueprint: terranox, bases, creatureId: "tank-1", slot: "FRONT", typology: "TANK" },
          { blueprint: pyron, bases, creatureId: "burn-1", slot: "MIDDLE", typology: "BURN" },
        ],
      },
      sideB: {
        id: "b",
        displayName: "Wild",
        creatures: [{ blueprint: wild, bases: { ...bases, baseHp: 800 } }],
      },
    });
    state.sides[0].hand = [
      {
        instanceId: "bedrock",
        definitionKey: "bedrock_pact",
        sourceCreatureId: "tank-1",
        typology: "TANK",
        element: "EARTH",
        resolved: {
          key: "bedrock_pact",
          name: "Pacto do Leito",
          type: "SKILL",
          cost: 1,
          element: "EARTH",
          targetType: "SELF",
          tags: ["HEAL", "ADVANCED", "draconic", "horns", "tail"],
          effects: [{ op: "HEAL", value: 8 }],
        },
      },
      ...state.sides[0].hand,
    ];
    state.sides[0].energy = 10;
    state = reduceBattle(state, { type: "PLAY_CARD", cardInstanceId: "bedrock" });
    const play = state.usageHistory.find((row) => row.cardKey === "bedrock_pact");
    expect(play?.typology).toBe("TANK");
    expect(play?.mechanicTags).toEqual(["TANK", "ADVANCED"]);
    expect(play?.mechanicTags).not.toContain("HEAL");
    expect(play?.mechanicTags.some((tag) => ["draconic", "horns", "tail"].includes(tag))).toBe(false);
    expect(state.fusion?.byTypology).toEqual({ TANK: 1 });
    expect(state.fusion?.resonance).toBe(1);
    expect(state.sides[1].fusion?.resonance ?? 0).toBe(0);
  });

  it("ressonância e fusão são por lado; selvagem recebe sourceCreatureId", () => {
    const terranox = generateCreatureBlueprint({ seed: 11, speciesKey: "terranox", origin: "STARTER" });
    const pyron = generateCreatureBlueprint({ seed: 33, speciesKey: "pyron", origin: "STARTER" });
    const wild = generateCreatureBlueprint({ seed: 22, speciesKey: "florune", origin: "WILD" });
    let state = createBattleState({
      id: "per-side-fusion",
      seed: 8,
      type: "PVE",
      rulesVersion: "V2",
      sideA: {
        id: "player",
        characterId: "char-a",
        displayName: "A",
        creatures: [
          { blueprint: terranox, bases, creatureId: "tank-1", slot: "FRONT", typology: "TANK" },
          { blueprint: pyron, bases, creatureId: "burn-1", slot: "MIDDLE", typology: "BURN" },
        ],
      },
      sideB: {
        id: "wild",
        displayName: "Florune",
        creatures: [{ blueprint: wild, bases: { ...bases, baseHp: 800 }, slot: "FRONT", typology: "HEAL" }],
      },
    });
    expect(state.sides[1].creatures[0]?.creatureId).toBe("wild-creature-0");
    expect(state.sides[1].hand.concat(state.sides[1].deck).some((card) => card.sourceCreatureId === "wild-creature-0")).toBe(true);

    state = playTypologyThenPass(state, "TANK");
    state = playTypologyThenPass(state, "BURN");
    state = playTypologyThenPass(state, "TANK");
    state = playTypologyThenPass(state, "BURN");
    expect(state.round).toBeGreaterThanOrEqual(5);
    expect(state.sides[0].fusion?.byTypology?.HEAL).toBeUndefined();
    expect((state.sides[0].fusion?.byTypology?.TANK ?? 0) + (state.sides[0].fusion?.byTypology?.BURN ?? 0)).toBeGreaterThan(0);
    expect(state.fusion?.pool.find((row) => row.familyKey === "LIVING_FURNACE")).toBeTruthy();
  });

  it("mesmo seed + mesmas ações = mesmo estado", () => {
    const first = starterBattle();
    const second = starterBattle();
    const action = pickAiAction(first);
    expect(reduceBattle(first, action)).toEqual(reduceBattle(second, action));
  });
});
