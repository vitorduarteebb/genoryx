export type WorldArtProp = { x: number; z: number; prop: string; layer?: number; scale?: number; flip?: boolean };

/** Extra density the World Engineer can append without rewriting interactables. */
export const havenArtDensity: WorldArtProp[] = [
  { x: 5.1, z: 4.2, prop: "houseC", layer: 9 },
  { x: -5.8, z: -0.4, prop: "treeHavenA", layer: 12 },
  { x: 6.4, z: -1.2, prop: "treeHavenB", layer: 12 },
  { x: -4.2, z: 4.8, prop: "treeHavenC", layer: 11 },
  { x: -2.8, z: -4.2, prop: "bushA", layer: 3 },
  { x: 2.6, z: -4.4, prop: "bushA", layer: 3 },
  { x: -1.8, z: 2.2, prop: "flowers", layer: 2 },
  { x: 1.6, z: 2.4, prop: "grassClump", layer: 2 },
  { x: -4.6, z: -3.6, prop: "crate", layer: 3 },
  { x: 4.2, z: -3.8, prop: "log", layer: 3 },
  { x: -5.6, z: -1.4, prop: "banner", layer: 5 },
  { x: -4.6, z: -2.6, prop: "banner", layer: 5 },
  { x: 5.2, z: 0.8, prop: "crystal", layer: 4 },
  { x: 3.2, z: 0.4, prop: "pot", layer: 3 },
  { x: -0.8, z: -4.2, prop: "bench", layer: 3 },
];

export const verdantisArtDensity: WorldArtProp[] = [
  { x: -5.4, z: 4.2, prop: "treeVerdA", layer: 13 },
  { x: 5.6, z: 4.8, prop: "treeVerdB", layer: 13 },
  { x: -4.8, z: 9.4, prop: "treeVerdC", layer: 13 },
  { x: 4.6, z: 9.8, prop: "treeVerdD", layer: 12 },
  { x: -2.8, z: 4.8, prop: "bushB", layer: 4 },
  { x: 2.2, z: 6.2, prop: "grassClump", layer: 2 },
  { x: 1.4, z: 7.8, prop: "flowers", layer: 2 },
  { x: -1.6, z: 7.2, prop: "mushroom", layer: 3 },
  { x: 3.6, z: 3.6, prop: "rocks", layer: 4 },
  { x: -3.2, z: 6.4, prop: "log", layer: 3 },
  { x: -3.8, z: 8.2, prop: "vine", layer: 6 },
  { x: 2.8, z: 10.4, prop: "crystal", layer: 4 },
];

export const worldCompositionTargets = {
  havenPlaza: [
    "player + companion",
    "Genesis Core",
    "1–2 houses",
    "market or shrine edge",
    "path to South Gate",
    "NPC life",
    "foreground vegetation",
  ],
  southGate: ["gate arch", "guards", "road", "forest beyond"],
  greenRoad: ["haven exit", "open edge", "forest path", "waystone", "hollow tease", "deeper canopy"],
} as const;
