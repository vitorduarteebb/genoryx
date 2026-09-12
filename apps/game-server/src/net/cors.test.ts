import { describe, expect, it } from "vitest";
import { allowedOrigins } from "./cors";

describe("game-server CORS", () => {
  it("lê origens permitidas da env", () => {
    const previous = process.env.GAME_SERVER_ALLOWED_ORIGINS;
    try {
      process.env.GAME_SERVER_ALLOWED_ORIGINS = "https://alpha.example,https://other.example";
      expect(allowedOrigins()).toEqual(["https://alpha.example", "https://other.example"]);
    } finally {
      process.env.GAME_SERVER_ALLOWED_ORIGINS = previous;
    }
  });
});
