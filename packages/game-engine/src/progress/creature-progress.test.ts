import { describe, expect, it } from "vitest";
import { applyCreatureXp, applyMaturationXp, calculateCreatureLevel, canEvolve, evaluateEvolutionStatus, xpToReachLevel } from "./creature-progress";

describe("creature progress", () => {
  it("sobe de nível pelo XP acumulado", () => {
    expect(calculateCreatureLevel(0)).toBe(1);
    expect(calculateCreatureLevel(xpToReachLevel(10))).toBe(10);
    expect(calculateCreatureLevel(xpToReachLevel(20))).toBe(20);
  });

  it("level 10 sem maturation não marca READY", () => {
    const next = applyCreatureXp(
      { level: 9, xp: xpToReachLevel(9), lifeStage: "BABY", evolutionStatus: "NONE", maturationXp: 40 },
      xpToReachLevel(10) - xpToReachLevel(9),
    );
    expect(next.level).toBe(10);
    expect(next.lifeStage).toBe("BABY");
    expect(next.evolutionStatus).toBe("NONE");
    expect(canEvolve(next)).toBe(false);
  });

  it("level + maturation marcam READY_TO_EVOLVE sem mudar lifeStage", () => {
    const leveled = applyCreatureXp(
      { level: 9, xp: xpToReachLevel(9), lifeStage: "BABY", evolutionStatus: "NONE", maturationXp: 100 },
      xpToReachLevel(10) - xpToReachLevel(9),
    );
    expect(leveled.level).toBe(10);
    expect(leveled.evolutionStatus).toBe("READY_TO_EVOLVE");
    expect(leveled.lifeStage).toBe("BABY");
    expect(canEvolve(leveled)).toBe(true);
  });

  it("maturation sozinha no level 8 não libera evolução", () => {
    const next = applyMaturationXp(
      { level: 8, xp: 0, lifeStage: "BABY", evolutionStatus: "NONE", maturationXp: 90 },
      20,
    );
    expect(next.maturationXp).toBe(110);
    expect(next.evolutionStatus).toBe("NONE");
    expect(next.becameReady).toBe(false);
  });

  it("grandfather READY antigo não é resetado", () => {
    expect(
      evaluateEvolutionStatus({
        level: 10,
        xp: 0,
        lifeStage: "BABY",
        evolutionStatus: "READY_TO_EVOLVE",
        maturationXp: 0,
      }),
    ).toBe("READY_TO_EVOLVE");
  });

  it("não evolui Adulto", () => {
    const adult = applyCreatureXp({ level: 25, xp: xpToReachLevel(25), lifeStage: "ADULT", evolutionStatus: "NONE" }, 80);
    expect(adult.lifeStage).toBe("ADULT");
    expect(canEvolve(adult)).toBe(false);
  });
});
