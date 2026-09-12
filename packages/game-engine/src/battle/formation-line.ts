/** Camada de linha tática. Slots clássicos e lineares mapeiam para FRONT → MID → BACKLINE. */

export type CombatLine = "FRONT" | "MID" | "BACKLINE";

const LINE_RANK: Record<CombatLine, number> = { FRONT: 1, MID: 2, BACKLINE: 3 };

export function combatLineOf(slot: string | undefined | null): CombatLine {
  if (slot === "FRONT") return "FRONT";
  if (slot === "MIDDLE" || slot === "BACK_LEFT") return "MID";
  return "BACKLINE";
}

export function lineLabel(line: CombatLine): string {
  if (line === "FRONT") return "frente";
  if (line === "MID") return "meio";
  return "retaguarda";
}

export function livingOnLine<T extends { slot: string; hp: number }>(units: readonly T[], line: CombatLine): T[] {
  return units.filter((row) => row.hp > 0 && combatLineOf(row.slot) === line);
}

export function exposedLine<T extends { slot: string; hp: number }>(enemies: readonly T[]): CombatLine | null {
  if (livingOnLine(enemies, "FRONT").length > 0) return "FRONT";
  if (livingOnLine(enemies, "MID").length > 0) return "MID";
  if (livingOnLine(enemies, "BACKLINE").length > 0) return "BACKLINE";
  return null;
}

export function lineRank(line: CombatLine): number {
  return LINE_RANK[line];
}

export function swapSlots<T extends { slot: string }>(a: T, b: T) {
  const left = a.slot;
  a.slot = b.slot;
  b.slot = left;
}
