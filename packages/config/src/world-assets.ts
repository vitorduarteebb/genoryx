/** World visual catalog. Files live under /world-art/. Gameplay IDs stay in iso/maps. */

export const WORLD_LAYERS = [
  "background",
  "base",
  "architecture",
  "props",
  "actors",
  "foreground",
  "atmosphere",
] as const;

export type WorldLayer = (typeof WORLD_LAYERS)[number];
export type WorldAssetKind = "plate" | "sprite" | "atlas" | "fx";
export type WorldAssetArea = "haven" | "verdantis" | "shared";
export type NpcArchetype = "GUARD" | "MERCHANT" | "RESEARCHER" | "BREEDER" | "ADVENTURER" | "CIVILIAN";

export type WorldAssetDef = {
  id: string;
  area: WorldAssetArea;
  kind: WorldAssetKind;
  layer: WorldLayer;
  src: string;
  src2x?: string;
  status: "READY" | "NEEDS_ART";
  anchorX: number;
  anchorY: number;
  sortOffset: number;
  mobileScale: number;
  desktopScale: number;
  occlusion?: boolean;
  /** Maps iso/maps `prop` keys to this asset. */
  legacyProp?: string;
  world?: { minX: number; maxX: number; minZ: number; maxZ: number };
};

function env(
  id: string,
  area: WorldAssetArea,
  file: string,
  layer: WorldLayer,
  kind: WorldAssetKind,
  extra?: Partial<WorldAssetDef>,
): WorldAssetDef {
  const folder = area === "shared" ? "characters" : `environment/${area}`;
  const src = `/world-art/${folder}/${file}.webp`;
  return {
    id,
    area,
    kind,
    layer,
    src,
    src2x: `/world-art/${folder}/${file}@2x.webp`,
    status: "NEEDS_ART",
    anchorX: 0.5,
    anchorY: 1,
    sortOffset: 0,
    mobileScale: 1,
    desktopScale: 1,
    ...extra,
  };
}

