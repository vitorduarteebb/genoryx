export const authConfig = {
  accessTtl: "15m",
  refreshTtl: "7d",
  passwordMinLength: 8,
  passwordMaxLength: 128,
  emailMaxLength: 254,
  characterNameMinLength: 3,
  characterNameMaxLength: 20,
  creatureNameMinLength: 3,
  creatureNameMaxLength: 16,
  defaultCharacterClass: "HUNTER",
  rateLimit: {
    register: { ttlMs: 60_000, limit: 10 },
    login: { ttlMs: 60_000, limit: 15 },
    refresh: { ttlMs: 60_000, limit: 30 },
  },
} as const;

export function parseDurationMs(value: string): number {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(value);
  if (!match) {
    throw new Error(`Invalid duration: ${value}`);
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers = { ms: 1, s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 } as const;
  return amount * multipliers[unit as keyof typeof multipliers];
}
