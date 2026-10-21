import { describe, expect, it } from "vitest";
import { simulateCombatV23 } from "./simulate";

const COUNT = Number(process.env.COMBAT_V23_SIM_COUNT ?? 80);

describe("combat v2.3 simulation", () => {
  it(
    `roda ${COUNT} combates e mede Guerra Mágica`,
    () => {
      const stats = simulateCombatV23(COUNT);
      console.info("combat-v23-sim", JSON.stringify(stats));
      expect(stats.battles).toBe(COUNT);
      expect(stats.avgRounds).toBeGreaterThan(1);
      expect(stats.avgMagicWars).toBeLessThan(8);
    },
    240_000,
  );
});
