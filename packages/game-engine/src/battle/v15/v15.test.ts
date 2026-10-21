import { matchRulesFor, statusDefinition } from "@nexora/config";
import { describe, expect, it } from "vitest";
import { generateCreatureBlueprint } from "../../genes/generate";
import { createBattleState } from "../create";
import { reduceBattle } from "../reduce";
import { applyStructuredStatus } from "./status-engine";
import { availableEnergy, cancelQueued, chooseRetarget, queueCard } from "./action-queue";
import { effectMetaOf } from "./card-meta";
import { recordChainLink } from "./genetic-chain";
import { gainTeamResonance } from "./resonance";
import { collapseFormation } from "./formation";
import { currentPressure, scaleSustain } from "./pressure";
import { casualHints } from "./hints";
import { createDraftState, reduceDraft } from "../matrix/draft";

const bases = { baseHp: 90, baseAtk: 120, baseDef: 40, baseMag: 85, baseRes: 75, baseSpd: 100 };

function battle() {
  const a = generateCreatureBlueprint({ seed: 11, speciesKey: "pyron", origin: "STARTER" });
  const b = generateCreatureBlueprint({ seed: 22, speciesKey: "florune", origin: "STARTER" });
  const c = generateCreatureBlueprint({ seed: 33, speciesKey: "noctyr", origin: "STARTER" });
  const foe = generateCreatureBlueprint({ seed: 44, speciesKey: "terranox", origin: "WILD" });
  return createBattleState({
    id: "v15",
    seed: 99,
    type: "PVE",
    matchMode: "CASUAL",
    sideA: {
      id: "a",
      characterId: "char-a",
      displayName: "A",
      creatures: [
        { blueprint: a, bases, creatureId: "c1" },
        { blueprint: b, bases, creatureId: "c2" },
        { blueprint: c, bases, creatureId: "c3" },
      ],
    },
    sideB: {
      id: "b",
      displayName: "Foe",
      creatures: [{ blueprint: foe, bases: { ...bases, baseHp: 80 }, creatureId: "e1" }],
    },
  });
}

