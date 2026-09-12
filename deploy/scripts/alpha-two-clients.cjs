/* Two-client check against the public Alpha (HTTPS + WSS). */
const { Client } = require("colyseus.js");

const API = process.env.ALPHA_API_URL ?? "https://srv1568762.hstgr.cloud:8443/api";
const GAME = process.env.ALPHA_GAME_URL ?? "wss://srv1568762.hstgr.cloud:8443/colyseus";
const stamp = Date.now().toString(36);
const password = "AlphaTest9";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function json(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers ?? {}) };
  const res = await fetch(`${API}${path}`, { ...options, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${path} ${res.status} ${JSON.stringify(body)}`);
  }
  return body;
}

async function account(label) {
  const email = `alpha.${label}.${stamp}@nexora.test`;
  await json("/auth/register", { method: "POST", body: JSON.stringify({ email, password }) });
  const session = await json("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  const character = await json("/characters", {
    method: "POST",
    headers: { Authorization: `Bearer ${session.accessToken}` },
    body: JSON.stringify({ name: `Al${label}${stamp.slice(-4)}` }),
  });
  return { email, accessToken: session.accessToken, character };
}

async function walkToward(room, to, durationMs) {
  const started = Date.now();
  let sequence = 1;
  while (Date.now() - started < durationMs) {
    const me = getPlayer(room, room.sessionId);
    if (!me) {
      await wait(50);
      continue;
    }
    const dx = to.x - me.x;
    const dy = to.y - me.y;
    if (Math.hypot(dx, dy) <= 16) {
      return;
    }
    const len = Math.hypot(dx, dy) || 1;
    room.send("MOVE_INPUT", { sequence, directionX: dx / len, directionY: dy / len });
    sequence += 1;
    await wait(50);
  }
}

async function until(predicate, timeoutMs, label) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (predicate()) {
      return;
    }
    await wait(40);
  }
  throw new Error(`timeout: ${label}`);
}

function playerCount(room) {
  const players = room.state?.players;
  if (!players) {
    return 0;
  }
  if (typeof players.size === "number") {
    return players.size;
  }
  return Object.keys(players).length;
}

function getPlayer(room, sessionId) {
  const players = room.state?.players;
  if (!players) {
    return null;
  }
  if (typeof players.get === "function") {
    return players.get(sessionId) ?? null;
  }
  return players[sessionId] ?? null;
}

async function waitPlayers(room, min, timeoutMs, label) {
  if (playerCount(room) >= min) {
    return;
  }
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`timeout: ${label} count=${playerCount(room)} keys=${Object.keys(room.state ?? {})}`));
    }, timeoutMs);
    room.onStateChange(() => {
      if (playerCount(room) >= min) {
        clearTimeout(timer);
        resolve();
      }
    });
  });
}

async function main() {
  const [a, b] = await Promise.all([account("a"), account("b")]);
  const clientA = new Client(GAME);
  const clientB = new Client(GAME);
  const roomA = await clientA.joinOrCreate("haven", { accessToken: a.accessToken });
  await wait(300);
  const roomB = await clientB.joinOrCreate("haven", { accessToken: b.accessToken });
  console.error(`rooms A=${roomA.roomId} B=${roomB.roomId} countA=${playerCount(roomA)} countB=${playerCount(roomB)}`);
  if (roomA.roomId !== roomB.roomId) {
    throw new Error(`salas diferentes: ${roomA.roomId} vs ${roomB.roomId}`);
  }

  await waitPlayers(roomB, 2, 10000, "B sees A in Haven");
  const start = getPlayer(roomB, roomA.sessionId);
  if (!start) {
    throw new Error("B não tem o player de A");
  }
  const startX = Number(start.x);
  const startY = Number(start.y);

  const moving = walkToward(roomA, { x: 420, y: 320 }, 8000);
  await until(() => {
    const remote = getPlayer(roomB, roomA.sessionId);
    return Boolean(remote && (Math.abs(Number(remote.x) - startX) > 8 || Math.abs(Number(remote.y) - startY) > 8));
  }, 8000, "B vê A mover");
  await moving;

  let dialogue = null;
  roomA.onMessage("NPC_DIALOGUE", (payload) => {
    dialogue = payload;
  });
  await until(() => {
    const me = getPlayer(roomA, roomA.sessionId);
    return Boolean(me && Math.hypot(Number(me.x) - 420, Number(me.y) - 320) <= 72);
  }, 4000, "A chega no Professor Kael");
  roomA.send("INTERACT", { npcKey: "professor_kael" });
  await until(() => Boolean(dialogue?.npcKey === "professor_kael"), 4000, "diálogo do NPC");

  let transfer = null;
  roomA.onMessage("MAP_TRANSFER", (payload) => {
    transfer = payload;
  });
  await walkToward(roomA, { x: 2320, y: 780 }, 25000);
  await until(() => {
    const pos = getPlayer(roomA, roomA.sessionId);
    return Boolean(pos && pos.x >= 2260 && pos.y >= 680 && pos.y <= 900);
  }, 4000, "A chega no portal");
  roomA.send("ENTER_MAP", { targetMap: "verdantis" });
  await until(() => transfer?.mapKey === "verdantis", 8000, "portal Haven→Verdantis");

  await wait(400);
  const verdantis = await clientA.joinOrCreate("verdantis", { accessToken: a.accessToken });
  await until(() => Boolean(getPlayer(verdantis, verdantis.sessionId)), 5000, "A entra em Verdantis");
  await verdantis.leave();
  await roomB.leave();

  const persisted = await json("/characters/me", {
    headers: { Authorization: `Bearer ${a.accessToken}` },
  });
  if (persisted.mapKey !== "verdantis") {
    throw new Error(`persistência falhou: mapKey=${persisted.mapKey}`);
  }

  console.log(
    JSON.stringify({
      ok: true,
      api: API,
      game: GAME,
      playerA: a.email,
      playerB: b.email,
      npc: dialogue.name,
      transfer: transfer.mapKey,
      persistedMap: persisted.mapKey,
      persistedX: persisted.posX,
      persistedY: persisted.posY,
    }),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
