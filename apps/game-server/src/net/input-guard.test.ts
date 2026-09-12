import { describe, expect, it } from "vitest";
import { InputGuard } from "./input-guard";

describe("InputGuard", () => {
  it("aceita sequência crescente", () => {
    const guard = new InputGuard();
    expect(guard.accept("a", 1, 1000)).toBe("ok");
    expect(guard.accept("a", 2, 1040)).toBe("ok");
  });

  it("rejeita sequência antiga", () => {
    const guard = new InputGuard();
    guard.accept("a", 5, 1000);
    expect(guard.accept("a", 4, 1010)).toBe("stale");
  });

  it("bloqueia flood", () => {
    const guard = new InputGuard();
    for (let i = 1; i <= 24; i += 1) {
      expect(guard.accept("a", i, 2000)).toBe("ok");
    }
    expect(guard.accept("a", 25, 2000)).toBe("flood");
  });
});