export const worldAssetCatalog: WorldAssetDef[] = [
  env("haven.sky", "haven", "sky", "background", "plate", {
    world: { minX: -8, maxX: 8, minZ: -6, maxZ: 12 },
  }),
  env("haven.plazaBase", "haven", "genesis-plaza-base", "base", "plate", {
    world: { minX: -7.4, maxX: 7.4, minZ: -5.6, maxZ: 10.8 },
  }),
  env("haven.genesisCore", "haven", "genesis-core", "architecture", "sprite", { legacyProp: "core", sortOffset: 8 }),
  env("haven.houseA", "haven", "house-a", "architecture", "sprite", { legacyProp: "houseA", sortOffset: 9, occlusion: true }),
  env("haven.houseB", "haven", "house-b", "architecture", "sprite", { legacyProp: "houseB", sortOffset: 9, occlusion: true }),
  env("haven.houseC", "haven", "house-c", "architecture", "sprite", { legacyProp: "houseC", sortOffset: 9, occlusion: true }),
  env("haven.market", "haven", "market", "architecture", "sprite", { legacyProp: "stall", sortOffset: 6 }),
  env("haven.lyraShrine", "haven", "lyra-shrine", "architecture", "sprite", { legacyProp: "shrine", sortOffset: 7 }),
  env("haven.arenaEntrance", "haven", "arena-entrance", "architecture", "sprite", { legacyProp: "arena", sortOffset: 7 }),
  env("haven.southGate", "haven", "south-gate", "architecture", "sprite", { legacyProp: "gate", sortOffset: 10, occlusion: true }),
  env("haven.bench", "haven", "bench", "props", "sprite", { legacyProp: "bench", sortOffset: 3 }),
  env("haven.lamp", "haven", "lamp", "props", "sprite", { legacyProp: "lamp", sortOffset: 4 }),
  env("haven.banner", "haven", "banner", "props", "sprite", { legacyProp: "banner", sortOffset: 5 }),
  env("haven.crate", "haven", "crate", "props", "sprite", { legacyProp: "crate", sortOffset: 3 }),
  env("haven.planter", "haven", "planter", "props", "sprite", { legacyProp: "planter", sortOffset: 3 }),
  env("haven.treeAncient01", "haven", "tree-ancient-01", "foreground", "sprite", {
    legacyProp: "treeHavenA",
    sortOffset: 12,
    occlusion: true,
  }),
  env("haven.vegetation", "haven", "vegetation", "foreground", "sprite", { legacyProp: "treeS", sortOffset: 11, occlusion: true }),

  env("verdantis.sky", "verdantis", "sky", "background", "plate", {
    world: { minX: -7, maxX: 7, minZ: -2, maxZ: 15 },
  }),
  env("verdantis.roadBase", "verdantis", "green-road-base", "base", "plate", {
    world: { minX: -6.6, maxX: 6.6, minZ: -1.4, maxZ: 14.4 },
  }),
  env("verdantis.forestEdge", "verdantis", "forest-edge", "background", "plate"),
  env("verdantis.tree01", "verdantis", "tree-01", "foreground", "sprite", {
    legacyProp: "treeVerdA",
    sortOffset: 12,
    occlusion: true,
  }),
  env("verdantis.bush", "verdantis", "bush", "props", "sprite", { legacyProp: "bush", sortOffset: 4 }),
  env("verdantis.rock", "verdantis", "rock", "props", "sprite", { legacyProp: "rock", sortOffset: 4 }),
  env("verdantis.roots", "verdantis", "roots", "props", "sprite", { legacyProp: "roots", sortOffset: 3 }),
  env("verdantis.water", "verdantis", "water", "base", "sprite", { legacyProp: "water", sortOffset: 1 }),
  env("verdantis.waystone", "verdantis", "waystone", "architecture", "sprite", { legacyProp: "waystone", sortOffset: 8 }),
  env("verdantis.crystalHollow", "verdantis", "crystal-hollow", "architecture", "sprite", { legacyProp: "hollow", sortOffset: 8 }),

  env("character.tamer", "shared", "tamer-atlas", "actors", "atlas", { anchorY: 0.92 }),
  env("npc.guard", "shared", "npc-guard", "actors", "atlas"),
  env("npc.merchant", "shared", "npc-merchant", "actors", "atlas"),
  env("npc.researcher", "shared", "npc-researcher", "actors", "atlas"),
  env("npc.breeder", "shared", "npc-breeder", "actors", "atlas"),
  env("npc.adventurer", "shared", "npc-adventurer", "actors", "atlas"),
  env("npc.civilian", "shared", "npc-civilian", "actors", "atlas"),
];

const byId = new Map(worldAssetCatalog.map((row) => [row.id, row]));
const byLegacy = new Map(
  worldAssetCatalog.filter((row) => row.legacyProp).map((row) => [row.legacyProp as string, row]),
);

export function worldAssetById(id: string) {
  return byId.get(id);
}

export function worldAssetForProp(prop: string) {
  return byLegacy.get(prop);
}

export function worldAssetsForArea(area: WorldAssetArea | "haven" | "verdantis") {
  return worldAssetCatalog.filter((row) => row.area === area || row.area === "shared");
}

export function worldPlate(area: "haven" | "verdantis", layer: "background" | "base") {
  const id = area === "haven" ? (layer === "base" ? "haven.plazaBase" : "haven.sky") : layer === "base" ? "verdantis.roadBase" : "verdantis.sky";
  return worldAssetById(id);
}

export function npcArchetypeFromRole(role: string): NpcArchetype {
  const key = role.toLowerCase();
  if (key.includes("guarda") || key.includes("guard") || key.includes("portão") || key.includes("portao")) return "GUARD";
  if (key.includes("merc")) return "MERCHANT";
  if (key.includes("pesquisa") || key.includes("research")) return "RESEARCHER";
  if (key.includes("breed") || key.includes("lyra")) return "BREEDER";
  if (key.includes("avent")) return "ADVENTURER";
  return "CIVILIAN";
}

export function npcAssetId(archetype: NpcArchetype) {
  return `npc.${archetype.toLowerCase()}` as const;
}

export const WORLD_ART_PUBLIC_ROOT = "/world-art";
