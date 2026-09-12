import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { verifyAccessToken } from "./verify-access";

const secret = process.env.JWT_ACCESS_SECRET ?? "dev-access-secret";

describe("verifyAccessToken", () => {
  it("aceita access JWT válido", () => {
    const token = jwt.sign({ sub: "user-1", typ: "access" }, secret, { expiresIn: "5m" });
    expect(verifyAccessToken(token).sub).toBe("user-1");
  });

  it("recusa token sem typ=access", () => {
    const token = jwt.sign({ sub: "user-1" }, secret, { expiresIn: "5m" });
    expect(() => verifyAccessToken(token)).toThrow("UNAUTHORIZED");
  });

  it("recusa token vazio", () => {
    expect(() => verifyAccessToken("")).toThrow("UNAUTHORIZED");
  });
});
