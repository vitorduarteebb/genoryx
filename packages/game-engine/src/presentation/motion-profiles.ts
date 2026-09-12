import type { BodyPlan, LifeStage, Temperament } from "@nexora/types";

export type MotionProfile = {
  breathPeriod: number;
  breathScaleY: number;
  breathScaleXZ: number;
  swayZDeg: number;
  swayYDeg: number;
  verticalAmp: number;
  restPitchDeg: number;
  lookInterval: readonly [number, number];
  postureInterval: readonly [number, number];
  specialInterval: readonly [number, number];
  lookAmpDeg: number;
  postureAmpDeg: number;
  specialAmp: number;
  energy: number;
  weight: number;
  pause: number;
  asymmetry: number;
};

const BODY: Record<BodyPlan, Partial<MotionProfile>> = {
  QUADRUPED: {
    breathPeriod: 3.05,
    breathScaleY: 0.0044,
    breathScaleXZ: 0.0011,
    swayZDeg: 0.42,
    swayYDeg: 0.18,
    verticalAmp: 0.0008,
    restPitchDeg: 0.35,
    lookAmpDeg: 1.15,
    postureAmpDeg: 0.65,
    specialAmp: 0.0055,
    energy: 0.58,
    weight: 0.72,
  },
  BIPED: {
    breathPeriod: 3.2,
    breathScaleY: 0.004,
    swayZDeg: 0.55,
    restPitchDeg: 0.15,
    energy: 0.52,
    weight: 0.68,
  },
  HUMANOID_BEAST: {
    breathPeriod: 3.3,
    breathScaleY: 0.0038,
    swayZDeg: 0.5,
    energy: 0.5,
    weight: 0.74,
  },
  SERPENT_WYRM: {
    breathPeriod: 3.6,
    breathScaleY: 0.0032,
    swayZDeg: 0.28,
    swayYDeg: 0.55,
    restPitchDeg: 0.1,
    energy: 0.4,
    weight: 0.8,
  },
  FLOATING: {
    breathPeriod: 3.8,
    breathScaleY: 0.003,
    verticalAmp: 0.012,
    swayZDeg: 0.7,
    swayYDeg: 0.45,
    restPitchDeg: 0,
    energy: 0.42,
    weight: 0.35,
  },
  GOLEM: {
    breathPeriod: 4.6,
    breathScaleY: 0.0014,
    breathScaleXZ: 0.0004,
    swayZDeg: 0.12,
    swayYDeg: 0.06,
    verticalAmp: 0,
    restPitchDeg: 0.05,
    lookAmpDeg: 0.35,
    postureAmpDeg: 0.2,
    specialAmp: 0.001,
    energy: 0.22,
    weight: 1,
    lookInterval: [8, 14],
    postureInterval: [14, 22],
    specialInterval: [24, 36],
  },
  AVIAN: {
    breathPeriod: 2.7,
    breathScaleY: 0.0048,
    verticalAmp: 0.0035,
    swayZDeg: 0.5,
    energy: 0.66,
    weight: 0.45,
  },
  AMPHIBIAN: {
    breathPeriod: 3.4,
    breathScaleY: 0.0042,
    swayZDeg: 0.38,
    energy: 0.48,
    weight: 0.7,
  },
  ABYSSAL: {
    breathPeriod: 3.9,
    breathScaleY: 0.0036,
    swayZDeg: 0.32,
    pause: 0.35,
    asymmetry: 0.35,
    energy: 0.38,
    weight: 0.78,
  },
  ARACHNID: {
    breathPeriod: 2.9,
    breathScaleY: 0.0035,
    swayZDeg: 0.3,
    energy: 0.6,
    weight: 0.7,
  },
  CENTAUROID: {
    breathPeriod: 3.15,
    breathScaleY: 0.004,
    swayZDeg: 0.4,
    energy: 0.54,
    weight: 0.76,
  },
  INSECTOID_BIPED: {
    breathPeriod: 2.8,
    breathScaleY: 0.0038,
    swayZDeg: 0.48,
    energy: 0.64,
    weight: 0.55,
  },
};

const TEMPER: Record<Temperament, Partial<MotionProfile> & { periodMul?: number; lookMul?: number }> = {
  FRIENDLY: {
    breathScaleY: 0.0006,
    swayZDeg: 0.22,
    lookAmpDeg: 0.25,
    lookMul: 0.92,
    energy: 0.08,
  },
  NOBLE: {
    periodMul: 1.18,
    breathScaleY: -0.0008,
    swayZDeg: -0.12,
    lookAmpDeg: -0.35,
    postureAmpDeg: -0.15,
    specialAmp: -0.002,
    lookMul: 1.25,
    energy: -0.16,
    restPitchDeg: -0.15,
  },
  WILD: {
    periodMul: 0.88,
    swayZDeg: 0.12,
    lookAmpDeg: 0.35,
    specialAmp: 0.002,
    lookMul: 0.78,
    energy: 0.18,
  },
  FERAL: {
    periodMul: 0.82,
    breathScaleY: 0.0007,
    swayZDeg: -0.04,
    lookAmpDeg: 0.28,
    specialAmp: 0.0028,
    restPitchDeg: 1.15,
    lookMul: 0.72,
    energy: 0.22,
  },
  MENACING: {
    periodMul: 1.22,
    breathScaleY: 0.0009,
    swayZDeg: -0.08,
    lookAmpDeg: -0.15,
    specialAmp: -0.001,
    lookMul: 1.15,
    energy: -0.12,
    weight: 0.12,
    restPitchDeg: 0.35,
  },
  ABYSSAL: {
    periodMul: 1.08,
    pause: 0.42,
    asymmetry: 0.28,
    energy: -0.08,
    lookMul: 1.1,
  },
};

