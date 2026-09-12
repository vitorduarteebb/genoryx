export type Vec3 = { x: number; y: number; z: number };

export type FramingInput = {
  size: Vec3;
  center: Vec3;
  aspect: number;
  fovDeg: number;
  bodyPlan?: string;
};

export type CreatureFraming = {
  target: Vec3;
  position: Vec3;
  distance: number;
  minDistance: number;
  maxDistance: number;
  minPolarAngle: number;
  maxPolarAngle: number;
  fill: number;
};

function length(v: Vec3) {
  return Math.hypot(v.x, v.y, v.z);
}

export function frameCreatureCamera(input: FramingInput): CreatureFraming {
  const radius = Math.max(length(input.size) * 0.5, 0.08);
  const fov = (input.fovDeg * Math.PI) / 180;
  const plan = input.bodyPlan ?? "";
  let fill = 0.72;
  let yaw = 0.62;
  let pitch = 0.28;
  let distanceMul = 1;
  let targetYBias = 0.02;

  if (plan === "SERPENT_WYRM" || plan === "ARACHNID") {
    fill = 0.68;
    yaw = 0.78;
    distanceMul = 1.08;
  } else if (plan === "BIPED" || plan === "HUMANOID_BEAST" || plan === "INSECTOID_BIPED") {
    fill = 0.74;
    pitch = 0.22;
    targetYBias = 0.06;
  } else if (plan === "GOLEM") {
    fill = 0.66;
    distanceMul = 1.12;
    pitch = 0.24;
  } else if (plan === "FLOATING") {
    fill = 0.7;
    pitch = 0.2;
    targetYBias = -0.04;
  } else if (plan === "AVIAN") {
    fill = 0.7;
    pitch = 0.26;
  }

  const heightFit = input.size.y * 0.5 / Math.tan(fov / 2);
  const widthFit = (input.size.x * 0.5) / (Math.tan(fov / 2) * Math.max(input.aspect, 0.5));
  const fitted = Math.max(radius / Math.sin(fov / 2), heightFit, widthFit) * fill * distanceMul;
  const distance = Math.max(fitted, 0.55);
  const target = {
    x: input.center.x,
    y: input.center.y + input.size.y * targetYBias,
    z: input.center.z,
  };
  const position = {
    x: target.x + Math.sin(yaw) * Math.cos(pitch) * distance,
    y: target.y + Math.sin(pitch) * distance,
    z: target.z + Math.cos(yaw) * Math.cos(pitch) * distance,
  };

  return {
    target,
    position,
    distance,
    minDistance: distance * 0.72,
    maxDistance: distance * 1.85,
    minPolarAngle: Math.PI * 0.32,
    maxPolarAngle: Math.PI * 0.68,
    fill,
  };
}
