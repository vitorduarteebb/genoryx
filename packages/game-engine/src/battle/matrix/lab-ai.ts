import type { LinearFormationSlot } from "@nexora/types";
import type { DraftCreature, DraftState } from "./draft";

const AI_SPECIES = [
  { creatureId: "lab-ai-pyron", speciesKey: "pyron", typology: "BURN" },
  { creatureId: "lab-ai-florune", speciesKey: "florune", typology: "HEAL" },
  { creatureId: "lab-ai-noctyr", speciesKey: "noctyr", typology: "CONTROL" },
  { creatureId: "lab-ai-terranox", speciesKey: "terranox", typology: "TANK" },
  { creatureId: "lab-ai-voltaris", speciesKey: "voltaris", typology: "CRITICAL" },
] as const;

export function aiLabCatalog(): DraftCreature[] {
  return AI_SPECIES.map((row) => ({ ...row, eligible: true }));
}

export function aiBanTarget(playerRoster: readonly DraftCreature[]): string {
  return playerRoster.find((row) => row.speciesKey === "terranox")?.creatureId ?? playerRoster[0]?.creatureId ?? "";
}

export function aiPickThree(roster: readonly DraftCreature[], banned: string | null): string[] {
  const leftover = roster.filter((row) => row.creatureId !== banned);
  const prefer = ["BURN", "CONTROL", "HEAL", "TANK", "CRITICAL"];
  return leftover
    .slice()
    .sort((a, b) => prefer.indexOf(a.typology) - prefer.indexOf(b.typology))
    .slice(0, 3)
    .map((row) => row.creatureId);
}

export function aiFormation(selectedIds: readonly string[], roster: readonly DraftCreature[]): Partial<Record<LinearFormationSlot, string>> {
  const unused = selectedIds.filter((id): id is string => Boolean(id));
  const take = (...typologies: string[]) => {
    for (const typology of typologies) {
      const id = unused.find((item) => roster.find((row) => row.creatureId === item)?.typology === typology);
      if (id) {
        unused.splice(unused.indexOf(id), 1);
        return id;
      }
    }
    return undefined;
  };
  const front = take("BURN", "TANK");
  const middle = take("CONTROL");
  const back = take("HEAL");
  return {
    FRONT: front ?? unused.shift(),
    MIDDLE: middle ?? unused.shift(),
    BACK: back ?? unused.shift(),
  };
}

export function foeTeamOf(draft: DraftState) {
  return draft.teams[1];
}
