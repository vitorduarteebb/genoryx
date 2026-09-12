import { describe, expect, it } from "vitest";
import { createSeededRandom } from "./random-service";

describe("createSeededRandom", () => {
  it("reproduz a mesma sequência com o mesmo seed", () => {
    const a = createSeededRandom(42);
    const b = createSeededRandom(42);
    const seqA = [a.next(), a.next(), a.nextInt(1, 10), a.chance(0.5)];
    const seqB = [b.next(), b.next(), b.nextInt(1, 10), b.chance(0.5)];
    expect(seqA).toEqual(seqB);
  });

  it("sementes diferentes divergem", () => {
    const a = createSeededRandom(1);
    const b = createSeededRandom(2);
    expect(a.next()).not.toBe(b.next());
  });
});
