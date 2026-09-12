import type { RandomService } from "../../random/random-service";

export function recycleDiscard<T>(deck: T[], discard: T[], rng: RandomService): { deck: T[]; discard: T[]; recycled: boolean } {
  if (deck.length > 0 || discard.length === 0) {
    return { deck, discard, recycled: false };
  }
  const pile = [...discard];
  for (let j = pile.length - 1; j > 0; j -= 1) {
    const k = rng.nextInt(0, j);
    const current = pile[j];
    pile[j] = pile[k]!;
    pile[k] = current!;
  }
  return { deck: pile, discard: [], recycled: true };
}
