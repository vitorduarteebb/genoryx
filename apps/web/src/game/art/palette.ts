import { speciesBattleVisuals } from "@nexora/config";
import type { WorldMapKey } from "@nexora/types";

export const WORLD_COLORS = {
  void: 0x07060c,
  ink: 0x0c0a14,
  gold: 0xe4c36a,
  crystal: 0x7ee0d6,
  ember: 0xff6b35,
  text: 0xf4efe4,
  muted: 0x9a90a8,
  panel: 0x12101c,
  panelEdge: 0x2a2438,
} as const;

export const ELEMENT_COLORS: Record<string, number> = {
  FIRE: 0xff6b35,
  WATER: 0x4ec4d4,
  NATURE: 0x5dbe6e,
  EARTH: 0xc4a06a,
  ELECTRIC: 0xf2d46b,
  ICE: 0xa8d8f0,
  LIGHT: 0xf6e7b0,
  DARK: 0x7a5ea8,
  ARCANE: 0x9b7ee0,
};

export const SPECIES_ELEMENT: Record<string, string> = {
  pyron: "FIRE",
  nympha: "WATER",
  florune: "NATURE",
  terranox: "EARTH",
  drakor: "FIRE",
  aqualis: "WATER",
  voltaris: "ELECTRIC",
  sparkyn: "ELECTRIC",
  grumak: "EARTH",
  cryon: "ICE",
  noctyr: "DARK",
  lumera: "LIGHT",
};

export const MAP_THEME: Record<
  WorldMapKey,
  {
    grass: number;
    grassSpeck: number;
    dirt: number;
    cobble: number;
    water: number;
    waterDeep: number;
    leaf: number;
    dusk: number;
  }
> = {
  haven: {
    grass: 0x2a3a28,
    grassSpeck: 0x3d5340,
    dirt: 0x6b5340,
    cobble: 0x4a4558,
    water: 0x2a5a68,
    waterDeep: 0x163848,
    leaf: 0x4a7a48,
    dusk: 0x1a1428,
  },
  verdantis: {
    grass: 0x0c1610,
    grassSpeck: 0x15241c,
    dirt: 0x2a2218,
    cobble: 0x1c2018,
    water: 0x0e2830,
    waterDeep: 0x071820,
    leaf: 0x1a3024,
    dusk: 0x060a08,
  },
};

export function elementColor(element: string) {
  return ELEMENT_COLORS[element] ?? ELEMENT_COLORS.ARCANE;
}

export function speciesColor(speciesKey: string) {
  return elementColor(SPECIES_ELEMENT[speciesKey] ?? "ARCANE");
}

export function speciesTitle(speciesKey: string) {
  if (!speciesKey) {
    return "Selvagem";
  }
  return speciesBattleVisuals[speciesKey]?.displayName ?? speciesKey.charAt(0).toUpperCase() + speciesKey.slice(1);
}

export function hexCss(value: number) {
  return `#${value.toString(16).padStart(6, "0")}`;
}