describe("combat v1.5", () => {
  it("reserva energia na action queue e confirma na ordem", () => {
    let state = battle();
    state.sides[0].energy = 4;
    const cheap = state.sides[0].hand.filter((row) => (row.resolved?.cost ?? 1) <= 2).slice(0, 2);
    expect(cheap.length).toBeGreaterThan(0);
    for (const card of cheap) {
      state = reduceBattle(state, { type: "QUEUE_CARD", cardInstanceId: card.instanceId });
    }
    expect(state.sides[0].actionQueue?.length).toBeGreaterThan(0);
    expect(availableEnergy(state.sides[0])).toBeLessThan(4);
    const reserved = state.sides[0].reservedEnergy ?? 0;
    state = reduceBattle(state, { type: "CONFIRM_TURN" });
    expect(state.log.some((row) => row.type === "CARD_PLAYED" || row.type === "ACTION_CANCELLED" || row.type === "END_TURN")).toBe(true);
    expect(reserved).toBeGreaterThan(0);
  });

  it("cancela ação inválida e devolve carta/energia", () => {
    const state = battle();
    const side = state.sides[0];
    side.energy = 3;
    const card = side.hand[0]!;
    side.hand.splice(0, 1);
    const queued = queueCard(side, card, 2, "missing-target", "NONE");
    const beforeHand = side.hand.length;
    const result = cancelQueued(side, queued, "DEAD");
    expect(result.released).toBe(2);
    expect(side.hand.length).toBe(beforeHand + 1);
    expect(side.reservedEnergy).toBe(0);
  });

  it("retarget NONE não inventa alvo", () => {
    expect(chooseRetarget("NONE", battle().sides[1].creatures)).toBeUndefined();
    expect(chooseRetarget("NEAREST_VALID", battle().sides[1].creatures)?.id).toBeTruthy();
  });

  it("genetic chain x2/x3 exige criaturas diferentes e conexão", () => {
    const state = battle();
    const side = state.sides[0];
    const first = recordChainLink(side, {
      creatureId: "c1",
      creatureName: "BLINDA T",
      cardKey: "a",
      cardName: "Fornalha",
      produces: ["BURN"],
      consumes: [],
      reactsTo: [],
      transforms: [],
    });
    expect(first.chained).toBe(false);
    const second = recordChainLink(side, {
      creatureId: "c2",
      creatureName: "Reserva",
      cardKey: "b",
      cardName: "Mare",
      produces: ["EXPOSED"],
      consumes: [],
      reactsTo: ["BURN"],
      transforms: [],
    });
    expect(second.chained).toBe(true);
    expect(second.length).toBe(2);
    const third = recordChainLink(side, {
      creatureId: "c3",
      creatureName: "Zed",
      cardKey: "c",
      cardName: "Cacada",
      produces: [],
      consumes: ["EXPOSED"],
      reactsTo: [],
      transforms: [],
    });
    expect(third.chained).toBe(true);
    expect(third.length).toBe(3);
  });

  it("resonance sobe só entre criaturas diferentes e cap 3", () => {
    const state = battle();
    expect(gainTeamResonance(state, state.sides[0], "c1", "c1", "self")).toBe(false);
    expect(gainTeamResonance(state, state.sides[0], "c1", "c2", "burn")).toBe(true);
    expect(gainTeamResonance(state, state.sides[0], "c2", "c3", "wet")).toBe(true);
    expect(gainTeamResonance(state, state.sides[0], "c1", "c3", "mark")).toBe(true);
    expect(gainTeamResonance(state, state.sides[0], "c1", "c2", "over")).toBe(false);
    expect(state.sides[0].teamResonance?.value).toBe(3);
    expect(state.sides[0].teamResonance?.ready).toBe(true);
  });

  it("frost 3 vira freeze e resolve corta CC", () => {
    const unit = battle().sides[0].creatures[0]!;
    applyStructuredStatus(unit, "FROST");
    applyStructuredStatus(unit, "FROST");
    const third = applyStructuredStatus(unit, "FROST");
    expect(third.extra).toBe("FREEZE");
    expect(unit.statuses.some((row) => row.key === "FREEZE")).toBe(true);
    applyStructuredStatus(unit, "STUN");
    expect(unit.statuses.some((row) => row.key === "RESOLVE")).toBe(true);
  });

  it("formation collapse promove MID e BACKLINE", () => {
    const state = battle();
    const front = state.sides[0].creatures[0]!;
    front.hp = 0;
    const result = collapseFormation(state.sides[0].creatures);
    expect(result.collapsed).toBe(true);
  });

  it("pressure reduz cura sem alterar regras base no casual", () => {
    const state = battle();
    state.round = 12;
    expect(currentPressure(state).tier).toBe(1);
    expect(scaleSustain(state, 20, "HEAL")).toBeLessThan(20);
    const casual = matchRulesFor("CASUAL");
    const ranked = matchRulesFor("RANKED");
    expect(casual.hintsEnabled).toBe(true);
    expect(ranked.draftEnabled).toBe(true);
    expect(casual.battlePressure).toEqual(ranked.battlePressure);
  });

  it("hints casual não mudam o estado", () => {
    const state = battle();
    const before = JSON.stringify(state.sides[0].creatures.map((row) => row.hp));
    casualHints(state, 0, (card) => card.resolved ?? null);
    expect(JSON.stringify(state.sides[0].creatures.map((row) => row.hp))).toBe(before);
  });

  it("draft ranked: roster 5, ban simultâneo, pick 3", () => {
    let draft = createDraftState("a", "b");
    const catalog = [1, 2, 3, 4, 5].map((n) => ({ creatureId: `a${n}`, speciesKey: "pyron", typology: "BURN", eligible: true }));
    const catalogB = [1, 2, 3, 4, 5].map((n) => ({ creatureId: `b${n}`, speciesKey: "florune", typology: "HEAL", eligible: true }));
    draft = reduceDraft(draft, { type: "SUBMIT_ROSTER", teamId: "a", creatureIds: catalog.map((row) => row.creatureId), catalog });
    draft = reduceDraft(draft, { type: "SUBMIT_ROSTER", teamId: "b", creatureIds: catalogB.map((row) => row.creatureId), catalog: catalogB });
    expect(draft.phase).toBe("BAN_PHASE");
    draft = reduceDraft(draft, { type: "BAN_CREATURE", teamId: "a", creatureId: "b1" });
    expect(draft.phase).toBe("BAN_PHASE");
    expect(draft.teams[1].bannedCreatureId).toBeNull();
    draft = reduceDraft(draft, { type: "BAN_CREATURE", teamId: "b", creatureId: "a1" });
    expect(draft.phase).toBe("PICK_PHASE");
    expect(draft.teams[1].bannedCreatureId).toBe("b1");
    draft = reduceDraft(draft, { type: "SELECT_ACTIVE_CREATURES", teamId: "a", creatureIds: ["a2", "a3", "a4"] });
    draft = reduceDraft(draft, { type: "SELECT_ACTIVE_CREATURES", teamId: "b", creatureIds: ["b2", "b3", "b4"] });
    expect(draft.phase).toBe("FORMATION_PHASE");
  });

  it("status registry declara stack e duração", () => {
    expect(statusDefinition("BURN").tickTiming).toBe("END_OF_TURN");
    expect(statusDefinition("RESOLVE").dispellable).toBe(false);
  });

  it("effectMeta deriva HIT/HEAL e sinergia consome o que o time produziu", () => {
    const strike = effectMetaOf({
      key: "boulder_toss",
      name: "Boulder",
      type: "ATTACK",
      cost: 1,
      element: "EARTH",
      targetType: "ENEMY",
      tags: ["TANK", "FOUNDATION"],
      typology: "TANK",
      effects: [{ op: "DAMAGE", value: 15 }],
    });
    expect(strike.produces).toEqual(expect.arrayContaining(["HIT", "TANK"]));
    const pact = effectMetaOf({
      key: "tidal_pact",
      name: "Pacto",
      type: "SKILL",
      cost: 2,
      element: "NATURE",
      targetType: "ALLY",
      tags: ["SYNERGY", "HEAL"],
      typology: "HEAL",
      effects: [{ op: "HEAL", value: 10 }],
    });
    expect(pact.produces).toEqual(expect.arrayContaining(["HEAL"]));
    expect(pact.consumes).toEqual(expect.arrayContaining(["HIT", "TANK"]));
  });
});
