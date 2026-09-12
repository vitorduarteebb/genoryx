export type EconomyProfileName = "alpha" | "production";
export type EncounterTier = "WILD" | "ELITE" | "BOSS";
export type PvpEconomyMode = "CASUAL" | "COMPETITIVE";

export const economyLedgerSources = {
  QUEST_REWARD: "QUEST_REWARD",
  PVE_REWARD: "PVE_REWARD",
  PVP_REWARD: "PVP_REWARD",
  BREEDING_COST: "BREEDING_COST",
  SHOP_PURCHASE: "SHOP_PURCHASE",
  MARKET_LISTING_FEE: "MARKET_LISTING_FEE",
  MARKET_SALE: "MARKET_SALE",
  MARKET_FEE: "MARKET_FEE",
  CRAFT_COST: "CRAFT_COST",
  SYSTEM_GRANT: "SYSTEM_GRANT",
  SYSTEM_SINK: "SYSTEM_SINK",
  ADMIN_ADJUSTMENT: "ADMIN_ADJUSTMENT",
} as const;

export type EconomyLedgerSource = (typeof economyLedgerSources)[keyof typeof economyLedgerSources];

export const economyFaucetSources = [
  economyLedgerSources.PVE_REWARD,
  economyLedgerSources.PVP_REWARD,
] as const;

export const genomeCatalystKey = "genome_catalyst";
export const economySystemEmail = "system@genoryx.internal";

const alpha = {
  starting: { gold: 100_000, nex: 0, nexOrbs: 0, nexOrbPlus: 0 },
  nex: { enabled: false, emissionEnabled: false },
  dailyGoldRewardBudget: 800,
  pveGold: {
    WILD: { min: 12, max: 25 },
    ELITE: { min: 40, max: 80 },
    BOSS: { min: 120, max: 250 },
  },
  pveCatalystChance: {
    WILD: 0.08,
    ELITE: 0.25,
    BOSS: 0.6,
  },
  questGold: { min: 50, max: 300 },
  tutorial: {
    questKey: "first-spark",
    gold: 300,
    nexOrbs: 5,
    catalysts: 1,
  },
  captureQuest: {
    gold: 180,
    nexOrbs: 3,
    xp: 40,
  },
  pvp: {
    casualGold: 0,
    competitiveGoldPerWin: 20,
  },
  breeding: {
    baseGold: 250,
    priorBreedWeight: 0.4,
    catalystRequired: 1,
  },
  market: {
    listingFeePercent: 1,
    listingFeeMinGold: 5,
    saleFeePercent: 5,
  },
  shop: {
    nexOrb: 40,
    nexOrbPlus: 120,
    nexOrbUltra: 350,
    nexOrbAncient: 1000,
  },
  forbiddenShopKeys: [
    "stat_gene",
    "power_reroll",
    "guaranteed_mutation",
    "perfect_dna",
    "growth_xp",
    "maturation_xp",
    "instant_evolve",
    "instant_evolution",
  ],
} as const;

/** Números de produção ainda não decididos — espelho estrutural do Alpha. */
const production = {
  ...alpha,
} as const;

export const economyProfiles = {
  alpha,
  production,
} as const;

export type EconomyNumbers = typeof alpha;

export function economyProfileName(): EconomyProfileName {
  return process.env.ECONOMY_PROFILE === "production" || process.env.RELEASE_CHANNEL === "production"
    ? "production"
    : "alpha";
}

export function activeEconomy(): EconomyNumbers {
  return economyProfiles[economyProfileName()];
}

const active = activeEconomy();

/** Facade estável. Números vêm do profile ativo em `@nexora/config` (`packages/config/src/economy.ts`). */
export const economyConfig = {
  marketFeePercent: active.market.saleFeePercent,
  marketUnlockLevel: 8,
  startingGold: active.starting.gold,
  startingNex: active.starting.nex,
  systemUserEmail: economySystemEmail,
  ledgerSources: economyLedgerSources,
} as const;
