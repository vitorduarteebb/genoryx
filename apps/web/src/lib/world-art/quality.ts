import { worldQualityPresets, type WorldQualityPresetId } from "@nexora/config";

export function detectWorldQuality(): WorldQualityPresetId {
  if (typeof window === "undefined") return "WORLD_HIGH";
  const narrow = window.innerWidth < 760;
  const coarse = "ontouchstart" in window;
  const cores = navigator.hardwareConcurrency ?? 4;
  if (narrow && cores <= 4) return "WORLD_MOBILE_LOW";
  if (narrow || coarse) return "WORLD_MOBILE_MEDIUM";
  return "WORLD_HIGH";
}

export function worldQuality(id?: WorldQualityPresetId) {
  return worldQualityPresets[id ?? detectWorldQuality()];
}
