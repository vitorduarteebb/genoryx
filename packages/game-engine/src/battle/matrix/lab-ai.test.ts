import { describe, expect, it } from "vitest";
import { createDraftState, reduceDraft } from "./draft";
import { aiBanTarget, aiFormation, aiLabCatalog, aiPickThree } from "./lab-ai";

describe("lab AI draft", () => {
  it("bane Terranox do jogador e monta F/M/B sem pular fase", () => {
    const player = [
      { creatureId: "pyron-1", speciesKey: "pyron", typology: "BURN", eligible: true },
      { creatureId: "florune-1", speciesKey: "florune", typology: "HEAL", eligible: true },
      { creatureId: "noctyr-1", speciesKey: "noctyr", typology: "CONTROL", eligible: true },
      { creatureId: "terranox-1", speciesKey: "terranox", typology: "TANK", eligible: true },
      { creatureId: "voltaris-1", speciesKey: "voltaris", typology: "CRITICAL", eligible: true },
    ];
    const foe = aiLabCatalog();
    let draft = createDraftState("player", "foe");
    draft = reduceDraft(draft, { type: "SUBMIT_ROSTER", teamId: "player", creatureIds: player.map((row) => row.creatureId), catalog: player });
    draft = reduceDraft(draft, { type: "SUBMIT_ROSTER", teamId: "foe", creatureIds: foe.map((row) => row.creatureId), catalog: foe });
    expect(draft.phase).toBe("BAN_PHASE");
    draft = reduceDraft(draft, { type: "BAN_CREATURE", teamId: "player", creatureId: "lab-ai-terranox" });
    draft = reduceDraft(draft, { type: "BAN_CREATURE", teamId: "foe", creatureId: aiBanTarget(player) });
    expect(draft.teams[0].bannedCreatureId).toBe("terranox-1");
    expect(draft.phase).toBe("PICK_PHASE");
    draft = reduceDraft(draft, { type: "SELECT_ACTIVE_CREATURES", teamId: "player", creatureIds: ["pyron-1", "noctyr-1", "florune-1"] });
    draft = reduceDraft(draft, { type: "SELECT_ACTIVE_CREATURES", teamId: "foe", creatureIds: aiPickThree(foe, draft.teams[1].bannedCreatureId) });
    expect(draft.teams[0].benchedCreatureId).toBe("voltaris-1");
    expect(draft.phase).toBe("FORMATION_PHASE");
    draft = reduceDraft(draft, {
      type: "SET_FORMATION",
      teamId: "player",
      formation: { FRONT: "pyron-1", MIDDLE: "noctyr-1", BACK: "florune-1" },
    });
    draft = reduceDraft(draft, { type: "SET_FORMATION", teamId: "foe", formation: aiFormation(draft.teams[1].selectedIds, foe) });
    expect(draft.phase).toBe("READY");
    expect(draft.teams[0].formation).toEqual({ FRONT: "pyron-1", MIDDLE: "noctyr-1", BACK: "florune-1" });
  });

  it("monta F/M/B distintos depois de banir CONTROL (Ready não pode travar)", () => {
    const foe = aiLabCatalog();
    const picked = aiPickThree(foe, "lab-ai-noctyr");
    expect(picked).toEqual(["lab-ai-pyron", "lab-ai-florune", "lab-ai-terranox"]);
    const formation = aiFormation(picked, foe);
    const ids = [formation.FRONT, formation.MIDDLE, formation.BACK];
    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(3);
    expect(formation.FRONT).toBe("lab-ai-pyron");
    expect(formation.BACK).toBe("lab-ai-florune");
    expect(formation.MIDDLE).toBe("lab-ai-terranox");
  });
});
