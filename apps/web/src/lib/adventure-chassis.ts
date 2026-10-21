import { CHASSIS_BODY_ID, CHASSIS_ID, type ChassisView } from "@nexora/config";

function allele(id: string) {
  return { d: id, r1: id, r2: id };
}

export function emberBabyChassis(): ChassisView {
  return {
    chassisId: CHASSIS_ID,
    body: allele(CHASSIS_BODY_ID),
    head: allele("HEAD_03_DRACONIC"),
    eyes: allele("EYES_03_AMBER"),
    horns: allele("HORNS_04_INFERNAL"),
    limbs: allele("LIMBS_02_ARMORED"),
    tail: allele("TAIL_05_ELEMENTAL"),
    back: allele("BACK_05_ARMORED_SPINES"),
    core: allele("CORE_01_EMBER"),
    pattern: allele("PATTERN_CRACKS"),
    aura: allele("AURA_EMBER"),
    primaryColorId: "charcoal",
    secondaryColorId: "magma",
    patternColorId: "ember",
    eyeColorId: "amber",
    coreColorId: "ember",
    growthStage: "Baby",
  };
}

export function floruneWildChassis(): ChassisView {
  return {
    chassisId: CHASSIS_ID,
    body: allele(CHASSIS_BODY_ID),
    head: allele("HEAD_01_SMOOTH"),
    eyes: allele("EYES_04_NATURE"),
    horns: allele("HORNS_01_BONE"),
    limbs: allele("LIMBS_01_SOFT"),
    tail: allele("TAIL_02_CURVED"),
    back: allele("BACK_01_PLATES"),
    core: allele("CORE_03_NATURE"),
    pattern: allele("PATTERN_SCALES"),
    aura: allele("AURA_NATURE"),
    primaryColorId: "moss",
    secondaryColorId: "verdant",
    patternColorId: "moss",
    eyeColorId: "azure",
    coreColorId: "moss",
    growthStage: "Juvenile",
  };
}
