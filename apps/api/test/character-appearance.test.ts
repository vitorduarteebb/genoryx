import { defaultCharacterAppearance, parseCharacterAppearance } from "@nexora/config";
import { describe, expect, it } from "vitest";

describe("parseCharacterAppearance", () => {
  it("usa o padrão FASE 1 quando o payload é vazio", () => {
    expect(parseCharacterAppearance(null)).toEqual(defaultCharacterAppearance);
  });

  it("aceita IDs válidos e descarta IDs desconhecidos", () => {
    const parsed = parseCharacterAppearance({
      hairColor: "blonde",
      skinTone: "bronze",
      chestId: "not-a-real-chest",
      gold: 9999,
    });
    expect(parsed.hairColor).toBe("blonde");
    expect(parsed.skinTone).toBe("bronze");
    expect(parsed.chestId).toBe(defaultCharacterAppearance.chestId);
    expect(parsed).not.toHaveProperty("gold");
  });
});
