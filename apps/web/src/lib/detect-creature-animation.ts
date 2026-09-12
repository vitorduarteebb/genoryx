import { resolveAnimationCapability, type AnimationCapability } from "@nexora/game-engine";

type BoneLike = { isBone?: boolean; uuid: string; skeleton?: { bones?: Array<{ uuid: string }> } };
type MorphLike = { morphTargetDictionary?: Record<string, number>; morphTargetInfluences?: number[] };

export function detectCreatureAnimation(input: {
  scene: { traverse: (fn: (child: BoneLike & MorphLike) => void) => void };
  animations: Array<{ name: string }>;
}): { capability: AnimationCapability; idleClip: string | null; hasBlink: boolean } {
  const bones = new Set<string>();
  let morphs = 0;
  let blink = false;
  input.scene.traverse((child) => {
    if (child.isBone) {
      bones.add(child.uuid);
    }
    for (const bone of child.skeleton?.bones ?? []) {
      bones.add(bone.uuid);
    }
    const dict = child.morphTargetDictionary ?? {};
    morphs += Object.keys(dict).length;
    blink = blink || Object.keys(dict).some((name) => /blink|eye.?close|eyelid/i.test(name));
  });
  const resolved = resolveAnimationCapability({
    boneCount: bones.size,
    morphTargetCount: morphs,
    clipNames: input.animations.map((clip) => clip.name),
  });
  return { ...resolved, hasBlink: blink };
}
