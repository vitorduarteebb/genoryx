import { describe, expect, it } from "vitest";
import { resolveCardFrameSrc, resolveElementPresentation } from "./element-presentation";

describe("resolveElementPresentation", () => {
  it("EARTH não reutiliza Nature", () => {
    const earth = resolveElementPresentation("EARTH");
    const nature = resolveElementPresentation("NATURE");
    expect(earth.frameSrc).toBe("/card-frames/EarthCardFrame.svg");
    expect(earth.iconSrc).toBe("/card-icons/earth.svg");
    expect(earth.frameSrc).not.toBe(nature.frameSrc);
    expect(earth.iconSrc).not.toBe(nature.iconSrc);
    expect(resolveCardFrameSrc("EARTH", "ULTIMATE")).toBe("/card-frames/EarthUltimateCardFrame.svg");
    expect(resolveCardFrameSrc("EARTH", "SIGNATURE")).toBe("/card-frames/EarthSignatureCardFrame.svg");
  });
});
