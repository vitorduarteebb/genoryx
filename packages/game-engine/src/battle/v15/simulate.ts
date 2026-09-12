import { generateCreatureBlueprint } from "../../genes/generate";
import { createBattleState } from "../create";
import { pickAiAction, reduceBattle } from "../reduce";
import type { BattleState } from "../types";

const bases = { baseHp: 88, baseAtk: 110, baseDef: 42, baseMag: 80, baseRes: 72, baseSpd: 96 };
const SPECIES = ["pyron", "florune", "noctyr", "terranox", "voltaris"] as const;
const blueprintCache = new Map<string, ReturnType<typeof generateCreatureBlueprint>>();

function cachedBlueprint(seed: number, speciesKey: (typeof SPECIES)[number], origin: "STARTER" | "WILD") {
  const key = `${seed}:${speciesKey}:${origin}`;
  const hit = blueprintCache.get(key);
  if (hit) return hit;
  const row = generateCreatureBlueprint({ seed, speciesKey, origin });
  blueprintCache.set(key, row);
  return row;
}

function seededBattle(seed: number): BattleState {
  return createBattleState({
    id: `sim-${seed}`,
    seed,
    type: "PVE",
    matchMode: "CASUAL",
    sideA: {
      id: "a",
      displayName: "A",
      creatures: [0, 1, 2].map((i) => ({
        blueprint: cachedBlueprint(11 + ((seed + i) % 40), SPECIES[(seed + i) % SPECIES.length]!, "STARTER"),
        bases,
        creatureId: `a${i}`,
      })),
    },
    sideB: {
      id: "b",
      displayName: "B",
      creatures: [0, 1, 2].map((i) => ({
        blueprint: cachedBlueprint(51 + ((seed + i) % 40), SPECIES[(seed + 2 + i) % SPECIES.length]!, "WILD"),
        bases,
        creatureId: `b${i}`,
      })),
    },
  });
}

function playOut(state: BattleState, maxTurns = 24): BattleState {
  let current = state;
  let guard = 0;
  while (current.status === "ACTIVE" && guard < maxTurns) {
    const action = pickAiAction(current);
    current = reduceBattle(current, action);
    if (action.type !== "END_TURN" && current.status === "ACTIVE") {
      current = reduceBattle(current, { type: "END_TURN" });
    }
    guard += 1;
  }
  if (current.status === "ACTIVE") {
    current = { ...current, status: "FINISHED", winnerSide: current.sides[0].creatures.some((row) => row.hp > 0) ? 0 : 1 };
  }
  return current;
}

export function simulateCombatV15(count: number) {
  let firstWins = 0;
  let finished = 0;
  let rounds = 0;
  let chains = 0;
  let resonance = 0;
  let supremes = 0;
  let pressure = 0;
  let hardCc = 0;
  let loops = 0;
  const identityWins: Record<string, number> = {};
  for (let i = 0; i < count; i += 1) {
    const end = playOut(seededBattle(1000 + i * 17));
    if (end.log.filter((row) => row.type === "REJECT" && row.text.includes("loop")).length) {
      loops += 1;
    }
    finished += 1;
    rounds += end.round;
    if (end.winnerSide === 0) firstWins += 1;
    chains += end.sides.reduce((sum, side) => sum + (side.geneticChain?.maxLength ?? 0), 0);
    resonance += end.sides.reduce((sum, side) => sum + (side.teamResonance?.gainedThisBattle ?? 0), 0);
    supremes += end.log.filter((row) => row.type === "SUPREME_READY").length;
    pressure += end.log.filter((row) => row.type === "BATTLE_PRESSURE").length;
    hardCc += end.sides.flatMap((side) => side.creatures).filter((unit) => unit.statuses.some((row) => row.key === "STUN" || row.key === "FREEZE")).length;
    const ident = end.sides[0].creatures[0]?.identityName ?? "none";
    identityWins[ident] = (identityWins[ident] ?? 0) + (end.winnerSide === 0 ? 1 : 0);
  }
  return {
    count: finished,
    averageBattleLength: rounds / Math.max(1, finished),
    firstPlayerWinRate: firstWins / Math.max(1, finished),
    geneticChainFrequency: chains / Math.max(1, finished),
    resonanceFrequency: resonance / Math.max(1, finished),
    supremeActivationRate: supremes / Math.max(1, finished),
    averageBattlePressureTrigger: pressure / Math.max(1, finished),
    hardCcFrequency: hardCc / Math.max(1, finished),
    infiniteLoopDetection: loops,
    identityWins,
  };
}
