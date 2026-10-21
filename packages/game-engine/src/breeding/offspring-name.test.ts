import { describe, expect, it } from "vitest";
import { isReservedOffspringName, normalizeOffspringName, uniqueOffspringName } from "./offspring-name";

describe("uniqueOffspringName", () => {
  it("repete o mesmo nome para a mesma semente e o mesmo conjunto ocupado", () => {
    const taken = new Set(["veyara", "solion"]);
    expect(uniqueOffspringName(4242, taken)).toBe(uniqueOffspringName(4242, taken));
  });

  it("pula nome já usado e nunca usa a espécie", () => {
    const first = uniqueOffspringName(7, new Set());
    const second = uniqueOffspringName(7, new Set([normalizeOffspringName(first)]));
    expect(second).not.toBe(first);
    expect(isReservedOffspringName(first)).toBe(false);
    expect(isReservedOffspringName("pyron")).toBe(true);
    expect(normalizeOffspringName(first)).not.toBe(normalizeOffspringName(second));
  });

  it("não devolve o mesmo nome para sementes diferentes na maioria dos casos", () => {
    const names = new Set([1, 2, 3, 4, 5].map((seed) => uniqueOffspringName(seed, new Set())));
    expect(names.size).toBeGreaterThan(1);
  });
});
