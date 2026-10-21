import { genomeV2 } from "@nexora/config";
import type { GeneRank } from "@nexora/types";
import { createSeededRandom } from "../../random/random-service";
import { hitChance, resolveStrike } from "./resolve";
import { hydrateGenomeProfile } from "./profile";
import type { Combatant } from "../types";

export type GenomeSimReport = {
  seeds: number[];
  strikes: number;
  hits: number;
  misses: number;
  crits: number;
  physicalVsDef: number;
  magicVsRes: number;
  notes: string[];
};

function unit(id: string, genes: Record<string, string>, stats: Partial<Combatant> = {}): Combatant {
  return {
    id,
    name: id,
    speciesKey: "sim",
    element: "ELECTRIC",
    hp: 100,
    maxHp: 100,
    shield: 0,
    atk: 40,
    def: 20,
    mag: 40,
    res: 20,
    spd: 80,
    crit: 0.05,
    tags: [],
    statuses: [],
    slot: "FRONT",
    genes,
    ...stats,
  };
}

const physical = hydrateGenomeProfile({
  key: "sim_phys",
  name: "Golpe",
  type: "ATTACK",
  cost: 1,
  element: "EARTH",
  targetType: "ENEMY",
  tags: ["PHYSICAL"],
  effects: [{ op: "DAMAGE", value: 10 }],
});

const magic = hydrateGenomeProfile({
  key: "sim_mag",
  name: "Labareda",
  type: "ATTACK",
  cost: 1,
  element: "FIRE",
  targetType: "ENEMY",
  tags: ["MAGIC"],
  effects: [{ op: "DAMAGE", value: 10 }],
});

export function simulateGenomeMatchups(count = 24, seed = 9043): GenomeSimReport {
  const seeds: number[] = [];
  let hits = 0;
  let misses = 0;
  let crits = 0;
  let strikes = 0;
  let physicalVsDef = 0;
  let magicVsRes = 0;
  for (let i = 0; i < count; i += 1) {
    const matchSeed = seed + i * 17;
    seeds.push(matchSeed);
    const rng = createSeededRandom(matchSeed);
    const prec: GeneRank = i % 3 === 0 ? "S" : "C";
    const eva: GeneRank = i % 3 === 0 ? "C" : "S";
    const actor = unit("a", { PRECISION: prec, EVASION: "C", CRIT: "C", CRIT_DAMAGE: "S", ATK: "S", MAG: "A", STATUS: "S", DEF: "C", RES: "C", HP: "C", SPD: "C" }, { crit: 0.14, atk: 80, mag: 70 });
    const target = unit("b", { PRECISION: "C", EVASION: eva, DEF: "S", RES: "F", CRIT: "C", CRIT_DAMAGE: "C", ATK: "C", MAG: "C", STATUS: "C", HP: "A", SPD: "C" }, { def: 80, res: 8 });
    const phys = resolveStrike({ actor, target: { ...target, statuses: [] }, profile: physical, flat: 10, elementMul: 1, hostile: true, rng });
    const mag = resolveStrike({ actor, target: { ...target, statuses: [], heavyGuardUsed: false }, profile: magic, flat: 10, elementMul: 1, hostile: true, rng });
    for (const row of [phys, mag]) {
      strikes += 1;
      if (row.missed) misses += 1;
      else hits += 1;
      if (row.crit) crits += 1;
    }
    if (!phys.missed) physicalVsDef += phys.damage;
    if (!mag.missed) magicVsRes += mag.damage;
    void genomeV2;
    void hitChance;
  }
  return {
    seeds,
    strikes,
    hits,
    misses,
    crits,
    physicalVsDef,
    magicVsRes,
    notes: [
      "Relatório para decisão humana. Sem ajuste automático.",
      `Acertos ${hits}/${strikes}. Esquivas ${misses}. Críticos ${crits}.`,
      `Dano físico acumulado contra DEF S: ${physicalVsDef}. Dano mágico acumulado contra RES F: ${magicVsRes}.`,
    ],
  };
}
