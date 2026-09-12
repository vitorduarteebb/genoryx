import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import express from "express";
import { createServer, type Server as HttpServer } from "node:http";
import { restrictGameServerOrigins } from "./net/cors";
import { WorldRoom } from "./rooms/world-room";

export function createGameHttpApp() {
  const app = express();
  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      service: "game-server",
      milestone: "alpha-loop",
      channel: process.env.RELEASE_CHANNEL ?? process.env.NEXT_PUBLIC_RELEASE_CHANNEL ?? process.env.NODE_ENV ?? "dev",
      rooms: ["haven", "verdantis"],
      colyseus: "0.16.24",
    });
  });
  return app;
}

export function createGameServer(
  httpServer: HttpServer,
  options?: { greet?: boolean; gracefullyShutdown?: boolean },
) {
  restrictGameServerOrigins();
  const gameServer = new Server({
    transport: new WebSocketTransport({ server: httpServer }),
    greet: options?.greet ?? true,
    gracefullyShutdown: options?.gracefullyShutdown ?? true,
  });
  gameServer.define("haven", WorldRoom);
  gameServer.define("verdantis", WorldRoom);
  return gameServer;
}
