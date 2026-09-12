import type { RandomService } from "../random/random-service";

export type SpawnRow = {
  speciesKey: string;
  weight: number;
  minLevel: number;
  maxLevel: number;
};

export function rollWildEncounter(spawns: readonly SpawnRow[], rng: RandomService): {
  speciesKey: string;
  level: number;
} {
  if (spawns.length === 0) {
    return { speciesKey: "florune", level: 1 };
  }
  const total = spawns.reduce((sum, row) => sum + row.weight, 0);
  let ticket = rng.nextInt(1, Math.max(1, total));
  for (const row of spawns) {
    ticket -= row.weight;
    if (ticket <= 0) {
      return {
        speciesKey: row.speciesKey,
        level: rng.nextInt(row.minLevel, row.maxLevel),
      };
    }
  }
  const last = spawns[spawns.length - 1]!;
  return { speciesKey: last.speciesKey, level: last.minLevel };
}
