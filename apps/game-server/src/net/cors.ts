export function allowedOrigins() {
  const raw = process.env.GAME_SERVER_ALLOWED_ORIGINS ?? process.env.WEB_URL ?? "http://localhost:3000";
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function restrictGameServerOrigins() {
  const { matchMaker } = require("@colyseus/core") as {
    matchMaker: { controller: { getCorsHeaders: (req: { headers?: { origin?: string } }) => Record<string, string> } };
  };
  const allow = allowedOrigins();
  matchMaker.controller.getCorsHeaders = (req: { headers?: { origin?: string } }) => {
    const origin = req.headers?.origin ?? "";
    return {
      "Access-Control-Allow-Origin": allow.includes(origin) ? origin : "null",
    };
  };
}
