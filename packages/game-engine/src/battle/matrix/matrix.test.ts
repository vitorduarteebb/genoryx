import { describe, expect, it } from "vitest";
import { generateCreatureBlueprint } from "../../genes/generate";
import { createBattleState } from "../create";
import { reduceBattle, resolveValidTargets } from "../reduce";
import { createDraftState, reduceDraft } from "./draft";
import { collapseLinearFormation } from "./formation-linear";
import { evaluateMatrixFusion } from "./fusion-v2";
import { combatDraftProof, combatMatrixProof } from "./proof";
import { recycleDiscard } from "./recycle";
import { isSlotTargetable, listValidTargets, middleWindowOpen } from "./targeting";
import { contributedTypologies, type BattleUsageEntry } from "./usage";
import { createSeededRandom } from "../../random/random-service";
import { familyFor, fusionIdentity } from "../../powers/fusion";
import { getCardDefinition } from "@nexora/config";

const bases = { baseHp: 80, baseAtk: 100, baseDef: 40, baseMag: 70, baseRes: 60, baseSpd: 90 };

function unit(id: string, slot: "FRONT" | "MIDDLE" | "BACK", hp = 20) {
  return { id, slot, hp };
}

function v2Battle() {
  const hero = generateCreatureBlueprint({ seed: 3, speciesKey: "pyron", origin: "STARTER" });
  const mid = generateCreatureBlueprint({ seed: 4, speciesKey: "noctyr", origin: "WILD" });
  const back = generateCreatureBlueprint({ seed: 5, speciesKey: "florune", origin: "WILD" });
  const foe = generateCreatureBlueprint({ seed: 6, speciesKey: "terranox", origin: "WILD" });
  const foeMid = generateCreatureBlueprint({ seed: 7, speciesKey: "noctyr", origin: "WILD" });
  const foeBack = generateCreatureBlueprint({ seed: 8, speciesKey: "florune", origin: "WILD" });
  return createBattleState({
    id: "v2",
    seed: 99,
    type: "PVE",
    rulesVersion: "V2",
    sideA: {
      id: "a",
      displayName: "A",
      creatures: [
        { blueprint: hero, bases, creatureId: "c-front", slot: "FRONT", typology: "BURN" },
        { blueprint: mid, bases, creatureId: "c-mid", slot: "MIDDLE", typology: "CONTROL" },
        { blueprint: back, bases, creatureId: "c-back", slot: "BACK", typology: "HEAL" },
      ],
    },
    sideB: {
      id: "b",
      displayName: "B",
      creatures: [
        { blueprint: foe, bases, creatureId: "e-front", slot: "FRONT", typology: "TANK" },
        { blueprint: foeMid, bases, creatureId: "e-mid", slot: "MIDDLE", typology: "CONTROL" },
        { blueprint: foeBack, bases, creatureId: "e-back", slot: "BACK", typology: "HEAL" },
      ],
    },
  });
}

