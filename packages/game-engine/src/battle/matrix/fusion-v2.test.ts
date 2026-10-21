import { describe, expect, it } from "vitest";
import { evaluateMatrixFusion, livingTypologies, poolTypologies } from "./fusion-v2";
import type { BattleUsageEntry } from "./usage";

describe("fusion-v2 pool", () => {
  it("une tipologias vivas com as já jogadas", () => {
    const usage: BattleUsageEntry[] = [
      {
        sequence: 1,
        round: 1,
        side: 0,
        cardKey: "ember",
        typology: "BURN",
        mechanicTags: ["BURN"],
      },
      {
        sequence: 2,
        round: 2,
        side: 0,
        cardKey: "mend",
        typology: "HEAL",
        mechanicTags: ["HEAL"],
      },
    ];
    expect(poolTypologies({ livingTypologies: ["BURN"], usage, side: 0 }).sort()).toEqual(["BURN", "HEAL"]);
  });

  it("mantém Cinzas Vitais depois do KO se HEAL já foi jogada", () => {
    const usage: BattleUsageEntry[] = [
      { sequence: 1, round: 1, side: 0, cardKey: "ember", typology: "BURN", mechanicTags: ["BURN"] },
      { sequence: 2, round: 2, side: 0, cardKey: "mend", typology: "HEAL", mechanicTags: ["HEAL"] },
      { sequence: 3, round: 3, side: 0, cardKey: "ember", typology: "BURN", mechanicTags: ["BURN"] },
      { sequence: 4, round: 4, side: 0, cardKey: "ember", typology: "BURN", mechanicTags: ["BURN"] },
    ];
    const living = livingTypologies([
      { hp: 40, typology: "BURN" },
      { hp: 0, typology: "HEAL" },
    ]);
    expect(living).toEqual(["BURN"]);
    const pool = evaluateMatrixFusion({
      livingTypologies: living,
      usage,
      side: 0,
      round: 5,
      resonance: 4,
      momentum: 0,
      alreadyAwakened: [],
    });
    expect(pool.find((row) => row.familyKey === "VITAL_ASHES")?.ready).toBe(true);
  });
});
