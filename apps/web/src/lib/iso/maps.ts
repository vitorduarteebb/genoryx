import { expandMap } from "./map-expansion";
import { addCaptureWilderness } from "./capture-wilderness";
import { worldLighting } from "@nexora/config";
import type { AdventureAreaId } from "../adventure-return";
import { havenArtDensity, verdantisArtDensity } from "../world-art/composition";
import type { AdventureInteractable } from "./types";

export type IsoTile = { x: number; z: number; tile: string };
export type IsoProp = { x: number; z: number; prop: string; layer?: number; scale?: number; flip?: boolean };
export type IsoNpc = {
  id: string;
  name: string;
  role: string;
  x: number;
  z: number;
  palette: "gold" | "violet" | "steel" | "green";
  archetype: "GUARD" | "MERCHANT" | "RESEARCHER" | "BREEDER" | "ADVENTURER" | "CIVILIAN";
};
export type IsoBounds = { minX: number; maxX: number; minZ: number; maxZ: number };
export type IsoMap = {
  id: AdventureAreaId;
  region: string;
  sky: [string, string];
  fog: string;
  spawn: { x: number; z: number };
  bounds: IsoBounds;
  walk: IsoBounds;
  blocks: Array<{ x: number; z: number; r: number }>;
  tiles: IsoTile[];
  props: IsoProp[];
  npcs: IsoNpc[];
  interactables: AdventureInteractable[];
  marks: Array<{ x: number; z: number; kind: "player" | "path" | "landmark" | "exit" | "poi" | "wild"; label?: string }>;
  discoveries: Array<{ id: string; toast: string; x: number; z: number; r: number }>;
};

function ring(cx: number, cz: number, radius: number, tile: string, step = 0.72): IsoTile[] {
  const out: IsoTile[] = [];
  const count = Math.max(8, Math.round((Math.PI * 2 * radius) / step));
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    out.push({ x: cx + Math.cos(a) * radius, z: cz + Math.sin(a) * radius, tile });
  }
  return out;
}

function fill(minX: number, maxX: number, minZ: number, maxZ: number, tile: string, step = 0.85): IsoTile[] {
  const out: IsoTile[] = [];
  for (let z = minZ; z <= maxZ; z += step) {
    for (let x = minX; x <= maxX; x += step) {
      out.push({ x, z, tile });
    }
  }
  return out;
}

function path(points: Array<[number, number]>, tile: string, width = 1.1): IsoTile[] {
  const out: IsoTile[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, az] = points[i];
    const [bx, bz] = points[i + 1];
    const len = Math.hypot(bx - ax, bz - az);
    const steps = Math.max(2, Math.round(len / 0.55));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const x = ax + (bx - ax) * t;
      const z = az + (bz - az) * t;
      out.push({ x, z, tile });
      const nx = -(bz - az) / Math.max(0.01, len);
      const nz = (bx - ax) / Math.max(0.01, len);
      out.push({ x: x + nx * width * 0.35, z: z + nz * width * 0.35, tile });
    }
  }
  return out;
}

