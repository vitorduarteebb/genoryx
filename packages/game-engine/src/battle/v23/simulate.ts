import { generateCreatureBlueprint } from "../../genes/generate";
import { createBattleState } from "../create";
import { pickAiAction, reduceBattle } from "../reduce";
import type { BattleState } from "../types";
import { ensureV23 } from "./resolve";

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
    id: `sim23-${seed}`,
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
  let current = ensureV23(state);
  let guard = 0;
  while (current.status === "ACTIVE" && guard < maxTurns) {
    if (current.magicWar?.open) {
      current = reduceBattle(current, { type: "PASS_PRIORITY" });
      continue;
    }
    const action = pickAiAction(current);
    current = reduceBattle(current, action);
    if (action.type !== "END_TURN" && current.status === "ACTIVE" && !current.magicWar?.open) {
      current = reduceBattle(current, { type: "END_TURN" });
    }
    guard += 1;
  }
  if (current.status === "ACTIVE") {
    current = { ...current, status: "FINISHED", winnerSide: current.sides[0].creatures.some((row) => row.hp > 0) ? 0 : 1 };
  }
  return current;
}

export function simulateCombatV23(count: number) {
  let finished = 0;
  let rounds = 0;
  let wars = 0;
  let direct = 0;
  let opened = 0;
  let manaEnd = 0;
  let starvation = 0;
  let impetus = 0;
  let reaction = 0;
  let counter = 0;
  let prep = 0;
  let channelBreak = 0;
  let fusionStop = 0;
  let cancels = 0;
  let depth = 0;
  for (let i = 0; i < count; i += 1) {
    const end = playOut(seededBattle(2000 + i * 19));
    const metrics = end.combatV23;
    finished += 1;
    rounds += end.round;
    wars += metrics?.magicWarCount ?? 0;
    direct += metrics?.actionsResolvedDirect ?? 0;
    opened += metrics?.actionsOpenedStack ?? 0;
    manaEnd += (end.sides[0].mana ?? 0) + (end.sides[1].mana ?? 0);
    starvation += metrics?.manaStarvation ?? 0;
    impetus += metrics?.impetusUsage ?? 0;
    reaction += metrics?.reactionUsage ?? 0;
    counter += metrics?.counterUsage ?? 0;
    prep += metrics?.preparationActivation ?? 0;
    channelBreak += metrics?.channelInterruption ?? 0;
    fusionStop += metrics?.fusionInterrupt ?? 0;
    cancels += metrics?.stackCancel ?? 0;
    depth += metrics?.magicWarDepth ?? 0;
  }
  const n = Math.max(1, finished);
  return {
    battles: finished,
    avgRounds: rounds / n,
    avgMagicWars: wars / n,
    avgDirectResolves: direct / n,
    avgOpenedStack: opened / n,
    avgManaEnd: manaEnd / n,
    manaStarvation: starvation / n,
    impetusUsage: impetus / n,
    reactionUsage: reaction / n,
    counterUsage: counter / n,
    preparationActivation: prep / n,
    channelInterruption: channelBreak / n,
    fusionInterruption: fusionStop / n,
    stackCancelRate: cancels / n,
    avgMagicWarDepth: wars === 0 ? 0 : depth / Math.max(1, wars),
  };
}
