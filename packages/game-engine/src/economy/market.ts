import { activeEconomy } from "@nexora/config";

export function marketFeeGold(priceGold: bigint): { fee: bigint; net: bigint } {
  const percent = BigInt(activeEconomy().market.saleFeePercent);
  const computed = (priceGold * percent) / 100n;
  const safeFee = computed < 0n ? 0n : computed;
  return { fee: safeFee, net: priceGold - safeFee };
}

export function marketListingFeeGold(priceGold: bigint): bigint {
  const market = activeEconomy().market;
  const raw = (priceGold * BigInt(market.listingFeePercent)) / 100n;
  const min = BigInt(market.listingFeeMinGold);
  if (raw < min) {
    return min;
  }
  return raw;
}
