export interface RandomService {
  readonly seed: number;
  next(): number;
  nextInt(minInclusive: number, maxInclusive: number): number;
  chance(probability: number): boolean;
  pick<T>(items: readonly T[]): T;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function createSeededRandom(seed: number): RandomService {
  const next = mulberry32(seed);

  return {
    seed,
    next,
    nextInt(minInclusive: number, maxInclusive: number) {
      if (maxInclusive < minInclusive) {
        throw new Error("nextInt: maxInclusive must be >= minInclusive");
      }
      const span = maxInclusive - minInclusive + 1;
      return minInclusive + Math.floor(next() * span);
    },
    chance(probability: number) {
      if (probability <= 0) return false;
      if (probability >= 1) return true;
      return next() < probability;
    },
    pick<T>(items: readonly T[]) {
      if (items.length === 0) {
        throw new Error("pick: empty list");
      }
      return items[Math.floor(next() * items.length)] as T;
    },
  };
}
