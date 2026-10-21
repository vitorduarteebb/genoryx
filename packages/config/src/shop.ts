import { captureConfig } from "./capture";
import { activeEconomy } from "./economy";

const shop = activeEconomy().shop;
const power = captureConfig.orbPower;

export const shopCatalog = [
  {
    key: "nexorb",
    name: "NexOrb",
    priceGold: shop.nexOrb,
    category: "CONSUMABLES",
    rarity: "COMMON",
    capturePower: power.nexorb,
    blurb: "Orbe comum. Serve quando a presa já está no chão.",
  },
  {
    key: "nexorb_plus",
    name: "NexOrb+",
    priceGold: shop.nexOrbPlus,
    category: "CONSUMABLES",
    rarity: "UNCOMMON",
    capturePower: power.nexorb_plus,
    blurb: "Mais firme que o comum. Melhor contra selvagens teimosos.",
  },
  {
    key: "nexorb_ultra",
    name: "NexOrb Ultra",
    priceGold: shop.nexOrbUltra,
    category: "CONSUMABLES",
    rarity: "RARE",
    capturePower: power.nexorb_ultra,
    blurb: "Orbe raro. Theo só recomenda se a luta foi dura.",
  },
  {
    key: "nexorb_ancient",
    name: "NexOrb Ancient",
    priceGold: shop.nexOrbAncient,
    category: "CONSUMABLES",
    rarity: "ANCIENT",
    capturePower: power.nexorb_ancient,
    blurb: "Relíquia da bancada. O melhor selo que o ouro compra.",
  },
] as const;

export const forbiddenShopKeys = activeEconomy().forbiddenShopKeys;
