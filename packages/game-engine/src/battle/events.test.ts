import { describe, expect, it } from "vitest";
import { presentBattleEvents } from "./events";

describe("presentBattleEvents", () => {
  it("mapeia o log do engine para eventos visuais", () => {
    const events = presentBattleEvents([
      { type: "CARD_PLAYED", cardKey: "vine_tap", text: "jogou" },
      { type: "DAMAGE", targetId: "u1", value: 12, text: "dano" },
      { type: "STATUS", targetId: "u1", text: "veneno" },
      { type: "START", text: "começa" },
    ]);
    expect(events.map((row) => row.type)).toEqual(["CARD_PLAYED", "DAMAGE", "STATUS_APPLIED"]);
  });
});
