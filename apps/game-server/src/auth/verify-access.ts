import jwt from "jsonwebtoken";

export type AccessClaims = {
  sub: string;
  typ: string;
};

export function verifyAccessToken(token: string): AccessClaims {
  if (!token || typeof token !== "string") {
    throw new Error("UNAUTHORIZED");
  }

  const secret = process.env.JWT_ACCESS_SECRET ?? "dev-access-secret";
  const payload = jwt.verify(token, secret) as { sub?: string; typ?: string };

  if (!payload.sub || payload.typ !== "access") {
    throw new Error("UNAUTHORIZED");
  }

  return { sub: payload.sub, typ: payload.typ };
}
