export type Vec = { x: number; y: number };
export type Socket = Vec & { r: number };

export type BodyRig = {
  stage: { x: number; y: number; w: number; h: number };
  neck: Socket;
  tail?: Socket;
  caps: Socket[];
  feet: Vec[];
  headScale: number;
  tailScale?: number;
  useTail: boolean;
};

export type HeadRig = {
  plug: Vec;
  eyes: Socket[];
  caps: Socket[];
};

const BIPED_LIKE: BodyRig = {
  stage: { x: 0.16, y: 0.3, w: 0.68, h: 0.62 },
  neck: { x: 0.63, y: 0.1, r: 0.08 },
  tail: { x: 0.17, y: 0.53, r: 0.065 },
  caps: [
    { x: 0.36, y: 0.18, r: 0.05 },
    { x: 0.82, y: 0.22, r: 0.048 },
    { x: 0.36, y: 0.72, r: 0.055 },
    { x: 0.96, y: 0.71, r: 0.048 },
    { x: 0.14, y: 0.97, r: 0.05 },
    { x: 0.87, y: 0.94, r: 0.05 },
    { x: 0.17, y: 0.53, r: 0.048 },
  ],
  feet: [
    { x: 0.14, y: 0.97 },
    { x: 0.87, y: 0.94 },
  ],
  headScale: 0.62,
  useTail: false,
};

const QUAD_LIKE: BodyRig = {
  stage: { x: 0.04, y: 0.34, w: 0.92, h: 0.52 },
  neck: { x: 0.84, y: 0.12, r: 0.075 },
  tail: { x: 0.16, y: 0.44, r: 0.06 },
  caps: [
    { x: 0.09, y: 0.93, r: 0.07 },
    { x: 0.47, y: 0.86, r: 0.07 },
    { x: 0.73, y: 0.95, r: 0.075 },
    { x: 0.96, y: 0.93, r: 0.075 },
  ],
  feet: [
    { x: 0.09, y: 0.93 },
    { x: 0.47, y: 0.86 },
    { x: 0.73, y: 0.95 },
    { x: 0.96, y: 0.93 },
  ],
  headScale: 0.46,
  tailScale: 0.38,
  useTail: true,
};