const STAGE: Record<LifeStage, Partial<MotionProfile> & { periodMul?: number; lookMul?: number }> = {
  EGG: {
    breathScaleY: 0.0012,
    swayZDeg: 0.05,
    lookAmpDeg: 0,
    specialAmp: 0,
    energy: -0.3,
    verticalAmp: 0,
  },
  BABY: {
    periodMul: 0.9,
    breathScaleY: 0.0009,
    swayZDeg: 0.12,
    lookAmpDeg: 0.3,
    lookMul: 0.8,
    energy: 0.14,
    restPitchDeg: 0.28,
  },
  YOUNG: {
    periodMul: 0.97,
    energy: 0.04,
    lookMul: 0.92,
  },
  ADULT: {
    periodMul: 1.08,
    swayZDeg: -0.08,
    lookAmpDeg: -0.15,
    lookMul: 1.12,
    energy: -0.1,
    weight: 0.08,
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function interval(base: readonly [number, number], mul: number): [number, number] {
  return [clamp(base[0] * mul, 2.4, 28), clamp(base[1] * mul, 4, 40)];
}

const DEFAULT_PROFILE: MotionProfile = {
  breathPeriod: 3.2,
  breathScaleY: 0.004,
  breathScaleXZ: 0.001,
  swayZDeg: 0.4,
  swayYDeg: 0.2,
  verticalAmp: 0.001,
  restPitchDeg: 0.2,
  lookInterval: [5, 9],
  postureInterval: [9, 16],
  specialInterval: [16, 28],
  lookAmpDeg: 1.1,
  postureAmpDeg: 0.6,
  specialAmp: 0.0045,
  energy: 0.5,
  weight: 0.7,
  pause: 0,
  asymmetry: 0.08,
};

export function composeMotionProfile(
  bodyPlan: string,
  temperament: string,
  lifeStage: string,
): MotionProfile {
  const body = BODY[bodyPlan as BodyPlan] ?? {};
  const temper = TEMPER[temperament as Temperament] ?? {};
  const stage = STAGE[lifeStage as LifeStage] ?? {};
  const periodMul = (temper.periodMul ?? 1) * (stage.periodMul ?? 1);
  const lookMul = (temper.lookMul ?? 1) * (stage.lookMul ?? 1);
  const merged: MotionProfile = {
    ...DEFAULT_PROFILE,
    breathPeriod: (body.breathPeriod ?? DEFAULT_PROFILE.breathPeriod) * periodMul,
    breathScaleY: (body.breathScaleY ?? DEFAULT_PROFILE.breathScaleY) + (temper.breathScaleY ?? 0) + (stage.breathScaleY ?? 0),
    breathScaleXZ: body.breathScaleXZ ?? DEFAULT_PROFILE.breathScaleXZ,
    swayZDeg: (body.swayZDeg ?? DEFAULT_PROFILE.swayZDeg) + (temper.swayZDeg ?? 0) + (stage.swayZDeg ?? 0),
    swayYDeg: body.swayYDeg ?? DEFAULT_PROFILE.swayYDeg,
    verticalAmp: body.verticalAmp ?? DEFAULT_PROFILE.verticalAmp,
    restPitchDeg: (body.restPitchDeg ?? DEFAULT_PROFILE.restPitchDeg) + (temper.restPitchDeg ?? 0) + (stage.restPitchDeg ?? 0),
    lookInterval: interval(body.lookInterval ?? DEFAULT_PROFILE.lookInterval, lookMul),
    postureInterval: interval(body.postureInterval ?? DEFAULT_PROFILE.postureInterval, lookMul),
    specialInterval: interval(body.specialInterval ?? DEFAULT_PROFILE.specialInterval, lookMul),
    lookAmpDeg: (body.lookAmpDeg ?? DEFAULT_PROFILE.lookAmpDeg) + (temper.lookAmpDeg ?? 0) + (stage.lookAmpDeg ?? 0),
    postureAmpDeg: (body.postureAmpDeg ?? DEFAULT_PROFILE.postureAmpDeg) + (temper.postureAmpDeg ?? 0),
    specialAmp: (body.specialAmp ?? DEFAULT_PROFILE.specialAmp) + (temper.specialAmp ?? 0) + (stage.specialAmp ?? 0),
    energy: clamp((body.energy ?? DEFAULT_PROFILE.energy) + (temper.energy ?? 0) + (stage.energy ?? 0), 0.12, 1),
    weight: clamp((body.weight ?? DEFAULT_PROFILE.weight) + (temper.weight ?? 0) + (stage.weight ?? 0), 0.2, 1.15),
    pause: clamp((body.pause ?? 0) + (temper.pause ?? 0), 0, 0.7),
    asymmetry: clamp((body.asymmetry ?? DEFAULT_PROFILE.asymmetry) + (temper.asymmetry ?? 0), 0, 0.55),
  };
  merged.breathScaleY = clamp(merged.breathScaleY, 0.0008, 0.0075);
  merged.swayZDeg = clamp(merged.swayZDeg, 0.08, 1.15);
  merged.lookAmpDeg = clamp(merged.lookAmpDeg, 0.15, 2.1);
  merged.specialAmp = clamp(merged.specialAmp, 0.0004, 0.01);
  return merged;
}

export function formatGeneticHash(hash: string): string {
  if (hash.length < 8) {
    return hash;
  }
  return `${hash.slice(0, 4)}…${hash.slice(-4)}`;
}
