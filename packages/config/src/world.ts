import type { WorldMapKey } from "@nexora/types";

export type Rect = { x: number; y: number; width: number; height: number };

export type WorldNpc = {
  key: string;
  name: string;
  role: string;
  x: number;
  y: number;
  dialogue: string;
};

export type WorldMapDefinition = {
  key: WorldMapKey;
  name: string;
  width: number;
  height: number;
  spawn: { x: number; y: number };
  colliders: Rect[];
  portals: { targetMap: WorldMapKey; zone: Rect; arrival: { x: number; y: number } }[];
  npcs: WorldNpc[];
};

export const worldConfig = {
  tickRate: 20,
  tickMs: 50,
  maxSpeed: 180,
  playerRadius: 14,
  interactRadius: 72,
  persistThrottleMs: 3000,
  maxInputsPerSecond: 24,
  maxSequenceGap: 40,
  canvasWidth: 1280,
  canvasHeight: 720,
} as const;

const havenNpcs: WorldNpc[] = [
  {
    key: "professor_kael",
    name: "Kael",
    role: "professor",
    x: 420,
    y: 320,
    dialogue: "Kael. Traga-me a primeira captura em Verdantis e o código começa de verdade.",
  },
  {
    key: "breeder_lyra",
    name: "Lyra",
    role: "breeder",
    x: 620,
    y: 300,
    dialogue: "Lyra. Dois pais, um ovo. O laboratório está aberto — fertilidade não volta.",
  },
  {
    key: "blacksmith_orin",
    name: "Orin",
    role: "blacksmith",
    x: 780,
    y: 360,
    dialogue: "Orin. A forja espera. Sem aço, só este pedaço de cidade.",
  },
  {
    key: "merchant_theo",
    name: "Theo",
    role: "merchant",
    x: 300,
    y: 400,
    dialogue: "Theo. NexOrb, NexOrb+ e tônico. Gold sai do ledger, não do bolso invisível.",
  },
  {
    key: "arena_master",
    name: "Mestre da Arena",
    role: "arena",
    x: 900,
    y: 280,
    dialogue: "Fila casual. 1v1. Mesmo motor de batalha. Sem ranking nesta versão.",
  },
  {
    key: "genesis_chamber",
    name: "Câmara Genesis",
    role: "chamber",
    x: 540,
    y: 520,
    dialogue: "Câmara Genesis. Aqui o indivíduo cresce — o DNA não muda. Só evolui quem amadureceu no World.",
  },
];

export const worldMaps: Record<WorldMapKey, WorldMapDefinition> = {
  haven: {
    key: "haven",
    name: "Haven",
    width: 2400,
    height: 1600,
    spawn: { x: 360, y: 720 },
    colliders: [
      { x: 200, y: 180, width: 280, height: 90 },
      { x: 980, y: 160, width: 260, height: 100 },
      { x: 640, y: 620, width: 140, height: 140 },
      { x: 1500, y: 240, width: 320, height: 110 },
      { x: 1680, y: 900, width: 220, height: 160 },
    ],
    portals: [
      {
        targetMap: "verdantis",
        zone: { x: 2260, y: 680, width: 120, height: 220 },
        arrival: { x: 160, y: 700 },
      },
    ],
    npcs: havenNpcs,
  },
  verdantis: {
    key: "verdantis",
    name: "Verdantis",
    width: 2000,
    height: 1400,
    spawn: { x: 160, y: 700 },
    colliders: [
      { x: 700, y: 200, width: 360, height: 80 },
      { x: 420, y: 860, width: 200, height: 140 },
    ],
    portals: [
      {
        targetMap: "haven",
        zone: { x: 20, y: 600, width: 100, height: 220 },
        arrival: { x: 2200, y: 780 },
      },
    ],
    npcs: [],
  },
};

export function getWorldMap(key: string): WorldMapDefinition | undefined {
  if (key === "haven" || key === "verdantis") {
    return worldMaps[key];
  }
  return undefined;
}
