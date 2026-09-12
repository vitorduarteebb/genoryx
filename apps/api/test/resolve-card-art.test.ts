import { resolveCanonicalCardArt } from "@nexora/config";
import { describe, expect, it } from "vitest";

describe("resolveCanonicalCardArt", () => {
  it("prefere OPENAI READY e versiona a URL", () => {
    const resolved = resolveCanonicalCardArt("vine_tap", "BASE", [
      { status: "READY", provider: "MOCK", publicUrl: "/mock.png", imageHash: "mockhash" },
      { status: "READY", provider: "OPENAI", publicUrl: "/card-art/1/image", imageHash: "abc123def456" },
    ]);
    expect(resolved.source).toBe("openai");
    expect(resolved.artUrl).toBe("/card-art/1/image?v=abc123def456");
  });

  it("cai para fallback READY e depois placeholder", () => {
    const fallback = resolveCanonicalCardArt("vine_tap", "BASE", [
      { status: "READY", provider: "MOCK", publicUrl: "/mock.png", imageHash: "ffff" },
    ]);
    expect(fallback.source).toBe("fallback");
    const empty = resolveCanonicalCardArt("unknown_card", "BASE", []);
    expect(empty.source).toBe("placeholder");
    expect(empty.artUrl).toBeNull();
  });
});
