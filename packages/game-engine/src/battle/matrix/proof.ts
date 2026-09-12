import { combatMatrixConfig, seedPowerForSpecies } from "@nexora/config";
import type { LinearFormationSlot } from "@nexora/types";
import { generateCreatureBlueprint } from "../../genes/generate";
import { createBattleState } from "../create";
import { listLegalTargets, pickAiAction, reduceBattle } from "../reduce";
import { createDraftState, reduceDraft, type DraftCreature } from "./draft";
import { middleWindowOpen } from "./targeting";
import { evaluateMatrixFusion, livingTypologies } from "./fusion-v2";

const bases = { baseHp: 90, baseAtk: 110, baseDef: 45, baseMag: 80, baseRes: 70, baseSpd: 95 };

const PROOF_ROSTER = [
  { creatureId: "pyron-1", speciesKey: "pyron", typology: "BURN" },
  { creatureId: "florune-1", speciesKey: "florune", typology: "HEAL" },
  { creatureId: "noctyr-1", speciesKey: "noctyr", typology: "CONTROL" },
  { creatureId: "terranox-1", speciesKey: "terranox", typology: "TANK" },
  { creatureId: "voltaris-1", speciesKey: "voltaris", typology: "CRITICAL" },
] as const;

function catalog(): DraftCreature[] {
  return PROOF_ROSTER.map((row) => ({ ...row, eligible: true }));
}

function fighterOf(ids: readonly string[], formation: Partial<Record<LinearFormationSlot, string>>, prefix: string) {
  return {
    id: prefix,
    characterId: prefix === "player" ? "char-proof" : undefined,
    displayName: prefix === "player" ? "Jogador" : "Oponente",
    creatures: ids.map((id) => {
      const row = PROOF_ROSTER.find((item) => item.creatureId === id)!;
      const slot = (Object.entries(formation).find(([, creatureId]) => creatureId === id)?.[0] ?? "FRONT") as LinearFormationSlot;
      return {
        blueprint: generateCreatureBlueprint({ seed: id.length * 17, speciesKey: row.speciesKey, origin: "WILD" as const }),
        bases,
        creatureId: id,
        slot,
        typology: row.typology,
        powerId: seedPowerForSpecies(row.speciesKey)?.key,
      };
    }),
    rosterIds: [...PROOF_ROSTER.map((row) => row.creatureId)],
    bannedCreatureId: "terranox-1",
    selectedIds: [...ids],
    benchedCreatureId: "voltaris-1",
  };
}

export function combatDraftProof() {
  let draft = createDraftState("player", "foe");
  const list = catalog();
  draft = reduceDraft(draft, { type: "SUBMIT_ROSTER", teamId: "player", creatureIds: list.map((row) => row.creatureId), catalog: list });
  draft = reduceDraft(draft, { type: "SUBMIT_ROSTER", teamId: "foe", creatureIds: list.map((row) => row.creatureId), catalog: list });
  draft = reduceDraft(draft, { type: "BAN_CREATURE", teamId: "foe", creatureId: "terranox-1" });
  draft = reduceDraft(draft, { type: "BAN_CREATURE", teamId: "player", creatureId: "terranox-1" });
  draft = reduceDraft(draft, {
    type: "SELECT_ACTIVE_CREATURES",
    teamId: "player",
    creatureIds: ["pyron-1", "florune-1", "noctyr-1"],
  });
  draft = reduceDraft(draft, {
    type: "SELECT_ACTIVE_CREATURES",
    teamId: "foe",
    creatureIds: ["pyron-1", "florune-1", "noctyr-1"],
  });
  const bannedPick = reduceDraft(draft, {
    type: "SELECT_ACTIVE_CREATURES",
    teamId: "player",
    creatureIds: ["pyron-1", "florune-1", "terranox-1"],
  });
  draft = reduceDraft(draft, {
    type: "SET_FORMATION",
    teamId: "player",
    formation: { FRONT: "pyron-1", MIDDLE: "noctyr-1", BACK: "florune-1" },
  });
  draft = reduceDraft(draft, {
    type: "SET_FORMATION",
    teamId: "foe",
    formation: { FRONT: "pyron-1", MIDDLE: "noctyr-1", BACK: "florune-1" },
  });
  return {
    phase: draft.phase,
    banned: draft.teams[0].bannedCreatureId,
    selected: draft.teams[0].selectedIds,
    benched: draft.teams[0].benchedCreatureId,
    formation: draft.teams[0].formation,
    bannedPickRejected: bannedPick.log.some((row) => row.type === "REJECT"),
  };
}

