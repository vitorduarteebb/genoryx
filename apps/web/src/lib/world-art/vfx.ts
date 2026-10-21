import { worldLighting, worldVfxProfiles } from "@nexora/config";

export const lightingProfiles = worldLighting;
export const vfxProfiles = worldVfxProfiles;

export const worldVfxKit = [
  "GenesisMotes",
  "ForestMotes",
  "Dust",
  "Leaves",
  "SoftFog",
  "CrystalGlow",
  "DiscoveryPulse",
  "InteractionGlow",
] as const;

export type WorldVfxId = (typeof worldVfxKit)[number];

export function motesFor(area: "haven" | "verdantis", qualityParticles: number) {
  if (area === "haven") {
    return { id: "GenesisMotes" as const, count: Math.min(12, qualityParticles), color: "#3DE0D0", speed: 0.12 };
  }
  return { id: "ForestMotes" as const, count: Math.min(16, qualityParticles), color: "#8FBF7A", speed: 0.08 };
}
