import { describe, expect, it } from "vitest";
import { calculateElementMultiplier } from "./element-multiplier";

describe("calculateElementMultiplier", () => {
  it("aplica vantagem da água sobre o fogo", () => {
    expect(calculateElementMultiplier("WATER", "FIRE")).toBe(1.25);
    expect(calculateElementMultiplier("FIRE", "WATER")).toBe(0.8);
  });

  it("aplica o ciclo luz / sombrio / arcano", () => {
    expect(calculateElementMultiplier("LIGHT", "DARK")).toBe(1.25);
    expect(calculateElementMultiplier("DARK", "ARCANE")).toBe(1.25);
    expect(calculateElementMultiplier("ARCANE", "LIGHT")).toBe(1.25);
    expect(calculateElementMultiplier("DARK", "LIGHT")).toBe(0.8);
  });

  it("mantém gelo neutro até o GDD definir vantagem", () => {
    expect(calculateElementMultiplier("ICE", "FIRE")).toBe(1);
    expect(calculateElementMultiplier("FIRE", "ICE")).toBe(1);
  });
});
