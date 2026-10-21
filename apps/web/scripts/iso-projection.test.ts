import assert from "node:assert/strict";
import test from "node:test";
import { dirFromDelta, screenToWorld, worldToScreen } from "../src/lib/iso/projection";
import { havenMap, verdantisMap } from "../src/lib/iso/maps";

test("projeção isométrica é invertível no chão", () => {
  for (const [x, z] of [[0, 0], [2.5, -1.2], [-3, 4.8]] as const) {
    const screen = worldToScreen(x, z);
    const back = screenToWorld(screen.x, screen.y);
    assert.ok(Math.abs(back.x - x) < 1e-9);
    assert.ok(Math.abs(back.z - z) < 1e-9);
  }
});

test("Haven e Green Road têm landmarks, saídas e caminhos", () => {
  const haven = havenMap();
  const road = verdantisMap(true);
  assert.ok(haven.props.some((row) => row.prop === "core" && row.scale === 0.78));
  assert.ok(haven.props.some((row) => row.prop === "houseA"));
  assert.ok(haven.props.some((row) => row.prop === "houseB"));
  assert.ok(haven.props.some((row) => row.prop === "houseC"));
  assert.ok(haven.interactables.some((row) => row.id === "exit.south"));
  assert.ok(haven.marks.some((row) => row.kind === "landmark"));
  assert.ok(road.props.some((row) => row.prop === "waystone"));
  assert.ok(road.props.some((row) => row.prop === "treeVerdA"));
  assert.ok(road.interactables.some((row) => row.id === "wild.florune" && row.element === "NATURE"));
  assert.equal(dirFromDelta(0, 1), "S");
});
