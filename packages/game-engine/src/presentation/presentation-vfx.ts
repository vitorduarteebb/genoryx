export type PresentationVfx = {
  rimHex: number;
  keyWarmth: number;
  particleHex: number;
  particleCount: number;
  particleSpeed: number;
  glowIntensity: number;
  floorGlowHex: number;
};

const AURA: Record<string, Partial<PresentationVfx>> = {
  NONE: {},
  EMBER_FIRE: { rimHex: 0xff6b35, particleHex: 0xff8a4a, particleCount: 18, glowIntensity: 0.22, floorGlowHex: 0x4a2010 },
  EMBER: { rimHex: 0xff6b35, particleHex: 0xff8a4a, particleCount: 18, glowIntensity: 0.22, floorGlowHex: 0x4a2010 },
  ELECTRIC_PLASMA: { rimHex: 0x8ad4ff, particleHex: 0xb8e0ff, particleCount: 22, particleSpeed: 0.55, glowIntensity: 0.2 },
  PLASMA: { rimHex: 0x8ad4ff, particleHex: 0xb8e0ff, particleCount: 22, particleSpeed: 0.55, glowIntensity: 0.2 },
  VOID_ARCANE: { rimHex: 0x6a5cff, particleHex: 0x3a2a68, particleCount: 14, particleSpeed: 0.18, glowIntensity: 0.16 },
  GENESIS: { rimHex: 0xe4c36a, particleHex: 0x7ee0d6, particleCount: 16, particleSpeed: 0.28, glowIntensity: 0.18, floorGlowHex: 0x243028 },
};

const MUTATION: Record<string, Partial<PresentationVfx>> = {
  PLASMA: { rimHex: 0x9b7cff, particleHex: 0xc4b0ff, particleCount: 24, particleSpeed: 0.62, glowIntensity: 0.24 },
  MAGMA: { rimHex: 0xff6b35, particleHex: 0xffb060, particleCount: 20, particleSpeed: 0.32, glowIntensity: 0.26, floorGlowHex: 0x3a140c },
  VOID: { rimHex: 0x4a3a88, particleHex: 0x1c1428, particleCount: 12, particleSpeed: 0.12, glowIntensity: 0.14 },
  ANCIENT: { rimHex: 0xe4c36a, particleHex: 0xf4efe4, particleCount: 14, particleSpeed: 0.2, glowIntensity: 0.17 },
};

export function presentationVfx(aura?: string | null, mutation?: string | null): PresentationVfx {
  const base: PresentationVfx = {
    rimHex: 0x7ee0d6,
    keyWarmth: 1,
    particleHex: 0xe4c36a,
    particleCount: 10,
    particleSpeed: 0.22,
    glowIntensity: 0.1,
    floorGlowHex: 0x161018,
  };
  return {
    ...base,
    ...(AURA[aura ?? "NONE"] ?? {}),
    ...(mutation && mutation !== "NONE" ? (MUTATION[mutation] ?? {}) : {}),
  };
}
