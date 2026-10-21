import assert from "node:assert/strict";
import test from "node:test";
import { havenMap, verdantisMap } from "../src/lib/iso/maps";

test("expansão amplia Haven e Verdantis sem mover spawn nem saída sul", () => {
  const haven = havenMap();
  const road = verdantisMap(true);

  assert.ok(haven.bounds.maxX >= 12);
  assert.ok(haven.bounds.minZ <= -11);
  assert.equal(haven.spawn.x, 0);
  assert.equal(haven.spawn.z, 4.6);
  assert.ok(haven.interactables.some((row) => row.id === "exit.south" && row.x === 0 && row.z === 8.7));
  assert.ok(haven.interactables.some((row) => row.id === "haven.market"));
  const garden = haven.interactables.find((row) => row.id === "haven.garden");
  assert.ok(garden);
  assert.ok(Math.hypot(garden.x - 8, garden.z - 5) > 1, "entrada do jardim não pode ficar em cima do santuário");
  assert.equal(garden.prompt, "Entrar");
  assert.ok(haven.interactables.some((row) => row.id === "haven.residential"));
  assert.ok(haven.npcs.some((row) => row.id === "npc.mira" && row.archetype === "MERCHANT"));
  assert.ok(haven.npcs.some((row) => row.id === "npc.oren" && row.archetype === "RESEARCHER"));
  assert.ok(haven.npcs.some((row) => row.id === "npc.aya" && row.archetype === "BREEDER"));

  assert.ok(road.bounds.maxZ >= 29);
  assert.ok(road.interactables.some((row) => row.id === "verdantis.camp"));
  assert.ok(road.interactables.some((row) => row.id === "verdantis.ruins"));
  assert.ok(road.interactables.some((row) => row.id === "verdantis.canopy"));
  assert.ok(road.interactables.some((row) => row.id === "wild.florune"));
  assert.ok(road.npcs.some((row) => row.archetype === "ADVENTURER"));
  assert.ok(road.npcs.some((row) => row.archetype === "GUARD"));
});
