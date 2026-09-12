import { describe, expect, it } from "vitest";
import { marketFeeGold, marketListingFeeGold } from "./market";

describe("market fees", () => {
  it("aplica 5% de venda e devolve o líquido", () => {
    const { fee, net } = marketFeeGold(1000n);
    expect(fee).toBe(50n);
    expect(net).toBe(950n);
  });

  it("listing fee 1% com mínimo 5", () => {
    expect(marketListingFeeGold(1000n)).toBe(10n);
    expect(marketListingFeeGold(50n)).toBe(5n);
    expect(marketListingFeeGold(100n)).toBe(5n);
  });
});
