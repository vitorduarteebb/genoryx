export type Vec2 = { x: number; z: number };
export type Vec3 = { x: number; y: number; z: number };

/** Convenção GENORYX: o renderer nunca assume o eixo do asset. */
export type CanonicalCreatureForward = Vec2;
export type BattleTeamSide = "FOE" | "YOU";
export type BattleDepth = "FRONT" | "MIDDLE" | "BACK";

export const ART04_CANONICAL_FORWARD: CanonicalCreatureForward = { x: 0, z: 1 };

export const BATTLE_VISUAL = {
  minHeight: 0.76,
  preferredHeight: 1.02,
  maxHeight: 1.32,
  groundNdcY: -0.82,
  fill: 0.72,
  /** Leve virada para a câmera: perfil ¾, nunca traseira. */
  faceCamera: 0.34,
} as const;

export function isLevitatingPlan(bodyPlan?: string | null) {
  return bodyPlan === "FLOATING";
}

export function detectCanonicalForward(head: Vec2, hips: Vec2): CanonicalCreatureForward {
  const x = head.x - hips.x;
  const z = head.z - hips.z;
  const len = Math.hypot(x, z);
  if (len < 1e-4) return { ...ART04_CANONICAL_FORWARD };
  return { x: x / len, z: z / len };
}

export function yawToAlignForward(forward: CanonicalCreatureForward, desired: Vec2) {
  return Math.atan2(desired.x, desired.z) - Math.atan2(forward.x, forward.z);
}

/**
 * Câmera do espectador em +Z.
 * Inimigo (esquerda) olha para +X (direita da tela).
 * Jogador (direita) olha para −X (esquerda da tela).
 */
export function battleDesiredHeading(side: BattleTeamSide): Vec2 {
  const towardCamera = BATTLE_VISUAL.faceCamera;
  return side === "FOE" ? { x: 1, z: towardCamera } : { x: -1, z: towardCamera };
}

export function battleActorYaw(forward: CanonicalCreatureForward, side: BattleTeamSide) {
  return yawToAlignForward(forward, battleDesiredHeading(side));
}

export function rotateYaw(vector: Vec2, yaw: number): Vec2 {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  return { x: vector.x * c + vector.z * s, z: -vector.x * s + vector.z * c };
}

export function battleGroundOffset(minY: number, levitating: boolean, height: number) {
  const hover = levitating ? Math.max(0.05, height * 0.08) : 0;
  return hover - minY;
}

export function resolveBattleDepth(slot?: string | null): BattleDepth {
  if (slot === "FRONT") return "FRONT";
  if (slot === "MIDDLE") return "MIDDLE";
  return "BACK";
}

export function battleDepthPresentation(depth: BattleDepth) {
  if (depth === "FRONT") return { scale: 1.06, lift: 0, zIndex: 4 };
  if (depth === "MIDDLE") return { scale: 0.95, lift: 0.1, zIndex: 3 };
  return { scale: 0.9, lift: 0.2, zIndex: 2 };
}

/** Comprime alturas extremas sem apagar a ordem pequena < média < grande. */
export function battleCameraHeight(actualHeight: number) {
  const { minHeight, preferredHeight, maxHeight } = BATTLE_VISUAL;
  if (!(actualHeight > 0)) return preferredHeight;
  const compressed = preferredHeight * (actualHeight / preferredHeight) ** 0.45;
  return Math.min(maxHeight, Math.max(minHeight, compressed));
}

export type BattleCameraFraming = {
  position: Vec3;
  target: Vec3;
  fovDeg: number;
  groundNdcY: number;
};

export function frameBattleCamera(input: {
  height: number;
  span: number;
  fovDeg?: number;
  levitating?: boolean;
}): BattleCameraFraming {
  const fovDeg = input.fovDeg ?? 30;
  const half = Math.tan((fovDeg * Math.PI) / 360);
  const h = battleCameraHeight(input.height);
  const distH = h / (2 * half * BATTLE_VISUAL.fill);
  const distW = Math.max(input.span, 0.4) / (2 * half * 0.92);
  const dist = Math.max(distH, distW);
  const lookY = -BATTLE_VISUAL.groundNdcY * dist * half + (input.levitating ? h * 0.05 : 0);
  return {
    position: { x: 0, y: lookY, z: dist },
    target: { x: 0, y: lookY, z: 0 },
    fovDeg,
    groundNdcY: BATTLE_VISUAL.groundNdcY,
  };
}
