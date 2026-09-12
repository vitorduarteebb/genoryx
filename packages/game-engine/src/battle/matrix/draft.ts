import { combatMatrixConfig } from "@nexora/config";
import type { BattleDraftPhase, LinearFormationSlot } from "@nexora/types";

export type DraftCreature = {
  creatureId: string;
  speciesKey: string;
  typology: string;
  eligible: boolean;
};

export type DraftTeam = {
  id: string;
  roster: DraftCreature[];
  bannedCreatureId: string | null;
  pendingBan?: string | null;
  selectedIds: string[];
  benchedCreatureId: string | null;
  formation: Partial<Record<LinearFormationSlot, string>>;
};

export type DraftState = {
  phase: BattleDraftPhase;
  teams: [DraftTeam, DraftTeam];
  log: Array<{ type: string; text: string }>;
};

export type DraftAction =
  | { type: "SUBMIT_ROSTER"; teamId: string; creatureIds: string[]; catalog: DraftCreature[] }
  | { type: "BAN_CREATURE"; teamId: string; creatureId: string }
  | { type: "SELECT_ACTIVE_CREATURES"; teamId: string; creatureIds: string[] }
  | { type: "SET_FORMATION"; teamId: string; formation: Partial<Record<LinearFormationSlot, string>> };

function teamOf(state: DraftState, teamId: string): DraftTeam | undefined {
  return state.teams.find((row) => row.id === teamId);
}

function opponentOf(state: DraftState, teamId: string): DraftTeam | undefined {
  return state.teams.find((row) => row.id !== teamId);
}

export function createDraftState(teamAId: string, teamBId: string): DraftState {
  const empty = (id: string): DraftTeam => ({
    id,
    roster: [],
    bannedCreatureId: null,
    pendingBan: null,
    selectedIds: [],
    benchedCreatureId: null,
    formation: {},
  });
  return {
    phase: "ROSTER_LOCK",
    teams: [empty(teamAId), empty(teamBId)],
    log: [],
  };
}

export function reduceDraft(state: DraftState, action: DraftAction): DraftState {
  const next = structuredClone(state);
  const team = teamOf(next, action.teamId);
  if (!team) {
    next.log.push({ type: "REJECT", text: "Time inexistente." });
    return next;
  }

  if (action.type === "SUBMIT_ROSTER") {
    if (next.phase !== "ROSTER_LOCK") {
      next.log.push({ type: "REJECT", text: "Roster já trancado." });
      return next;
    }
    if (action.creatureIds.length !== combatMatrixConfig.rosterSize) {
      next.log.push({ type: "REJECT", text: `Roster exige ${combatMatrixConfig.rosterSize} criaturas.` });
      return next;
    }
    const unique = new Set(action.creatureIds);
    if (unique.size !== action.creatureIds.length) {
      next.log.push({ type: "REJECT", text: "Roster com criatura repetida." });
      return next;
    }
    const locked: DraftCreature[] = [];
    for (const id of action.creatureIds) {
      const row = action.catalog.find((item) => item.creatureId === id);
      if (!row || !row.eligible) {
        next.log.push({ type: "REJECT", text: `Criatura inelegível: ${id}.` });
        return next;
      }
      locked.push(row);
    }
    team.roster = locked;
    next.log.push({ type: "ROSTER_LOCKED", text: `${team.id} trancou o roster de 5.` });
    if (next.teams.every((row) => row.roster.length === combatMatrixConfig.rosterSize)) {
      next.phase = "BAN_PHASE";
    }
    return next;
  }

  if (action.type === "BAN_CREATURE") {
    if (next.phase !== "BAN_PHASE") {
      next.log.push({ type: "REJECT", text: "Fora da fase de ban." });
      return next;
    }
    const foe = opponentOf(next, action.teamId);
    if (!foe) {
      return next;
    }
    if (team.pendingBan || foe.bannedCreatureId) {
      next.log.push({ type: "REJECT", text: "Ban já aplicado." });
      return next;
    }
    if (!foe.roster.some((row) => row.creatureId === action.creatureId)) {
      next.log.push({ type: "REJECT", text: "Ban precisa ser do roster adversário." });
      return next;
    }
    team.pendingBan = action.creatureId;
    next.log.push({ type: "BAN_LOCKED", text: `${team.id} trancou o ban simultâneo.` });
    if (next.teams.every((row) => row.pendingBan)) {
      for (const row of next.teams) {
        const other = next.teams.find((item) => item.id !== row.id);
        if (other && row.pendingBan) {
          other.bannedCreatureId = row.pendingBan;
        }
      }
      next.log.push({ type: "CREATURE_BANNED", text: "Bans revelados simultaneamente." });
      next.phase = "PICK_PHASE";
    }
    return next;
  }

  if (action.type === "SELECT_ACTIVE_CREATURES") {
    if (next.phase !== "PICK_PHASE") {
      next.log.push({ type: "REJECT", text: "Fora da fase de pick." });
      return next;
    }
    if (action.creatureIds.length !== combatMatrixConfig.pickCount) {
      next.log.push({ type: "REJECT", text: `Pick exige exatamente ${combatMatrixConfig.pickCount}.` });
      return next;
    }
    if (action.creatureIds.some((id) => id === team.bannedCreatureId)) {
      next.log.push({ type: "REJECT", text: "Não é permitido pickar a criatura banida." });
      return next;
    }
    const eligible = team.roster.filter((row) => row.creatureId !== team.bannedCreatureId);
    if (!action.creatureIds.every((id) => eligible.some((row) => row.creatureId === id))) {
      next.log.push({ type: "REJECT", text: "Pick inválido." });
      return next;
    }
    const unique = new Set(action.creatureIds);
    if (unique.size !== combatMatrixConfig.pickCount) {
      next.log.push({ type: "REJECT", text: "Pick com repetição." });
      return next;
    }
    team.selectedIds = action.creatureIds;
    team.benchedCreatureId = eligible.find((row) => !unique.has(row.creatureId))?.creatureId ?? null;
    next.log.push({ type: "ACTIVE_TEAM_SELECTED", text: `${team.id} escolheu 3. Banco: ${team.benchedCreatureId}.` });
    if (next.teams.every((row) => row.selectedIds.length === combatMatrixConfig.pickCount)) {
      next.phase = "FORMATION_PHASE";
    }
    return next;
  }

  if (action.type === "SET_FORMATION") {
    if (next.phase !== "FORMATION_PHASE") {
      next.log.push({ type: "REJECT", text: "Fora da fase de formação." });
      return next;
    }
    const slots = ["FRONT", "MIDDLE", "BACK"] as const;
    const ids = slots.map((slot) => action.formation[slot]);
    if (ids.some((id) => !id) || new Set(ids).size !== 3) {
      next.log.push({ type: "REJECT", text: "Formação exige FRONT / MIDDLE / BACK distintos." });
      return next;
    }
    if (!ids.every((id) => team.selectedIds.includes(id!))) {
      next.log.push({ type: "REJECT", text: "Formação só aceita as 3 escolhidas." });
      return next;
    }
    team.formation = { FRONT: ids[0], MIDDLE: ids[1], BACK: ids[2] };
    next.log.push({ type: "FORMATION_SET", text: `${team.id} definiu F/M/B.` });
    if (next.teams.every((row) => row.formation.FRONT && row.formation.MIDDLE && row.formation.BACK)) {
      next.phase = "READY";
    }
    return next;
  }

  return next;
}

export function activeTypologies(team: DraftTeam): string[] {
  return team.selectedIds
    .map((id) => team.roster.find((row) => row.creatureId === id)?.typology)
    .filter((row): row is string => Boolean(row));
}