export function havenMap(): IsoMap {
  const tiles = [
    ...fill(-7.2, 7.2, -5.4, 10.6, "grass", 0.9),
    ...fill(-3.4, 3.4, -2.8, 3.2, "stone", 0.7),
    ...ring(0, 0, 2.15, "plaza", 0.55),
    ...ring(0, 0, 3.05, "path", 0.6),
    ...path([[0, 3.1], [0.15, 5.2], [-0.1, 7.1], [0, 8.6]], "path", 1.25),
    ...path([[0, -2.4], [0, -3.8]], "path", 1.1),
    ...path([[-2.6, -0.2], [-4.6, -2]], "path", 0.9),
    ...path([[2.4, 0.2], [4.4, 0.4]], "path", 0.9),
  ];

  const props: IsoProp[] = [
    { x: 0, z: 0, prop: "core", layer: 8, scale: 0.78 },
    { x: -1.7, z: -3.6, prop: "stall", layer: 6 },
    { x: 1.6, z: -3.8, prop: "stall", layer: 6, flip: true },
    { x: 4.7, z: 0.15, prop: "shrine", layer: 7 },
    { x: -5.1, z: -2.1, prop: "arena", layer: 7 },
    { x: 4.4, z: 3.4, prop: "houseA", layer: 9 },
    { x: -4.8, z: 3.2, prop: "houseB", layer: 9 },
    { x: 0, z: 8.7, prop: "gate", layer: 10 },
    { x: -1.7, z: 7.8, prop: "banner", layer: 5 },
    { x: 1.7, z: 7.8, prop: "banner", layer: 5 },
    { x: -2.6, z: 1.6, prop: "planter", layer: 3 },
    { x: 2.5, z: 1.5, prop: "planter", layer: 3 },
    { x: -2.2, z: -1.6, prop: "planter", layer: 3 },
    { x: 2.3, z: -1.5, prop: "bench", layer: 3 },
    { x: -3.3, z: -3.2, prop: "crate", layer: 3 },
    { x: 3.1, z: -3.4, prop: "crate", layer: 3 },
    { x: 3.6, z: 1.8, prop: "pot", layer: 3 },
    { x: -3.8, z: 1.4, prop: "lamp", layer: 4 },
    { x: 3.8, z: -0.8, prop: "lamp", layer: 4 },
    { x: -1.1, z: 4.6, prop: "lamp", layer: 4 },
    { x: 1.2, z: 4.8, prop: "lamp", layer: 4 },
    { x: -5.4, z: 1.2, prop: "treeHavenA", layer: 12 },
    { x: 5.6, z: 1.8, prop: "treeHavenB", layer: 12 },
    { x: -6.2, z: 5.4, prop: "treeHavenC", layer: 11 },
    { x: 6.1, z: 5.8, prop: "treeHavenA", layer: 11 },
    { x: -3.8, z: 6.6, prop: "treeS", layer: 8 },
    { x: 3.6, z: 6.8, prop: "treeS", layer: 8 },
    { x: -2.2, z: -4.6, prop: "treeHavenC", layer: 11 },
    { x: 2.4, z: -4.8, prop: "treeS", layer: 8 },
    { x: 5.2, z: -2.6, prop: "fence", layer: 4 },
    { x: -0.9, z: 2.6, prop: "sign", layer: 3 },
    { x: 0.9, z: 6.2, prop: "crystal", layer: 4 },
    { x: 5.7, z: -2.2, prop: "houseC", layer: 9 },
    ...havenArtDensity.filter((item) => item.prop !== "houseC"),
  ];

  const interactables: AdventureInteractable[] = [
    { id: "npc.theo", name: "Theo", prompt: "Falar", body: "Orbes, tecidos e rumor de rota. O mercado vive aqui.", kind: "npc", x: -1.4, z: -3.2, radius: 1.15 },
    { id: "npc.lyra", name: "Lyra", prompt: "Falar", body: "O shrine lê o pulso. Pesquisa, não milagre.", kind: "npc", x: 4.4, z: 0.5, radius: 1.15 },
    { id: "npc.guard", name: "Guarda", prompt: "Falar", body: "Além do portão começa Verdantis. Volte antes do escuro.", kind: "npc", x: -1.5, z: 7.9, radius: 1.15 },
    { id: "poi.core", name: "Genesis Core", prompt: "Observar", body: "Três anéis de pedra, runas e um cristal irregular. O norte da praça.", kind: "poi", x: 0, z: 0, radius: 1.5 },
    { id: "poi.market", name: "Mercado", prompt: "Observar", body: "Bancadas, lona e o cheiro de rota.", kind: "poi", x: 0, z: -3.6, radius: 1.3 },
    { id: "poi.shrine", name: "Santuário da Lyra", prompt: "Observar", body: "Pesquisa e energia, não altar de fé vazia.", kind: "poi", x: 4.7, z: 0.15, radius: 1.2 },
    { id: "poi.arena", name: "Abordagem da Arena", prompt: "Observar", body: "O círculo fica além. Ainda não é hoje.", kind: "poi", x: -5.1, z: -2.1, radius: 1.2 },
    { id: "exit.south", name: "South Gate", prompt: "Atravessar", body: "A floresta começa logo além do arco.", kind: "exit", payload: "verdantis", x: 0, z: 8.7, radius: 1.45 },
  ];

  return expandMap({
    id: "haven",
    region: "Haven · Genesis Plaza",
    sky: [worldLighting.haven.skyTop, worldLighting.haven.skyHorizon],
    fog: worldLighting.haven.fog,
    spawn: { x: 0, z: 4.6 },
    bounds: { minX: -7.4, maxX: 7.4, minZ: -5.6, maxZ: 10.8 },
    walk: { minX: -5.6, maxX: 5.6, minZ: -4.2, maxZ: 9.2 },
    blocks: [
      { x: 0, z: 0, r: 1.35 },
      { x: 4.4, z: 3.4, r: 1.5 },
      { x: -4.8, z: 3.2, r: 1.5 },
      { x: -1.7, z: -3.6, r: 0.9 },
      { x: 1.6, z: -3.8, r: 0.9 },
      { x: 4.7, z: 0.15, r: 0.85 },
      { x: -5.1, z: -2.1, r: 0.95 },
      { x: 5.7, z: -2.2, r: 1.35 },
    ],
    tiles,
    props,
    npcs: [
      { id: "npc.theo", name: "Theo", role: "mercador", x: -1.4, z: -3.2, palette: "gold", archetype: "MERCHANT" },
      { id: "npc.lyra", name: "Lyra", role: "pesquisa", x: 4.4, z: 0.5, palette: "violet", archetype: "BREEDER" },
      { id: "npc.guard", name: "Guarda", role: "portão", x: -1.5, z: 7.9, palette: "steel", archetype: "GUARD" },
      { id: "npc.guardb", name: "Guarda", role: "portão", x: 1.5, z: 7.9, palette: "steel", archetype: "GUARD" },
      { id: "npc.adventurer", name: "Rook", role: "aventureiro", x: -2.2, z: 5.4, palette: "green", archetype: "ADVENTURER" },
    ],
    interactables,
    marks: [
      { x: 0, z: 0, kind: "landmark", label: "Core" },
      { x: 0, z: -3.6, kind: "poi", label: "Mercado" },
      { x: 4.7, z: 0.15, kind: "poi", label: "Lyra" },
      { x: -5.1, z: -2.1, kind: "poi", label: "Arena" },
      { x: 0, z: 8.7, kind: "exit", label: "Gate" },
      { x: 0, z: 4.6, kind: "path" },
    ],
    discoveries: [
      { id: "haven.plaza", toast: "Genesis Plaza descoberta", x: 0, z: 4.2, r: 2.4 },
      { id: "haven.gate", toast: "South Gate descoberta", x: 0, z: 8.2, r: 1.8 },
    ],
  });
}

