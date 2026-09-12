export const captureConfig = {
  orbKeys: ["nexorb", "nexorb_plus", "nexorb_ultra", "nexorb_ancient"] as const,
  orbPower: {
    nexorb: 1,
    nexorb_plus: 1.35,
    nexorb_ultra: 1.8,
    nexorb_ancient: 2.4,
  },
  baseRate: 0.42,
  minChance: 0.08,
  maxChance: 0.92,
} as const;
