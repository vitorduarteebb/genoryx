import { describe, expect, it } from "vitest";
import { createSeededRandom } from "../random/random-service";
import { clampRewardToBudget, pvpGoldReward, rollPveGold } from "./rewards";

describe("economy rewards", () => {
  it("PvE wild fica na faixa 12–25", () => {
    const rng = createSeededRandom(42);
    for (let i = 0; i < 40; i += 1) {
      const gold = rollPveGold("WILD", rng);
      expect(gold).toBeGreaterThanOrEqual(12);
      expect(gold).toBeLessThanOrEqual(25);
    }
  });

  it("PvP casual é zero e competitivo é 20", () => {
    expect(pvpGoldReward("CASUAL")).toBe(0);
    expect(pvpGoldReward("COMPETITIVE")).toBe(20);
  });

  it("budget diário zera ou corta o faucet", () => {
    expect(clampRewardToBudget(20, 0)).toBe(0);
    expect(clampRewardToBudget(20, 8)).toBe(8);
    expect(clampRewardToBudget(20, 800)).toBe(20);
  });
});
