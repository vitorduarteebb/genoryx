import assert from "node:assert/strict";
import test from "node:test";
import { adventureExitHref, ADVENTURE_RETURN_KEY, readAdventureReturn, saveAdventureReturn } from "../src/lib/adventure-return";

test("retorno de aventura aponta para o mapa e preserva área", () => {
  const memory = new Map<string, string>();
  const stub = {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.set(key, value);
    },
  };
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: stub });

  assert.equal(adventureExitHref(), "/game/arena");
  saveAdventureReturn({ area: "verdantis", x: -4.2, z: -6.1, wildGone: true, toast: "ok" });
  assert.equal(sessionStorage.getItem(ADVENTURE_RETURN_KEY)?.includes("verdantis"), true);
  const row = readAdventureReturn();
  assert.equal(row?.area, "verdantis");
  assert.equal(row?.wildGone, true);
  assert.equal(adventureExitHref(), "/game/adventure?return=1");
});
