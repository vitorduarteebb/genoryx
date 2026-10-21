export const ADVENTURE_RETURN_KEY = "genoryx-adventure-return";

export type AdventureAreaId = "haven" | "verdantis";

export type AdventureReturnState = {
  area: AdventureAreaId;
  x: number;
  z: number;
  wildGone?: boolean;
  toast?: string;
};

export function saveAdventureReturn(state: AdventureReturnState) {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(ADVENTURE_RETURN_KEY, JSON.stringify(state));
}

export function readAdventureReturn(): AdventureReturnState | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ADVENTURE_RETURN_KEY);
    if (!raw) return null;
    const row = JSON.parse(raw) as AdventureReturnState;
    if (row.area !== "haven" && row.area !== "verdantis") return null;
    return row;
  } catch {
    return null;
  }
}

export function adventureExitHref() {
  return readAdventureReturn() ? "/game/adventure?return=1" : "/game/arena";
}
