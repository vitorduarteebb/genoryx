import { describe, expect, it } from "vitest";
import { canonicalPlayTypology, combatMechanicTags } from "./combat-tags";

describe("combat tags", () => {
  it("tipologia da carta vence a função HEAL nas tags", () => {
    expect(canonicalPlayTypology({ typology: "TANK", tags: ["HEAL", "ADVANCED", "draconic"] })).toBe("TANK");
    expect(
      combatMechanicTags({
        typology: "TANK",
        tags: ["HEAL", "ADVANCED", "draconic", "horns", "tail", "TANK"],
      }),
    ).toEqual(["TANK", "ADVANCED"]);
  });

  it("sem tipologia canônica não inventa HEAL a partir da função", () => {
    expect(canonicalPlayTypology({ tags: ["HEAL", "NATURE"] })).toBeUndefined();
    expect(combatMechanicTags({ tags: ["HEAL", "NATURE", "horns"] })).toEqual([]);
  });
});
