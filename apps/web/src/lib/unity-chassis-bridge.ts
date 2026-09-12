import type { ChassisView } from "@nexora/config";

export const CHASSIS_FRAME_SRC = "/unity-game/index.html?embed=1";
export const CHASSIS_MESSAGE = "GENORYX_CHASSIS";

function stageIndex(stage: ChassisView["growthStage"]): number {
  if (stage === "Adult") {
    return 2;
  }
  if (stage === "Juvenile") {
    return 1;
  }
  return 0;
}

/** JSON que o `JsonUtility` do Unity lê: enum de growth como inteiro. */
export function chassisToUnityJson(dna: ChassisView): string {
  return JSON.stringify({
    creatureId: "",
    species: "genoryx",
    chassisId: dna.chassisId,
    body: dna.body,
    head: dna.head,
    eyes: dna.eyes,
    horns: dna.horns,
    limbs: dna.limbs,
    tail: dna.tail,
    back: dna.back,
    core: dna.core,
    pattern: dna.pattern,
    aura: dna.aura,
    primaryColorId: dna.primaryColorId,
    secondaryColorId: dna.secondaryColorId,
    patternColorId: dna.patternColorId,
    eyeColorId: dna.eyeColorId,
    coreColorId: dna.coreColorId,
    growthStage: stageIndex(dna.growthStage),
    mutations: [],
  });
}

export function postChassisDna(target: Window | null | undefined, dna: ChassisView | null | undefined) {
  if (!target || !dna) {
    return;
  }
  target.postMessage(
    { type: CHASSIS_MESSAGE, action: "apply", json: chassisToUnityJson(dna) },
    window.location.origin,
  );
}
