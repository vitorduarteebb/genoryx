import { describe, expect, it } from "vitest";
import { computeMaturationGrant, diversityShare, participationScore } from "./maturation";

describe("maturation", () => {
  it("participation nunca zera e não passa de 1", () => {
    expect(
      participationScore({
        cardsPlayed: 0,
        damage: 0,
        healing: 0,
        shield: 0,
        control: 0,
        roundsAlive: 0,
        battleRounds: 4,
        present: true,
      }),
    ).toBeGreaterThanOrEqual(0.25);
    expect(
      participationScore({
        cardsPlayed: 6,
        damage: 40,
        healing: 10,
        shield: 8,
        control: 1,
        roundsAlive: 4,
        battleRounds: 4,
        present: true,
      }),
    ).toBeLessThanOrEqual(1);
  });

  it("cura e controle contam como suporte", () => {
    const heal = participationScore({
      cardsPlayed: 1,
      damage: 0,
      healing: 12,
      shield: 0,
      control: 0,
      roundsAlive: 4,
      battleRounds: 4,
      present: true,
    });
    const idle = participationScore({
      cardsPlayed: 0,
      damage: 0,
      healing: 0,
      shield: 0,
      control: 0,
      roundsAlive: 4,
      battleRounds: 4,
      present: true,
    });
    expect(heal).toBeGreaterThan(idle);
  });

  it("diversidade reduz mas não zera", () => {
    expect(diversityShare(0)).toBe(1);
    expect(diversityShare(10)).toBe(0.7);
    expect(diversityShare(21)).toBe(0.4);
    expect(diversityShare(10_000)).toBeGreaterThan(0);
  });

  it("elite e boss pagam mais que common", () => {
    const common = computeMaturationGrant({
      family: "COMMON",
      won: true,
      participation: 1,
      killsTodayOfSpecies: 0,
      firstVictoryInBiome: false,
    });
    const elite = computeMaturationGrant({
      family: "ELITE",
      won: true,
      participation: 1,
      killsTodayOfSpecies: 0,
      firstVictoryInBiome: false,
    });
    const boss = computeMaturationGrant({
      family: "BOSS",
      won: true,
      participation: 1,
      killsTodayOfSpecies: 0,
      firstVictoryInBiome: false,
    });
    expect(common.amount).toBe(2);
    expect(elite.amount).toBe(10);
    expect(boss.amount).toBe(25);
  });

  it("derrota paga fração config", () => {
    const loss = computeMaturationGrant({
      family: "COMMON",
      won: false,
      participation: 1,
      killsTodayOfSpecies: 0,
      firstVictoryInBiome: false,
    });
    expect(loss.amount).toBe(1);
  });

  it("descoberta no biome aplica bônus", () => {
    const first = computeMaturationGrant({
      family: "COMMON",
      won: true,
      participation: 1,
      killsTodayOfSpecies: 0,
      firstVictoryInBiome: true,
    });
    expect(first.discovery).toBe(true);
    expect(first.amount).toBe(3);
  });
});
