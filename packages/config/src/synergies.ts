export type SynergyDefinition = {
  key: string;
  name: string;
  requiredTags: readonly string[];
  unlockCardKey: string;
  passive?: string;
};

export const synergyDefinitions: readonly SynergyDefinition[] = [
  {
    key: "LIVING_FURNACE",
    name: "Living Furnace",
    requiredTags: ["BURN", "TANK"],
    unlockCardKey: "molten_armor",
    passive: "Armadura fundida: escudo e queimadura nos atacantes.",
  },
  {
    key: "PLASMA_CORE",
    name: "Plasma",
    requiredTags: ["FIRE", "ELECTRIC"],
    unlockCardKey: "plasma_arc",
  },
  {
    key: "OVERGROWTH",
    name: "Overgrowth",
    requiredTags: ["WATER", "NATURE"],
    unlockCardKey: "overgrowth",
  },
];
