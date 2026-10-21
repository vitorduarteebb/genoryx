/** Visual source of truth for GENORYX world art. Gameplay numbers stay elsewhere. */

export type WorldArtHex = `#${string}`;

export const havenPalette = {
  stonePrimary: "#E8DCC8" as WorldArtHex,
  stoneSecondary: "#C4B196" as WorldArtHex,
  wood: "#5A3A2A" as WorldArtHex,
  roof: "#A84A38" as WorldArtHex,
  goldAccent: "#C9A24A" as WorldArtHex,
  foliage: "#245C38" as WorldArtHex,
  genesisCyan: "#3DE0D0" as WorldArtHex,
  windowGlow: "#FFC45A" as WorldArtHex,
  shadow: "#1A1410" as WorldArtHex,
  ivory: "#F2E8D6" as WorldArtHex,
  terracotta: "#B45C48" as WorldArtHex,
  path: "#A8845A" as WorldArtHex,
  grass: "#3A6E44" as WorldArtHex,
  earthBorder: "#6E5238" as WorldArtHex,
} as const;

export const verdantisPalette = {
  deepGreen: "#163A24" as WorldArtHex,
  forestGreen: "#2A6B3C" as WorldArtHex,
  moss: "#4A7A48" as WorldArtHex,
  earth: "#6B4A2C" as WorldArtHex,
  ancientStone: "#8A8478" as WorldArtHex,
  water: "#3A8A96" as WorldArtHex,
  magicCyan: "#5EE8E0" as WorldArtHex,
  flowerAccent: "#E07A9A" as WorldArtHex,
  fog: "#6A8A72" as WorldArtHex,
  canopyHighlight: "#4C8A58" as WorldArtHex,
  mud: "#4A3424" as WorldArtHex,
} as const;

export const worldLighting = {
  haven: {
    sun: "#FFF1C8",
    sunIntensity: 1.28,
    fill: "#7AA0C4",
    fillIntensity: 0.32,
    shadowTint: "#3A4A62",
    skyTop: "#6E8FB0",
    skyHorizon: "#E2C8A0",
    fog: "rgba(210,196,168,0.18)",
  },
  verdantis: {
    sun: "#E8F0C8",
    sunIntensity: 0.92,
    fill: "#3A6A48",
    fillIntensity: 0.42,
    shadowTint: "#1A2A20",
    skyTop: "#3D5A40",
    skyHorizon: "#8AA56A",
    fog: "rgba(70,100,72,0.26)",
  },
} as const;

export const worldQualityPresets = {
  WORLD_MOBILE_LOW: {
    particles: 8,
    foliageSway: false,
    shadowResolution: 256,
    creatureFps: 8,
    backgroundDetail: 0.35,
    avatarLod: "far" as const,
    vfx: "WorldVfxProfile" as const,
  },
  WORLD_MOBILE_MEDIUM: {
    particles: 18,
    foliageSway: true,
    shadowResolution: 512,
    creatureFps: 12,
    backgroundDetail: 0.7,
    avatarLod: "medium" as const,
    vfx: "WorldVfxProfile" as const,
  },
  WORLD_HIGH: {
    particles: 36,
    foliageSway: true,
    shadowResolution: 1024,
    creatureFps: 20,
    backgroundDetail: 1,
    avatarLod: "near" as const,
    vfx: "WorldVfxProfile" as const,
  },
} as const;

export type WorldQualityPresetId = keyof typeof worldQualityPresets;

export const worldDisplayScale = {
  playerPx: { min: 96, preferred: 118, max: 140 },
  companionClamp: { baby: 0.78, young: 0.92, adult: 1.08, min: 0.7, max: 1.22 },
  wildClamp: { min: 0.74, max: 1.18 },
  coreHeightWorld: 4.2,
  houseA: 1,
  houseB: 1.12,
  houseC: 1.08,
} as const;

export const worldGroundAnchor = {
  tamer: { x: 0.5, y: 0.92 },
  creature: { x: 0.5, y: 0.9 },
  npc: { x: 0.5, y: 0.91 },
  propDefault: { x: 0.5, y: 0.88 },
} as const;

export const worldVfxProfiles = {
  BattleVfxProfile: { aura: 1, motes: 24, pulse: 1, mutation: 1 },
  WorldVfxProfile: { aura: 0.28, motes: 8, pulse: 0.45, mutation: 0.35 },
} as const;

export const worldAssetStatus = ["READY", "TEMP", "PLACEHOLDER", "NEEDS_ART"] as const;
export type WorldAssetStatus = (typeof worldAssetStatus)[number];
