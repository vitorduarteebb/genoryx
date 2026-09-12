import { worldMaps } from "@nexora/config";
import { describe, expect, it } from "vitest";
import { applyMoveIntent, findPortal, isInsideRect, normalizeInput } from "./movement";

const haven = worldMaps.haven;

describe("world movement", () => {
  it("normaliza diagonal para comprimento 1", () => {
    const dir = normalizeInput(1, 1);
    expect(Math.hypot(dir.x, dir.y)).toBeCloseTo(1, 5);
  });

  it("rejeita input não finito", () => {
    expect(normalizeInput(Number.NaN, 1)).toEqual({ x: 0, y: 0 });
  });

  it("não atravessa collider", () => {
    const wall = haven.colliders[2];
    const start = { x: wall.x - 20, y: wall.y + wall.height / 2 };
    let pos = start;
    for (let i = 0; i < 40; i += 1) {
      pos = applyMoveIntent(pos, 1, 0, haven).position;
    }
    expect(pos.x).toBeLessThan(wall.x + 16);
  });

  it("respeita bounds do mapa", () => {
    const pos = applyMoveIntent({ x: 10, y: 10 }, -1, -1, haven).position;
    expect(pos.x).toBeGreaterThanOrEqual(14);
    expect(pos.y).toBeGreaterThanOrEqual(14);
  });

  it("limita deslocamento por tick à velocidade máxima", () => {
    const start = { x: 400, y: 800 };
    const next = applyMoveIntent(start, 1, 0, haven).position;
    expect(next.x - start.x).toBeLessThanOrEqual(180 / 20 + 0.01);
  });

  it("detecta o portal Haven → Verdantis", () => {
    const zone = haven.portals[0].zone;
    expect(isInsideRect({ x: zone.x + 10, y: zone.y + 10 }, zone)).toBe(true);
    expect(findPortal(haven, { x: zone.x + 10, y: zone.y + 10 })?.targetMap).toBe("verdantis");
    expect(findPortal(haven, { x: 360, y: 720 })).toBeUndefined();
  });
});