const BODY_RIGS: Record<string, BodyRig> = {
  "body/biped.png": BIPED_LIKE,
  "body/biped-armored.png": BIPED_LIKE,
  "body/biped-raptor.png": {
    ...BIPED_LIKE,
    neck: { x: 0.54, y: 0.16, r: 0.075 },
    headScale: 0.52,
  },
  "body/biped-heavy.png": {
    stage: { x: 0.14, y: 0.26, w: 0.72, h: 0.68 },
    neck: { x: 0.65, y: 0.08, r: 0.075 },
    caps: [
      { x: 0.34, y: 0.18, r: 0.07 },
      { x: 0.91, y: 0.22, r: 0.065 },
      { x: 0.23, y: 0.97, r: 0.07 },
      { x: 0.93, y: 0.96, r: 0.07 },
    ],
    feet: [
      { x: 0.23, y: 0.97 },
      { x: 0.93, y: 0.96 },
    ],
    headScale: 0.58,
    useTail: false,
  },
  "body/quadruped.png": QUAD_LIKE,
  "body/quadruped-dorsal.png": { ...QUAD_LIKE, headScale: 0.38, neck: { x: 0.7, y: 0.24, r: 0.07 } },
  "body/quadruped-socket.png": {
    stage: { x: 0.1, y: 0.24, w: 0.8, h: 0.66 },
    neck: { x: 0.5, y: 0.16, r: 0.075 },
    caps: [
      { x: 0.28, y: 0.28, r: 0.06 },
      { x: 0.72, y: 0.28, r: 0.06 },
      { x: 0.3, y: 0.92, r: 0.06 },
      { x: 0.7, y: 0.92, r: 0.06 },
    ],
    feet: [
      { x: 0.3, y: 0.92 },
      { x: 0.7, y: 0.92 },
    ],
    headScale: 0.46,
    useTail: false,
  },
  "body/aquatic.png": {
    stage: { x: 0.08, y: 0.28, w: 0.84, h: 0.62 },
    neck: { x: 0.68, y: 0.12, r: 0.075 },
    caps: [
      { x: 0.41, y: 0.26, r: 0.055 },
      { x: 0.85, y: 0.24, r: 0.055 },
    ],
    feet: [],
    headScale: 0.56,
    useTail: false,
  },
  "body/serpentine.png": {
    stage: { x: 0.06, y: 0.22, w: 0.88, h: 0.68 },
    neck: { x: 0.62, y: 0.16, r: 0.07 },
    caps: [{ x: 0.76, y: 0.47, r: 0.06 }],
    feet: [],
    headScale: 0.4,
    useTail: false,
  },
  "body/spectral.png": {
    stage: { x: 0.16, y: 0.22, w: 0.68, h: 0.68 },
    neck: { x: 0.67, y: 0.12, r: 0.07 },
    caps: [
      { x: 0.37, y: 0.24, r: 0.065 },
      { x: 0.78, y: 0.26, r: 0.06 },
    ],
    feet: [],
    headScale: 0.48,
    useTail: false,
  },
  "body/hexaped.png": {
    stage: { x: 0.08, y: 0.26, w: 0.84, h: 0.64 },
    neck: { x: 0.5, y: 0.16, r: 0.07 },
    caps: [],
    feet: [],
    headScale: 0.42,
    useTail: false,
  },
  "body/myriapod.png": {
    stage: { x: 0.08, y: 0.28, w: 0.84, h: 0.58 },
    neck: { x: 0.5, y: 0.2, r: 0.065 },
    caps: [],
    feet: [],
    headScale: 0.4,
    useTail: false,
  },
};

const HEAD_RIGS: Record<string, HeadRig> = {
  "head/exotic.png": {
    plug: { x: 0.45, y: 1.12 },
    eyes: [{ x: 0.69, y: 0.42, r: 0.038 }],
    caps: [
      { x: 0.49, y: 0.2, r: 0.05 },
      { x: 0.8, y: 0.27, r: 0.045 },
      { x: 0.45, y: 0.81, r: 0.055 },
    ],
  },
  "head/draconic.png": {
    plug: { x: 0.4, y: 1.12 },
    eyes: [{ x: 0.58, y: 0.32, r: 0.042 }],
    caps: [{ x: 0.58, y: 0.32, r: 0.05 }],
  },
  "head/serpent.png": {
    plug: { x: 0.4, y: 1.1 },
    eyes: [{ x: 0.65, y: 0.4, r: 0.04 }],
    caps: [{ x: 0.65, y: 0.4, r: 0.048 }],
  },
  "head/beast.jpg": {
    plug: { x: 0.48, y: 1.12 },
    eyes: [{ x: 0.64, y: 0.31, r: 0.04 }],
    caps: [
      { x: 0.64, y: 0.31, r: 0.05 },
      { x: 0.31, y: 0.13, r: 0.045 },
    ],
  },
};

const TAIL_PLUG: Record<string, Vec> = {
  "tail/predator.png": { x: 0.78, y: 0.16 },
  "tail/blade.png": { x: 0.76, y: 0.18 },
  "tail/heavy.png": { x: 0.78, y: 0.18 },
};

export function bodyRigFor(rel: string): BodyRig {
  return BODY_RIGS[rel] ?? BIPED_LIKE;
}

export function headRigFor(rel: string): HeadRig {
  return (
    HEAD_RIGS[rel] ?? {
      plug: { x: 0.46, y: 0.72 },
      eyes: [{ x: 0.58, y: 0.36, r: 0.04 }],
      caps: [],
    }
  );
}

export function tailPlugFor(rel: string): Vec {
  return TAIL_PLUG[rel] ?? { x: 0.78, y: 0.18 };
}
