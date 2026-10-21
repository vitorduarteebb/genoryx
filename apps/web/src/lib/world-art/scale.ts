import { worldDisplayScale, worldGroundAnchor } from "@nexora/config";

export const worldActorScale = worldDisplayScale;
export const worldAnchors = worldGroundAnchor;

export function companionWorldOffset() {
  return { x: -0.82, z: 0.62 };
}

export function worldDisplayScaleForStage(stage?: string | null) {
  const key = (stage ?? "ADULT").toUpperCase();
  if (key === "BABY") return worldDisplayScale.companionClamp.baby;
  if (key === "YOUNG" || key === "JUVENILE") return worldDisplayScale.companionClamp.young;
  return worldDisplayScale.companionClamp.adult;
}

export function clampWorldCreatureScale(value: number, wild = false) {
  const range = wild ? worldDisplayScale.wildClamp : worldDisplayScale.companionClamp;
  return Math.min(range.max, Math.max(range.min, value));
}
