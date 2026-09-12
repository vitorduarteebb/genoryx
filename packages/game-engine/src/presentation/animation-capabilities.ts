export const ANIMATION_CAPABILITIES = ["NONE", "ROOT_ONLY", "SKELETAL", "MORPH_TARGETS", "FULL"] as const;
export type AnimationCapability = (typeof ANIMATION_CAPABILITIES)[number];

const IDLE_ALIASES = ["idle", "idle_01", "idle_02", "idle01", "idle02", "idling"];
const CLIP_ALIASES: Record<string, string[]> = {
  idle: IDLE_ALIASES,
  idle_02: ["idle_02", "idle2", "idle_2"],
  walk: ["walk", "walking"],
  attack: ["attack", "atk", "strike"],
  hit: ["hit", "hurt", "damage"],
  death: ["death", "die"],
  victory: ["victory", "win", "celebrate"],
};

export function normalizeClipName(name: string): string {
  return name.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

export function pickNamedClip(names: readonly string[], role: keyof typeof CLIP_ALIASES): string | null {
  const aliases = CLIP_ALIASES[role];
  for (const name of names) {
    const normalized = normalizeClipName(name);
    const tail = normalized.split(/[|:./]+/).at(-1) ?? normalized;
    if (aliases.some((alias) => normalized === alias || tail === alias || normalized.endsWith(`_${alias}`))) {
      return name;
    }
  }
  return null;
}

export function resolveAnimationCapability(input: {
  boneCount: number;
  morphTargetCount: number;
  clipNames: readonly string[];
}): { capability: AnimationCapability; idleClip: string | null; hasBlink: boolean } {
  const idleClip = pickNamedClip(input.clipNames, "idle");
  const hasClips = input.clipNames.length > 0;
  const hasBones = input.boneCount > 1;
  const hasMorphs = input.morphTargetCount > 0;
  let capability: AnimationCapability = "NONE";
  if (hasClips && hasBones) {
    capability = "FULL";
  } else if (hasBones) {
    capability = input.boneCount <= 2 ? "ROOT_ONLY" : "SKELETAL";
  } else if (hasMorphs) {
    capability = "MORPH_TARGETS";
  } else if (hasClips) {
    capability = "ROOT_ONLY";
  }
  return {
    capability,
    idleClip,
    hasBlink: false,
  };
}