export function verdantisMap(wildVisible: boolean): IsoMap {
  const tiles = [
    ...fill(-6.4, 6.4, -1.2, 14.2, "moss", 0.9),
    ...path(
      [
        [0, -0.4],
        [0.35, 1.8],
        [-0.4, 3.6],
        [0.2, 5.4],
        [0.8, 7.2],
        [0.15, 9.2],
        [-0.3, 11.4],
        [0, 13.2],
      ],
      "earth",
      1.15,
    ),
    ...path(
      [
        [0.8, 6.8],
        [2.1, 7.6],
        [3.3, 8.6],
      ],
      "path",
      0.8,
    ),
    ...fill(2.2, 3.4, 1.2, 10.4, "water", 0.7),
  ];

  const props: IsoProp[] = [
    { x: 0.1, z: 5.2, prop: "waystone", layer: 7 },
    { x: -3.6, z: 8.8, prop: "hollow", layer: 8 },
    { x: 3.4, z: 2.4, prop: "crystal", layer: 4 },
    { x: -2.2, z: 3.4, prop: "ruin", layer: 6 },
    { x: -4.6, z: 2.2, prop: "treeVerdA", layer: 12 },
    { x: 4.8, z: 3.2, prop: "treeVerdB", layer: 12 },
    { x: -5.2, z: 6.4, prop: "treeVerdC", layer: 12 },
    { x: 5.1, z: 7.2, prop: "treeVerdD", layer: 11 },
    { x: -3.1, z: 1.1, prop: "treeVerdB", layer: 11 },
    { x: 3.8, z: 5.4, prop: "treeVerdA", layer: 11 },
    { x: -4.2, z: 11.2, prop: "treeVerdC", layer: 12 },
    { x: 4.4, z: 11.6, prop: "treeVerdD", layer: 12 },
    { x: -2.4, z: 12.4, prop: "treeS", layer: 8 },
    { x: 2.2, z: 12.8, prop: "treeS", layer: 8 },
    { x: 1.6, z: 4.2, prop: "treeS", layer: 8 },
    { x: -1.8, z: 6.6, prop: "treeS", layer: 8 },
    { x: 2.6, z: 9.4, prop: "planter", layer: 3 },
    { x: -1.1, z: 9.8, prop: "crate", layer: 3 },
    { x: 0, z: -0.2, prop: "sign", layer: 3 },
    { x: -4.8, z: 13.4, prop: "treeVerdA", layer: 13 },
    { x: 5.2, z: 13.6, prop: "treeVerdC", layer: 13 },
    ...verdantisArtDensity,
  ];

  const interactables: AdventureInteractable[] = [
    { id: "exit.haven", name: "Trilha de Haven", prompt: "Voltar", body: "O portão sul ainda está perto.", kind: "exit", payload: "haven", x: 0, z: -0.2, radius: 1.3 },
    { id: "poi.waystone", name: "Waystone partida", prompt: "Observar", body: "Pedra antiga, musgo e um traço ciano.", kind: "poi", x: 0.1, z: 5.2, radius: 1.2 },
    { id: "poi.hollow", name: "Hollow", prompt: "Olhar para dentro", body: "Há algo além do caminho. Ainda não é dungeon.", kind: "poi", x: -3.6, z: 8.8, radius: 1.3 },
    { id: "poi.crystal", name: "Cristal de borda", prompt: "Colher traço", body: "Um traço de energia. O servidor decide o resto.", kind: "collectable", x: 3.4, z: 2.4, radius: 1.1 },
    { id: "poi.grove", name: "Lumina Grove", prompt: "Olhar a clareira", body: "A luz muda entre as árvores. Ainda um recanto.", kind: "poi", x: -3.2, z: 12.6, radius: 1.2 },
  ];
  if (wildVisible) {
    interactables.push({
      id: "wild.florune",
      name: "Florune",
      prompt: "Aproximar",
      body: "Temperamento curioso. Natureza visível no mapa.",
      kind: "wild",
      payload: "CURIOUS",
      element: "NATURE",
      danger: "Médio",
      temperament: "CURIOUS",
      x: 3.2,
      z: 8.5,
      radius: 1.35,
    });
  }

  return expandMap({
    id: "verdantis",
    region: "Verdantis · Green Road",
    sky: [worldLighting.verdantis.skyTop, worldLighting.verdantis.skyHorizon],
    fog: worldLighting.verdantis.fog,
    spawn: { x: 0, z: 0.8 },
    bounds: { minX: -6.6, maxX: 6.6, minZ: -1.4, maxZ: 14.4 },
    walk: { minX: -4.4, maxX: 4.6, minZ: -0.6, maxZ: 13.4 },
    blocks: [
      { x: 0.1, z: 5.2, r: 0.7 },
      { x: -3.6, z: 8.8, r: 1.1 },
      { x: -2.2, z: 3.4, r: 0.7 },
    ],
    tiles,
    props,
    npcs: [],
    interactables,
    marks: [
      { x: 0, z: -0.2, kind: "exit", label: "Haven" },
      { x: 0.1, z: 5.2, kind: "landmark", label: "Waystone" },
      { x: -3.6, z: 8.8, kind: "poi", label: "Hollow" },
      { x: 3.2, z: 8.5, kind: "wild", label: "Florune" },
      { x: -3.2, z: 12.6, kind: "poi", label: "Grove" },
    ],
    discoveries: [
      { id: "verdantis.road", toast: "Verdantis · Green Road descoberta", x: 0, z: 1.2, r: 2 },
      { id: "verdantis.grove", toast: "Lumina Grove à vista", x: -2.4, z: 12, r: 2.2 },
    ],
  });
}

export function mapFor(area: AdventureAreaId, wildVisible: boolean) {
  return area === "verdantis" ? addCaptureWilderness(verdantisMap(wildVisible)) : havenMap();
}
