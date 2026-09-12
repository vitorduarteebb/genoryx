import { describe, expect, it } from "vitest";
import { createSeededRandom } from "../random/random-service";
import { calculateCaptureChance, rollCapture } from "./chance";

describe("capture", () => {
  it("HP baixo aumenta a chance", () => {
    const high = calculateCaptureChance({ hp: 90, maxHp: 100, orbKey: "nexorb" });
    const low = calculateCaptureChance({ hp: 10, maxHp: 100, orbKey: "nexorb" });
    expect(low).toBeGreaterThan(high);
  });

  it("é determinístico no RandomService", () => {
    const a = rollCapture({ hp: 20, maxHp: 100, orbKey: "nexorb" }, createSeededRandom(3));
    const b = rollCapture({ hp: 20, maxHp: 100, orbKey: "nexorb" }, createSeededRandom(3));
    expect(a).toEqual(b);
  });
});
