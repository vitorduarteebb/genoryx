import { Client } from "colyseus.js";
import jwt from "jsonwebtoken";
import { createServer } from "node:http";
import { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@nexora/database";
import { createGameHttpApp, createGameServer } from "../server";

const secret = process.env.JWT_ACCESS_SECRET ?? "dev-access-secret";
const suffix = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

function accessToken(userId: string) {
  return jwt.sign({ sub: userId, typ: "access" }, secret, { expiresIn: "10m" });
}

describe("WorldRoom e2e", () => {
  let port = 0;
  let close: () => Promise<void> = async () => undefined;
  const userIds: string[] = [];

  beforeAll(async () => {
    const app = createGameHttpApp();
    const httpServer = createServer(app);
    const gameServer = createGameServer(httpServer, { greet: false, gracefullyShutdown: false });
    await gameServer.listen(0, "127.0.0.1");
    port = (httpServer.address() as AddressInfo).port;
    close = async () => {
      await gameServer.gracefullyShutdown(false);
    };

    for (const label of ["a", "b"]) {
      const user = await prisma.user.create({
        data: {
          email: `m2-${label}-${suffix}@nexora.test`,
          passwordHash: "not-used",
          character: {
            create: {
              name: `M2${label}${suffix.slice(-4)}`,
              nameNormalized: `m2${label}${suffix.slice(-4)}`,
              mapKey: "haven",
              posX: 0,
              posY: 0,
            },
          },
        },
      });
      userIds.push(user.id);
    }
  });

  afterAll(async () => {
    await close();
    await prisma.character.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  });

  it("expõe /health com Colyseus 0.16.24", async () => {
    const res = await fetch(`http://127.0.0.1:${port}/health`);
    const body = (await res.json()) as { colyseus: string; milestone: string | number };
    expect(res.ok).toBe(true);
    expect(body.colyseus).toBe("0.16.24");
    expect(body.milestone).toBe("alpha-loop");
  });

  it("recusa join sem token", async () => {
    const client = new Client(`ws://127.0.0.1:${port}`);
    await expect(client.joinOrCreate("haven", {})).rejects.toThrow();
  });

  it("recusa characterId arbitrário", async () => {
    const client = new Client(`ws://127.0.0.1:${port}`);
    await expect(
      client.joinOrCreate("haven", { accessToken: accessToken(userIds[0]), characterId: "hack" }),
    ).rejects.toThrow();
  });

  it("dois clientes entram e o movimento do A aparece no B", async () => {
    const clientA = new Client(`ws://127.0.0.1:${port}`);
    const clientB = new Client(`ws://127.0.0.1:${port}`);
    const roomA = await clientA.joinOrCreate("haven", { accessToken: accessToken(userIds[0]) });
    const roomB = await clientB.joinOrCreate("haven", { accessToken: accessToken(userIds[1]) });

    await viWait(() => Number(roomB.state?.players?.size ?? 0) === 2, 3000, () => ({
      keys: roomB.state ? Object.keys(roomB.state) : [],
      players: roomB.state?.players?.size,
    }));

    const startX = Number(roomB.state.players.get(roomA.sessionId)?.x ?? 0);
    for (let sequence = 1; sequence <= 12; sequence += 1) {
      roomA.send("MOVE_INPUT", { sequence, directionX: 1, directionY: 0 });
    }

    await viWait(() => {
      const remote = roomB.state.players.get(roomA.sessionId);
      return Boolean(remote && Number(remote.x) > startX + 8);
    }, 3000);

    await roomA.leave();
    await roomB.leave();

    const persisted = await prisma.character.findFirst({ where: { userId: userIds[0] } });
    expect(persisted?.mapKey).toBe("haven");
    expect(persisted?.posX ?? 0).toBeGreaterThan(startX + 8);
  });
});

async function viWait(predicate: () => boolean, timeoutMs: number, detail?: () => unknown) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (predicate()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 30));
  }
  throw new Error(`timeout waiting for room state ${detail ? JSON.stringify(detail()) : ""}`);
}
