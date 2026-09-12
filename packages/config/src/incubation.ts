import type { GenesisGrade } from "@nexora/types";

export const incubationConfig = {
  alpha: {
    COMMON: 0,
    REFINED: 0,
    RARE: 0,
    EXCEPTIONAL: 0,
    GENESIS: 0,
  },
  production: {
    COMMON: 30,
    REFINED: 60,
    RARE: 180,
    EXCEPTIONAL: 480,
    GENESIS: 1080,
  },
} as const;

export type IncubationProfile = keyof typeof incubationConfig;

export function incubationProfile(): IncubationProfile {
  return process.env.INCUBATION_PROFILE === "production" ? "production" : "alpha";
}

export function incubationMinutesForGrade(
  grade: GenesisGrade,
  profile: IncubationProfile = incubationProfile(),
): number {
  return incubationConfig[profile][grade];
}
