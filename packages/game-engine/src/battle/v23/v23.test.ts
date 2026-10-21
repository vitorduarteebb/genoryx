import { describe, expect, it } from "vitest";
import {
  combatV23Config,
  convertEnergyToMana,
  defaultResolutionProfile,
  fusionRecipesV23,
  interventionSurchargeV23,
} from "@nexora/config";
import { generateCreatureBlueprint } from "../../genes/generate";
import { createBattleState } from "../create";
import { reduceBattle } from "../reduce";
import { applyIntervention } from "./interventions";
import { graphFromCard, mitigateDamage, suppressStatus } from "./graph";
import { applyArcaneReserve, ensureMana, reservePreview, trySpendMana } from "./mana";
import { hydrateResolutionProfile, inferTimingClass } from "./timing";
import { fusionManifestation, geneticPowerManifestation, matchFusionRecipe } from "./virtual";
import { eligibleResponses, shouldOpenWindow } from "./windows";
import { announceForStack, ensureV23, passPriority, stackRespond } from "./resolve";
import type { PlayableCard } from "../types";
import type { StackFrame } from "./types";

const bases = { baseHp: 90, baseAtk: 120, baseDef: 40, baseMag: 85, baseRes: 75, baseSpd: 100 };

function battle() {
  const a = generateCreatureBlueprint({ seed: 11, speciesKey: "pyron", origin: "STARTER" });
  const foe = generateCreatureBlueprint({ seed: 44, speciesKey: "terranox", origin: "WILD" });
  return createBattleState({
    id: "v23",
    seed: 77,
    type: "PVE",
    matchMode: "CASUAL",
    sideA: { id: "a", characterId: "char-a", displayName: "A", creatures: [{ blueprint: a, bases, creatureId: "c1" }] },
    sideB: { id: "b", displayName: "Foe", creatures: [{ blueprint: foe, bases, creatureId: "e1" }] },
  });
}

const ritual: PlayableCard = {
  key: "static_storm",
  name: "Tempestade Estática",
  type: "ULTIMATE",
  cost: 4,
  element: "ELECTRIC",
  targetType: "ENEMY",
  locusRole: "ULTIMATE",
  tags: ["RITUAL", "STACKABLE"],
  effects: [
    { op: "DAMAGE", value: 28 },
    { op: "APPLY_STATUS", status: "BURN", duration: 2 },
  ],
};

const barrier: PlayableCard = {
  key: "earth_barrier",
  name: "Barreira Telúrica",
  type: "REACTION",
  cost: 1,
  element: "EARTH",
  targetType: "SELF",
  tags: ["REACTION", "MITIGATE"],
  effects: [{ op: "SHIELD", value: 12 }],
};