export function combatMatrixProof() {
  const draft = combatDraftProof();
  let state = createBattleState({
    id: "matrix-proof",
    seed: 20260903,
    type: "PVE",
    rulesVersion: "V2",
    sideA: fighterOf(["pyron-1", "noctyr-1", "florune-1"], draft.formation, "player"),
    sideB: fighterOf(["pyron-1", "noctyr-1", "florune-1"], draft.formation, "foe"),
  });

  const windows: Array<{ round: number; middleOpen: boolean; front: string[]; middle: string[]; back: string[] }> = [];
  const snapshot = (round: number) => {
    const foes = state.sides[1].creatures;
    windows.push({
      round,
      middleOpen: middleWindowOpen(round),
      front: listLegalTargets(state, 0, "ENEMY", []).filter((row) => row.slot === "FRONT").map((row) => row.id),
      middle: listLegalTargets(state, 0, "ENEMY", []).filter((row) => row.slot === "MIDDLE").map((row) => row.id),
      back: listLegalTargets(state, 0, "ENEMY", ["BACKLINE"]).filter((row) => row.slot === "BACK").map((row) => row.id),
    });
  };

  snapshot(1);
  for (let cycle = 0; cycle < 12 && state.status === "ACTIVE" && state.round < 8; cycle += 1) {
    if (state.activeSide === 0) {
      const playable = state.sides[0].hand[0];
      if (playable && state.sides[0].energy > 0) {
        const before = state;
        state = reduceBattle(state, { type: "PLAY_CARD", cardInstanceId: playable.instanceId });
        if (state === before || state.log.at(-1)?.type === "REJECT") {
          state = reduceBattle(state, { type: "END_TURN" });
        }
      } else {
        state = reduceBattle(state, { type: "END_TURN" });
      }
    } else {
      state = reduceBattle(state, pickAiAction(state));
      if (state.activeSide === 1 && state.status === "ACTIVE") {
        state = reduceBattle(state, { type: "END_TURN" });
      }
    }
    if (windows.at(-1)?.round !== state.round) {
      snapshot(state.round);
    }
  }

  const fusionAt = (round: number, resonance: number) =>
    evaluateMatrixFusion({
      livingTypologies: livingTypologies(state.sides[0].creatures),
      usage: state.usageHistory.filter((row) => row.side === 0),
      side: 0,
      round,
      resonance,
      momentum: state.sides[0].momentum,
      alreadyAwakened: [],
    });

  const withUsage = evaluateMatrixFusion({
    livingTypologies: ["BURN", "HEAL", "CONTROL"],
    usage: [
      { sequence: 1, round: 1, side: 0, cardKey: "ember_strike", typology: "BURN", mechanicTags: ["BURN"] },
      { sequence: 2, round: 2, side: 0, cardKey: "ember_strike", typology: "BURN", mechanicTags: ["BURN"] },
      { sequence: 3, round: 2, side: 0, cardKey: "bloom_pact", typology: "HEAL", mechanicTags: ["HEAL"] },
      { sequence: 4, round: 3, side: 0, cardKey: "bloom_pact", typology: "HEAL", mechanicTags: ["HEAL"] },
      { sequence: 5, round: 4, side: 0, cardKey: "tide_lock", typology: "CONTROL", mechanicTags: ["CONTROL"] },
    ],
    side: 0,
    round: 5,
    resonance: 8,
    momentum: 2,
    alreadyAwakened: [],
  });

  const insufficient = evaluateMatrixFusion({
    livingTypologies: ["BURN", "HEAL", "CONTROL"],
    usage: [{ sequence: 1, round: 1, side: 0, cardKey: "ember_strike", typology: "BURN", mechanicTags: ["BURN"] }],
    side: 0,
    round: 5,
    resonance: 8,
    momentum: 2,
    alreadyAwakened: [],
  });

  const phoenix = evaluateMatrixFusion({
    livingTypologies: ["BURN", "HEAL", "CONTROL"],
    usage: [
      { sequence: 1, round: 1, side: 0, cardKey: "a", typology: "BURN", mechanicTags: ["BURN"] },
      { sequence: 2, round: 2, side: 0, cardKey: "b", typology: "HEAL", mechanicTags: ["HEAL"] },
      { sequence: 3, round: 3, side: 0, cardKey: "c", typology: "CONTROL", mechanicTags: ["CONTROL"] },
    ],
    side: 0,
    round: 7,
    resonance: 12,
    momentum: 3,
    alreadyAwakened: [],
  }).find((row) => row.familyKey === "PHOENIX_CYCLE");

  return {
    flags: {
      draftV2: combatMatrixConfig.draftV2,
      formationLinearV2: combatMatrixConfig.formationLinearV2,
      fusionV2: combatMatrixConfig.fusionV2,
      convergenceV1: combatMatrixConfig.convergenceV1,
    },
    draft,
    party: state.sides[0].creatures.map((row) => ({
      id: row.id,
      name: row.name,
      speciesKey: row.speciesKey,
      slot: row.slot,
      typology: row.typology,
    })),
    windows,
    usagePreserved: state.usageHistory.length,
    fusionRound4: fusionAt(4, 8).filter((row) => row.ready),
    fusionRound5: withUsage.filter((row) => !row.triple),
    vitalAshes: withUsage.find((row) => row.familyKey === "VITAL_ASHES") ?? null,
    livingFurnace: withUsage.find((row) => row.familyKey === "LIVING_FURNACE") ?? null,
    healControlWithoutBurnUsage: insufficient.find((row) => row.familyKey === "CONTROLLED_REGENERATION") ?? null,
    phoenix: phoenix ?? null,
    events: state.log.map((row) => row.type),
  };
}
