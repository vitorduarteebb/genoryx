import { describe, expect, it } from "vitest";
import { simulateCombatV15 } from "./simulate";

const COUNT = Number(process.env.COMBAT_SIM_COUNT ?? 200);

describe("combat v1.5 simulation", () => {
  it(
    `roda ${COUNT} combates e mede métricas`,
    () => {
      const stats = simulateCombatV15(COUNT);
      console.info("combat-v15-sim", JSON.stringify(stats));
      expect(stats.count).toBe(COUNT);
      expect(stats.averageBattleLength).toBeGreaterThan(1);
      expect(stats.firstPlayerWinRate).toBeGreaterThan(0);
      expect(stats.firstPlayerWinRate).toBeLessThan(1);
      expect(stats.infiniteLoopDetection).toBe(0);
    },
    2_400_000,
  );
});
