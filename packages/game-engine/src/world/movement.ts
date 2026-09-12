import { worldConfig, type Rect, type WorldMapDefinition } from "@nexora/config";

export type Vec = { x: number; y: number };

export function normalizeInput(directionX: number, directionY: number): Vec {
  if (!Number.isFinite(directionX) || !Number.isFinite(directionY)) {
    return { x: 0, y: 0 };
  }

  const clampedX = Math.max(-1, Math.min(1, directionX));
  const clampedY = Math.max(-1, Math.min(1, directionY));
  const length = Math.hypot(clampedX, clampedY);
  if (length <= 0.0001) {
    return { x: 0, y: 0 };
  }

  return { x: clampedX / length, y: clampedY / length };
}

export function facingFromInput(direction: Vec, current: string): string {
  if (Math.abs(direction.x) < 0.01 && Math.abs(direction.y) < 0.01) {
    return current;
  }
  if (Math.abs(direction.x) > Math.abs(direction.y)) {
    return direction.x > 0 ? "right" : "left";
  }
  return direction.y > 0 ? "down" : "up";
}

function circleHitsRect(cx: number, cy: number, radius: number, rect: Rect): boolean {
  const nearestX = Math.max(rect.x, Math.min(cx, rect.x + rect.width));
  const nearestY = Math.max(rect.y, Math.min(cy, rect.y + rect.height));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy < radius * radius;
}

export function clampToBounds(x: number, y: number, map: WorldMapDefinition, radius: number): Vec {
  return {
    x: Math.max(radius, Math.min(map.width - radius, x)),
    y: Math.max(radius, Math.min(map.height - radius, y)),
  };
}

export function resolveColliders(x: number, y: number, map: WorldMapDefinition, radius: number): Vec {
  let next = { x, y };
  for (const rect of map.colliders) {
    if (circleHitsRect(next.x, next.y, radius, rect)) {
      const nearestX = Math.max(rect.x, Math.min(next.x, rect.x + rect.width));
      const nearestY = Math.max(rect.y, Math.min(next.y, rect.y + rect.height));
      const dx = next.x - nearestX;
      const dy = next.y - nearestY;
      const dist = Math.hypot(dx, dy) || 0.0001;
      const push = radius - dist + 0.5;
      next = { x: next.x + (dx / dist) * push, y: next.y + (dy / dist) * push };
    }
  }
  return clampToBounds(next.x, next.y, map, radius);
}

export function applyMoveIntent(
  position: Vec,
  directionX: number,
  directionY: number,
  map: WorldMapDefinition,
  dtSeconds = 1 / worldConfig.tickRate,
  speed = worldConfig.maxSpeed,
  radius = worldConfig.playerRadius,
): { position: Vec; facing: string; moved: boolean } {
  const cappedDt = Math.max(0, Math.min(dtSeconds, 1 / worldConfig.tickRate + 0.01));
  const direction = normalizeInput(directionX, directionY);
  const next = {
    x: position.x + direction.x * speed * cappedDt,
    y: position.y + direction.y * speed * cappedDt,
  };
  const resolved = resolveColliders(next.x, next.y, map, radius);
  return {
    position: resolved,
    facing: facingFromInput(direction, "down"),
    moved: direction.x !== 0 || direction.y !== 0,
  };
}

export function distance(a: Vec, b: Vec): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function isInsideRect(point: Vec, rect: Rect): boolean {
  return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
}

export function findPortal(map: WorldMapDefinition, position: Vec) {
  return map.portals.find((portal) => isInsideRect(position, portal.zone));
}
