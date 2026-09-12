import { activeEconomy } from "./economy";

const shop = activeEconomy().shop;

export const shopCatalog = [
  { key: "nexorb", name: "NexOrb", priceGold: shop.nexOrb, category: "CONSUMABLES" },
  { key: "nexorb_plus", name: "NexOrb+", priceGold: shop.nexOrbPlus, category: "CONSUMABLES" },
  { key: "nexorb_ultra", name: "NexOrb Ultra", priceGold: shop.nexOrbUltra, category: "CONSUMABLES" },
  { key: "nexorb_ancient", name: "NexOrb Ancient", priceGold: shop.nexOrbAncient, category: "CONSUMABLES" },
] as const;

export const forbiddenShopKeys = activeEconomy().forbiddenShopKeys;