describe("combat matrix V2", () => {
  it("FRONT protege MID e BACK; Assassin/PIERCE furam a formação", () => {
    expect(isSlotTargetable("FRONT", 1, "ANY_TARGETABLE")).toBe(true);
    expect(isSlotTargetable("MIDDLE", 1, "ANY_TARGETABLE")).toBe(false);
    expect(isSlotTargetable("MIDDLE", 2, "ANY_TARGETABLE")).toBe(false);
    expect(isSlotTargetable("BACK", 2, "ANY_TARGETABLE")).toBe(false);
    expect(isSlotTargetable("BACK", 1, "BACKLINE")).toBe(true);
    expect(isSlotTargetable("MIDDLE", 1, "PIERCE_FRONT")).toBe(true);
    expect(middleWindowOpen(1)).toBe(false);
    expect(middleWindowOpen(2)).toBe(true);
    const state = v2Battle();
    const r1 = resolveValidTargets(state, 0, "ENEMY");
    expect(r1.every((row) => row.slot === "FRONT")).toBe(true);
    const r2 = listValidTargets({
      allies: state.sides[0].creatures,
      enemies: state.sides[1].creatures,
      round: 2,
      rule: "ANY_TARGETABLE",
    });
    expect(r2.every((row) => row.slot === "FRONT")).toBe(true);
    const pierce = listValidTargets({
      allies: state.sides[0].creatures,
      enemies: state.sides[1].creatures,
      round: 1,
      rule: "PIERCE_FRONT",
    });
    expect(pierce.some((row) => row.slot === "MIDDLE")).toBe(true);
    const backline = listValidTargets({
      allies: state.sides[0].creatures,
      enemies: state.sides[1].creatures,
      round: 1,
      rule: "BACKLINE",
    });
    expect(backline.some((row) => row.slot === "BACK")).toBe(true);
  });

  it("FRONT KO promove MIDDLE→FRONT e BACK→MIDDLE", () => {
    const collapsed = collapseLinearFormation([
      unit("tank", "FRONT", 0),
      unit("control", "MIDDLE", 10),
      unit("burst", "BACK", 10),
    ]);
    expect(collapsed.collapsed).toBe(true);
    expect(collapsed.next.find((row) => row.id === "control")?.slot).toBe("FRONT");
    expect(collapsed.next.find((row) => row.id === "burst")?.slot).toBe("MIDDLE");
  });

  it("MIDDLE KO não promove BACK", () => {
    const next = collapseLinearFormation([
      unit("tank", "FRONT", 10),
      unit("control", "MIDDLE", 0),
      unit("burst", "BACK", 10),
    ]);
    expect(next.collapsed).toBe(false);
    expect(next.next.find((row) => row.id === "burst")?.slot).toBe("BACK");
    expect(next.next.find((row) => row.id === "tank")?.slot).toBe("FRONT");
  });

  it("draft 5 → ban 1 → pick 3 → 1 banco, sem pick banido", () => {
    const proof = combatDraftProof();
    expect(proof.banned).toBe("terranox-1");
    expect(proof.selected).toEqual(["pyron-1", "florune-1", "noctyr-1"]);
    expect(proof.benched).toBe("voltaris-1");
    expect(proof.formation).toEqual({ FRONT: "pyron-1", MIDDLE: "noctyr-1", BACK: "florune-1" });
    expect(proof.bannedPickRejected).toBe(true);
    expect(proof.phase).toBe("READY");
    let draft = createDraftState("a", "b");
    const catalog = [
      { creatureId: "1", speciesKey: "pyron", typology: "BURN", eligible: true },
      { creatureId: "2", speciesKey: "florune", typology: "HEAL", eligible: true },
      { creatureId: "3", speciesKey: "noctyr", typology: "CONTROL", eligible: true },
      { creatureId: "4", speciesKey: "terranox", typology: "TANK", eligible: true },
      { creatureId: "5", speciesKey: "voltaris", typology: "CRITICAL", eligible: true },
    ];
    draft = reduceDraft(draft, { type: "SUBMIT_ROSTER", teamId: "a", creatureIds: ["1", "2", "3", "4", "5"], catalog });
    expect(draft.teams[0].roster).toHaveLength(5);
  });

  it("carta jogada vai ao discard e recycle é determinístico", () => {
    let state = v2Battle();
    state.sides[0].energy = 10;
    const card = state.sides[0].hand[0]!;
    state = reduceBattle(state, { type: "PLAY_CARD", cardInstanceId: card.instanceId });
    expect(state.sides[0].discard.some((row) => row.instanceId === card.instanceId)).toBe(true);
    const rngA = createSeededRandom(11);
    const rngB = createSeededRandom(11);
    const pile = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
    expect(recycleDiscard([], pile, rngA).deck.map((row) => row.id)).toEqual(recycleDiscard([], [...pile], rngB).deck.map((row) => row.id));
  });

  it("recycle não apaga usage history", () => {
    const history: BattleUsageEntry[] = [
      { sequence: 1, round: 1, side: 0, cardKey: "ember_strike", typology: "BURN", mechanicTags: ["BURN"] },
    ];
    recycleDiscard([], [{ instanceId: "x", definitionKey: "ember_strike" }], createSeededRandom(1));
    expect(contributedTypologies(history, 0)).toEqual(["BURN"]);
  });

  it("função HEAL nas mechanicTags não vira tipologia de fusão", () => {
    expect(
      contributedTypologies(
        [{ sequence: 1, round: 2, side: 0, cardKey: "bedrock_pact", typology: "TANK", mechanicTags: ["HEAL", "ADVANCED", "draconic", "TANK"] }],
        0,
      ),
    ).toEqual(["TANK"]);
  });

  it("round 4 sem fusion pronta; round 5 exige usage", () => {
    const living = ["BURN", "HEAL", "CONTROL"] as const;
    const usage: BattleUsageEntry[] = [
      { sequence: 1, round: 1, side: 0, cardKey: "a", typology: "BURN", mechanicTags: ["BURN"] },
      { sequence: 2, round: 2, side: 0, cardKey: "b", typology: "HEAL", mechanicTags: ["HEAL"] },
      { sequence: 3, round: 3, side: 0, cardKey: "c", typology: "CONTROL", mechanicTags: ["CONTROL"] },
    ];
    const early = evaluateMatrixFusion({
      livingTypologies: living,
      usage,
      side: 0,
      round: 4,
      resonance: 8,
      momentum: 2,
      alreadyAwakened: [],
    });
    expect(early.every((row) => !row.ready)).toBe(true);
    const ready = evaluateMatrixFusion({
      livingTypologies: living,
      usage,
      side: 0,
      round: 5,
      resonance: 8,
      momentum: 2,
      alreadyAwakened: [],
    });
    expect(ready.find((row) => row.familyKey === "VITAL_ASHES")?.ready).toBe(true);
    const missingHeal = evaluateMatrixFusion({
      livingTypologies: living,
      usage: usage.filter((row) => row.typology !== "HEAL"),
      side: 0,
      round: 5,
      resonance: 8,
      momentum: 2,
      alreadyAwakened: [],
    });
    expect(missingHeal.find((row) => row.familyKey === "VITAL_ASHES")?.ready).toBe(false);
    expect(missingHeal.find((row) => row.familyKey === "VITAL_ASHES")?.reason).toBe("usage");
  });

  it("criatura morta sai das novas fusões; despertada permanece", () => {
    const usage: BattleUsageEntry[] = [
      { sequence: 1, round: 1, side: 0, cardKey: "a", typology: "BURN", mechanicTags: ["BURN"] },
      { sequence: 2, round: 2, side: 0, cardKey: "b", typology: "TANK", mechanicTags: ["TANK"] },
    ];
    const afterKo = evaluateMatrixFusion({
      livingTypologies: ["BURN"],
      usage,
      side: 0,
      round: 5,
      resonance: 8,
      momentum: 2,
      alreadyAwakened: ["LIVING_FURNACE"],
    });
    expect(afterKo.find((row) => row.familyKey === "LIVING_FURNACE")?.ready).toBe(true);
    expect(afterKo.find((row) => row.familyKey === "VITAL_ASHES")).toBeUndefined();
  });

  it("identidade de fusão e convergência é order-independent", () => {
    expect(fusionIdentity(["BURN", "HEAL"])).toBe(fusionIdentity(["HEAL", "BURN"]));
    expect(familyFor(["BURN", "TANK"])?.key).toBe("LIVING_FURNACE");
    expect(familyFor(["TANK", "HEAL"])?.key).toBe("LIVING_BASTION");
    expect(familyFor(["CONTROL", "BURN", "HEAL"])?.key).toBe("PHOENIX_CYCLE");
    expect(familyFor(["BURN", "BURN"])).toBeNull();
    const proof = combatMatrixProof();
    expect(proof.draft.phase).toBe("READY");
    expect(proof.windows[0]?.middleOpen).toBe(false);
    expect(proof.fusionRound4).toEqual([]);
    expect(proof.vitalAshes?.ready).toBe(true);
    expect(proof.phoenix?.ready).toBe(true);
    expect(proof.phoenix?.presentation).toBe("CONVERGENCE");
  });

  it("round 1 rejeita MIDDLE e BACK em carta normal", () => {
    const state = v2Battle();
    state.sides[0].energy = 10;
    const card = {
      instanceId: "normal-atk",
      definitionKey: "ember_strike",
      sourceCreatureId: "c-front",
      resolved: {
        key: "ember_strike",
        name: "Golpe",
        type: "ATTACK" as const,
        cost: 1,
        element: "FIRE" as const,
        targetType: "ENEMY",
        tags: ["ATTACK", "FOUNDATION"],
        effects: [{ op: "DAMAGE", value: 10 }],
      },
    };
    state.sides[0].hand.unshift(card);
    const mid = state.sides[1].creatures.find((row) => row.slot === "MIDDLE")!;
    const rejected = reduceBattle(state, { type: "PLAY_CARD", cardInstanceId: card.instanceId, targetId: mid.id });
    expect(rejected.log.at(-1)?.type).toBe("REJECT");
    const front = state.sides[1].creatures.find((row) => row.slot === "FRONT")!;
    const played = reduceBattle(state, { type: "PLAY_CARD", cardInstanceId: card.instanceId, targetId: front.id });
    expect(played.log.some((row) => row.type === "CARD_PLAYED")).toBe(true);
  });
});
