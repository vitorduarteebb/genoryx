/**
 * Catálogo do chassi modular V1. IDs são contrato com Unity
 * (`CreatureParts` / `CreaturePalette`) e com o banco: nunca renomear sem migração.
 *
 * A combinação de peças × cores é o fenótipo visível. Duas criaturas vivas
 * não podem ter a mesma assinatura — o servidor recusa, não o cliente.
 */
export const CHASSIS_ID = "GENORYX_CORE_CHASSIS_V1" as const;
export const CHASSIS_RIG_ID = "GENORYX_CORE_RIG" as const;
export const CHASSIS_BODY_ID = "BODY_CORE_STANDARD" as const;

export const chassisHeads = [
  "HEAD_01_SMOOTH",
  "HEAD_02_PREDATOR",
  "HEAD_03_DRACONIC",
  "HEAD_04_ARCANE",
] as const;

export const chassisEyes = [
  "EYES_01_PREDATOR",
  "EYES_02_AZURE",
  "EYES_03_AMBER",
  "EYES_04_NATURE",
  "EYES_05_VOID",
] as const;

export const chassisHorns = [
  "HORNS_01_BONE",
  "HORNS_02_DARK",
  "HORNS_03_CRYSTAL",
  "HORNS_04_INFERNAL",
  "HORNS_05_VOID_CRYSTAL",
  "HORNS_NONE",
] as const;

export const chassisLimbs = [
  "LIMBS_01_SOFT",
  "LIMBS_02_ARMORED",
  "LIMBS_03_DRACONIC",
  "LIMBS_04_AGILE",
  "LIMBS_05_HEAVY",
] as const;

export const chassisTails = [
  "TAIL_01_SHORT",
  "TAIL_02_CURVED",
  "TAIL_03_SPIKED",
  "TAIL_04_SERPENT",
  "TAIL_05_ELEMENTAL",
] as const;

export const chassisBacks = [
  "BACK_01_PLATES",
  "BACK_02_LOW_SPIKES",
  "BACK_03_FIN",
  "BACK_04_CRYSTAL_SPINES",
  "BACK_05_ARMORED_SPINES",
  "BACK_NONE",
] as const;

export const chassisCores = [
  "CORE_01_EMBER",
  "CORE_02_FROST",
  "CORE_03_NATURE",
  "CORE_04_ARCANE",
  "CORE_05_VOID",
] as const;

export const chassisPatterns = [
  "PATTERN_NONE",
  "PATTERN_STRIPES",
  "PATTERN_VEINS",
  "PATTERN_CRACKS",
  "PATTERN_SCALES",
  "PATTERN_GENESIS",
] as const;

export const chassisAuras = [
  "AURA_NONE",
  "AURA_EMBER",
  "AURA_FROST",
  "AURA_NATURE",
  "AURA_VOID",
] as const;

export const chassisBodyColorIds = [
  "slate",
  "charcoal",
  "ash",
  "bone",
  "pale_ice",
  "glacier",
  "moss",
  "verdant",
  "bark",
  "soil",
  "sand",
  "steel",
  "void_black",
  "void_purple",
  "crimson",
] as const;

export const chassisAccentColorIds = [
  "ash",
  "bone",
  "bark",
  "soil",
  "steel",
  "sand",
  "magma",
  "glacier",
  "moss",
  "void_purple",
  "arcane",
] as const;

export const chassisEmissiveColorIds = [
  "ember",
  "magma",
  "amber",
  "azure",
  "cyan_ice",
  "verdant",
  "violet",
  "arcane",
  "crimson",
] as const;

/** RGB 0–1, iguais ao Unity `CreaturePalette`. */
export const chassisPaletteRgb: Record<string, readonly [number, number, number]> = {
  slate: [0.235, 0.251, 0.29],
  charcoal: [0.114, 0.118, 0.137],
  ash: [0.38, 0.392, 0.427],
  bone: [0.855, 0.831, 0.76],
  pale_ice: [0.788, 0.855, 0.902],
  glacier: [0.545, 0.686, 0.796],
  moss: [0.318, 0.478, 0.271],
  verdant: [0.427, 0.639, 0.318],
  bark: [0.353, 0.267, 0.192],
  soil: [0.267, 0.208, 0.157],
  ember: [0.902, 0.365, 0.129],
  magma: [0.667, 0.176, 0.086],
  amber: [0.949, 0.686, 0.239],
  azure: [0.286, 0.639, 0.902],
  cyan_ice: [0.451, 0.831, 0.929],
  violet: [0.478, 0.157, 0.769],
  void_black: [0.086, 0.067, 0.114],
  void_purple: [0.267, 0.157, 0.376],
  arcane: [0.51, 0.451, 1],
  crimson: [0.706, 0.157, 0.196],
  sand: [0.769, 0.686, 0.529],
  steel: [0.494, 0.529, 0.573],
};

export const chassisCoreColor: Record<(typeof chassisCores)[number], string> = {
  CORE_01_EMBER: "ember",
  CORE_02_FROST: "cyan_ice",
  CORE_03_NATURE: "verdant",
  CORE_04_ARCANE: "arcane",
  CORE_05_VOID: "violet",
};

export const chassisCoreAura: Record<(typeof chassisCores)[number], (typeof chassisAuras)[number]> = {
  CORE_01_EMBER: "AURA_EMBER",
  CORE_02_FROST: "AURA_FROST",
  CORE_03_NATURE: "AURA_NATURE",
  CORE_04_ARCANE: "AURA_VOID",
  CORE_05_VOID: "AURA_VOID",
};

export type ChassisGrowthStage = "Baby" | "Juvenile" | "Adult";

export type ChassisAlleleView = {
  d: string;
  r1: string;
  r2: string;
};

/** Forma pública do DNA do chassi. Igual ao Unity `CreatureDNA` nos campos visíveis. */
export type ChassisView = {
  chassisId: typeof CHASSIS_ID;
  body: ChassisAlleleView;
  head: ChassisAlleleView;
  eyes: ChassisAlleleView;
  horns: ChassisAlleleView;
  limbs: ChassisAlleleView;
  tail: ChassisAlleleView;
  back: ChassisAlleleView;
  core: ChassisAlleleView;
  pattern: ChassisAlleleView;
  aura: ChassisAlleleView;
  primaryColorId: string;
  secondaryColorId: string;
  patternColorId: string;
  eyeColorId: string;
  coreColorId: string;
  growthStage: ChassisGrowthStage;
};

export function chassisPaletteCss(id: string): string {
  const rgb = chassisPaletteRgb[id] ?? chassisPaletteRgb.slate;
  return `rgb(${Math.round(rgb[0] * 255)} ${Math.round(rgb[1] * 255)} ${Math.round(rgb[2] * 255)})`;
}

export function chassisCombinationCount(): number {
  return (
    chassisHeads.length *
    chassisEyes.length *
    chassisHorns.length *
    chassisLimbs.length *
    chassisTails.length *
    chassisBacks.length *
    chassisCores.length *
    chassisPatterns.length *
    chassisAuras.length *
    chassisBodyColorIds.length *
    chassisAccentColorIds.length *
    chassisEmissiveColorIds.length *
    chassisEmissiveColorIds.length
  );
}