describe("combat v2.3 timing + mana", () => {
  it("separa Energy e Mana e converte Reserva Arcana sem estourar o teto", () => {
    const state = ensureV23(battle());
    expect(state.sides[0].mana).toBe(combatV23Config.startingMana);
    expect(state.sides[0].mana).not.toBe(state.sides[0].energy);
    state.sides[0].energy = 4;
    state.sides[0].reservedEnergy = 1;
    const preview = reservePreview(state.sides[0]);
    expect(preview.leftover).toBe(3);
    const { converted } = applyArcaneReserve(state.sides[0]);
    expect(converted).toBe(3);
    expect(state.sides[0].mana).toBe(5);
    const cap = convertEnergyToMana(20, 9);
    expect(cap.mana).toBe(10);
  });

  it("nunca cobra surcharge negativo e recusa mana insuficiente sem gastar", () => {
    expect(interventionSurchargeV23(0, -4)).toBe(0);
    expect(interventionSurchargeV23(3)).toBe(2);
    const side = ensureMana(battle().sides[0]);
    side.mana = 1;
    const fail = trySpendMana(side, 3);
    expect(fail.ok).toBe(false);
    expect(side.mana).toBe(1);
  });

  it("hidrata timingClass de ACTION, IMPETUS, REACTION, COUNTER, RITUAL", () => {
    expect(inferTimingClass({ ...ritual, type: "ATTACK", tags: [], locusRole: "FOUNDATION", cost: 1 }, "G1")).toBe("ACTION");
    expect(inferTimingClass({ ...ritual, type: "SKILL", tags: ["MOBILITY"], locusRole: "FOUNDATION", cost: 1 }, "G2")).toBe("IMPETUS");
    expect(hydrateResolutionProfile(barrier).timingClass).toBe("REACTION");
    // Kit G7: type REACTION + tag COUNTER permanece REACTION (PRE_IMPACT + DECLARE).
    const replica = { ...barrier, tags: ["COUNTER", "REACTION", "MITIGATE"] };
    expect(hydrateResolutionProfile(replica).timingClass).toBe("REACTION");
    expect(hydrateResolutionProfile(replica).responseWindows).toEqual(
      expect.arrayContaining(["DECLARE", "PRE_IMPACT"]),
    );
    expect(hydrateResolutionProfile({ ...barrier, type: "SKILL", tags: ["COUNTER"] }).timingClass).toBe("COUNTER");
    expect(hydrateResolutionProfile(ritual).timingClass).toBe("RITUAL");
    expect(hydrateResolutionProfile(ritual).opensStack).toBe(true);
    expect(defaultResolutionProfile("IMPETUS").stackSpeed).toBe("FAST");
    expect(defaultResolutionProfile("CHANNEL").interruptConditions).toContain("STUN");
    expect(defaultResolutionProfile("PREPARATION").resolutionMode).toBe("PREPARED");
    expect(defaultResolutionProfile("PASSIVE").resolutionMode).toBe("PASSIVE");
  });

  it("graph permite counter parcial: mitigar dano ou suprimir status", () => {
    const graph = graphFromCard(ritual, "ARCANE");
    expect(graph.nodes).toHaveLength(2);
    expect(mitigateDamage(graph, 0.5).nodes[0]?.value).toBe(14);
    expect(suppressStatus(graph).nodes[1]?.suppressed).toBe(true);
  });

  it("intervenções oficiais mutam o frame da pilha", () => {
    const frame: StackFrame = {
      id: "f1",
      side: 0,
      cardKey: ritual.key,
      cardName: ritual.name,
      timingClass: "RITUAL",
      stackSpeed: "NORMAL",
      domain: "ARCANE",
      graph: graphFromCard(ritual, "ARCANE"),
      manaPaid: 0,
      surcharge: 0,
      responseIndex: 0,
      cancelled: false,
      delayed: false,
      sealed: "NONE",
    };
    expect(applyIntervention("CANCEL", frame).cancelled).toBe(true);
    expect(applyIntervention("REDIRECT", frame, { newTargetId: "tank" }).redirectedTo).toBe("tank");
    expect(applyIntervention("DELAY", frame).delayed).toBe(true);
    expect(applyIntervention("SEAL", frame).sealed).toBe("NORMAL_LOCK");
    expect(applyIntervention("INTERCEPT", frame, { newTargetId: "galio" }).redirectedTo).toBe("galio");
    expect(applyIntervention("DODGE", frame).cancelled).toBe(true);
  });

  it("eligibleResponses lê o catálogo se resolved sumiu", () => {
    const state = ensureV23(battle());
    state.sides[0].mana = 6;
    state.sides[1].mana = 6;
    state.sides[1].hand = [{ instanceId: "g1", definitionKey: "flare_guard", sourceCreatureId: "e1" }];
    const ritualCard = { instanceId: "r1", definitionKey: ritual.key, resolved: ritual, sourceCreatureId: "c1" };
    const next = announceForStack(state, ritualCard, ritual, state.sides[1].creatures[0]?.id);
    expect(eligibleResponses(next, "DECLARE", next.magicWar?.frames[0]).some((row) => row.card.definitionKey === "flare_guard")).toBe(true);
  });

  it("não abre Embate se eligibleResponses = 0", () => {
    const state = ensureV23(battle());
    state.sides[0].hand = [];
    state.sides[1].hand = [];
    const card = { instanceId: "solo-ritual", definitionKey: ritual.key, resolved: ritual, sourceCreatureId: "c1" };
    const next = announceForStack(state, card, ritual, state.sides[1].creatures[0]?.id);
    expect(next.magicWar?.open).toBeFalsy();
    expect(next.log.some((row) => row.type === "RITUAL_AUTO" || row.type === "RESOLVE_DIRECT")).toBe(true);
    expect(shouldOpenWindow(eligibleResponses(next, "DECLARE", next.magicWar?.frames[0]))).toBe(false);
  });

  it("abre Guerra Mágica, cobra surcharge e resolve LIFO com SUPPRESS", () => {
    let state = ensureV23(battle());
    state.sides[0].mana = 6;
    state.sides[1].mana = 6;
    const ritualCard = { instanceId: "r1", definitionKey: ritual.key, resolved: ritual, sourceCreatureId: "c1" };
    const reactCard = { instanceId: "b1", definitionKey: barrier.key, resolved: barrier, sourceCreatureId: "e1" };
    state.sides[0].hand.push(ritualCard);
    state.sides[1].hand.push(reactCard);
    state = announceForStack(state, ritualCard, ritual, state.sides[1].creatures[0]?.id, (row) => row.resolved ?? null);
    expect(state.magicWar?.open).toBe(true);
    state.activeSide = 1;
    state = stackRespond(state, { type: "STACK_RESPOND", cardInstanceId: "b1", op: "MITIGATE" }, (row) => row.resolved ?? null);
    expect(state.magicWar?.frames.length).toBe(2);
    const impetus: PlayableCard = {
      ...barrier,
      key: "pulse",
      name: "Pulso de Ímpeto",
      type: "SKILL",
      tags: ["IMPETUS", "SUPPRESS"],
    };
    state.sides[0].hand.push({ instanceId: "i1", definitionKey: "pulse", resolved: impetus, sourceCreatureId: "c1" });
    state.activeSide = 0;
    state = stackRespond(state, { type: "STACK_RESPOND", cardInstanceId: "i1", op: "SUPPRESS" }, (row) => row.resolved ?? null);
    expect(state.magicWar?.frames.at(-1)?.surcharge).toBeGreaterThanOrEqual(0);
    state.activeSide = 1;
    state = passPriority(state);
    state = passPriority(state);
    expect(state.magicWar?.open).toBeFalsy();
    expect(state.log.some((row) => row.type === "STACK_RESOLVE")).toBe(true);
  });

  it("PvE mantém Guerra Mágica aberta quando o jogador tem resposta (não auto-colapsa)", () => {
    let state = ensureV23(battle());
    state.type = "PVE";
    state.sides[0].mana = 6;
    state.sides[1].mana = 6;
    const attack: PlayableCard = {
      key: "ember_strike",
      name: "Golpe de Brasa",
      type: "ATTACK",
      cost: 1,
      element: "FIRE",
      targetType: "ENEMY",
      tags: ["ATTACK"],
      effects: [{ op: "DAMAGE", value: 14 }],
    };
    const react: PlayableCard = {
      ...barrier,
      key: "flare_guard",
      tags: ["REACTION", "MITIGATE", "COUNTER"],
    };
    const foeUnit = state.sides[0].creatures[0]!;
    state.sides[1].hand = [
      { instanceId: "atk1", definitionKey: attack.key, resolved: attack, sourceCreatureId: "e1" },
    ];
    state.sides[0].hand = [
      { instanceId: "rx1", definitionKey: react.key, resolved: react, sourceCreatureId: "c1" },
    ];
    state.activeSide = 1;
    state = reduceBattle(state, {
      type: "PLAY_CARD",
      cardInstanceId: "atk1",
      targetId: foeUnit.id,
    });
    expect(state.magicWar?.open).toBe(true);
    expect(state.activeSide).toBe(0);
    expect(eligibleResponses(state, state.magicWar!.window ?? "PRE_IMPACT", state.magicWar!.frames[0]).some((row) => row.side === 0)).toBe(
      true,
    );
  });

  it("STACK_RESPOND passa a prioridade ao oponente", () => {
    let state = ensureV23(battle());
    state.sides[0].mana = 6;
    state.sides[1].mana = 6;
    const ritualCard = { instanceId: "r1", definitionKey: ritual.key, resolved: ritual, sourceCreatureId: "c1" };
    const reactCard = { instanceId: "b1", definitionKey: barrier.key, resolved: barrier, sourceCreatureId: "e1" };
    state.sides[0].hand.push(ritualCard);
    state.sides[1].hand.push(reactCard);
    state = announceForStack(state, ritualCard, ritual, state.sides[1].creatures[0]?.id, (row) => row.resolved ?? null);
    expect(state.activeSide).toBe(1);
    state = stackRespond(state, { type: "STACK_RESPOND", cardInstanceId: "b1", op: "MITIGATE" }, (row) => row.resolved ?? null);
    expect(state.activeSide).toBe(0);
    expect(state.magicWar?.prioritySide).toBe(0);
  });

  it("CONFIRM_TURN converte Energy restante em Mana e o V1.5 continua fechando o turno", () => {
    let state = battle();
    state.sides[0].energy = 4;
    const cheap = state.sides[0].hand.filter((row) => (row.resolved?.cost ?? 1) <= 2)[0];
    expect(cheap).toBeTruthy();
    state = reduceBattle(state, { type: "QUEUE_CARD", cardInstanceId: cheap!.instanceId });
    const manaBefore = state.sides[0].mana ?? 2;
    state = reduceBattle(state, { type: "CONFIRM_TURN" });
    expect(state.log.some((row) => row.type === "ARCANE_RESERVE" || row.type === "END_TURN" || row.type === "CARD_PLAYED")).toBe(true);
    expect((state.sides[0].mana ?? 0) + (state.sides[1].mana ?? 0)).toBeGreaterThanOrEqual(manaBefore);
  });

  it("cataloga 105 receitas Fusion V2 e manifesta Fusion/Genetic Power no mesmo resolver", () => {
    expect(fusionRecipesV23).toHaveLength(105);
    const magma = matchFusionRecipe(["BURN", "EARTH", "CRACKED"]);
    expect(magma?.key).toBe("MAGMA_CORE");
    const virtual = fusionManifestation(magma!, ["BURN", "EARTH"]);
    expect(virtual.kind).toBe("FUSION");
    expect(virtual.profile.timingClass).toBe("RITUAL");
    const power = geneticPowerManifestation({ key: "INCANDESCENT_HEART", namePt: "Coração Incandescente", timingClass: "REACTION" });
    expect(power.kind).toBe("GENETIC_POWER");
    expect(power.stackBehavior).toBe("INTERRUPTIBLE");
  });
});
