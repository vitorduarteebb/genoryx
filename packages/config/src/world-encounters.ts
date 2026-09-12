import type { EncounterFamily } from "./maturation";

export type MobAggro = "PASSIVE" | "DEFENSIVE" | "AGGRESSIVE";

export type WorldLandmark = {
  key: string;
  name: string;
  mapKey: "haven" | "verdantis";
  x: number;
  y: number;
};

export type WorldMobSpawnDef = {
  spawnKey: string;
  mapKey: "haven" | "verdantis";
  speciesKey: string;
  family: EncounterFamily;
  aggro: MobAggro;
  level: number;
  x: number;
  y: number;
  patrol?: { x: number; y: number }[];
};

export const verdantisLandmarks: readonly WorldLandmark[] = [
  { key: "haven_gate", name: "Haven Gate", mapKey: "verdantis", x: 160, y: 700 },
  { key: "forest_path", name: "Forest Path", mapKey: "verdantis", x: 480, y: 640 },
  { key: "crystal_clearing", name: "Crystal Clearing", mapKey: "verdantis", x: 820, y: 420 },
  { key: "ancient_ruin", name: "Ancient Ruin", mapKey: "verdantis", x: 1180, y: 280 },
  { key: "river", name: "River", mapKey: "verdantis", x: 900, y: 980 },
  { key: "terranox_territory", name: "Terranox Territory", mapKey: "verdantis", x: 1480, y: 720 },
  { key: "elite_clearing", name: "Elite Clearing", mapKey: "verdantis", x: 1680, y: 380 },
  { key: "next_biome", name: "Portal / next biome", mapKey: "verdantis", x: 1880, y: 700 },
];

export const verdantisMobSpawns: readonly WorldMobSpawnDef[] = [
  { spawnKey: "path_florune_a", mapKey: "verdantis", speciesKey: "florune", family: "COMMON", aggro: "PASSIVE", level: 3, x: 520, y: 610 },
  { spawnKey: "path_florune_b", mapKey: "verdantis", speciesKey: "florune", family: "COMMON", aggro: "DEFENSIVE", level: 4, x: 640, y: 540 },
  { spawnKey: "clearing_nympha", mapKey: "verdantis", speciesKey: "nympha", family: "UNCOMMON", aggro: "PASSIVE", level: 6, x: 860, y: 400 },
  { spawnKey: "ruin_noctyr", mapKey: "verdantis", speciesKey: "noctyr", family: "UNCOMMON", aggro: "AGGRESSIVE", level: 8, x: 1220, y: 310 },
  { spawnKey: "territory_terranox_a", mapKey: "verdantis", speciesKey: "terranox", family: "COMMON", aggro: "DEFENSIVE", level: 7, x: 1400, y: 700 },
  { spawnKey: "territory_terranox_b", mapKey: "verdantis", speciesKey: "terranox", family: "ELITE", aggro: "AGGRESSIVE", level: 12, x: 1560, y: 760 },
  { spawnKey: "elite_terranox", mapKey: "verdantis", speciesKey: "terranox", family: "ELITE", aggro: "AGGRESSIVE", level: 16, x: 1700, y: 400 },
  { spawnKey: "boss_placeholder", mapKey: "verdantis", speciesKey: "terranox", family: "BOSS", aggro: "DEFENSIVE", level: 20, x: 1840, y: 360 },
];

export const worldRespawnConfig = {
  commonMs: 45_000,
  uncommonMs: 90_000,
  eliteMs: 180_000,
  bossMs: 600_000,
} as const;
