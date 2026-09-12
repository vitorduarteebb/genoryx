import {
  CHASSIS_BODY_ID,
  CHASSIS_ID,
  chassisAccentColorIds,
  chassisAuras,
  chassisBacks,
  chassisBodyColorIds,
  chassisCoreAura,
  chassisCoreColor,
  chassisCores,
  chassisEmissiveColorIds,
  chassisEyes,
  chassisHeads,
  chassisHorns,
  chassisLimbs,
  chassisPatterns,
  chassisTails,
  type ChassisGrowthStage,
} from "@nexora/config";
import type { LifeStage } from "@nexora/types";
import { seedFromParts } from "../genes/hash";
import { createSeededRandom, type RandomService } from "../random/random-service";

export type ChassisAllele = {
  d: string;
  r1: string;
  r2: string;
};

export type ChassisDna = {
  chassisId: typeof CHASSIS_ID;
  body: ChassisAllele;
  head: ChassisAllele;
  eyes: ChassisAllele;
  horns: ChassisAllele;
  limbs: ChassisAllele;
  tail: ChassisAllele;
  back: ChassisAllele;
  core: ChassisAllele;
  pattern: ChassisAllele;
  aura: ChassisAllele;
  primaryColorId: string;
  secondaryColorId: string;
  patternColorId: string;
  eyeColorId: string;
  coreColorId: string;
  growthStage: ChassisGrowthStage;
};

const HORN_PAIRS = chassisHorns.filter((row) => row !== "HORNS_NONE");

const SLOTS = {
  head: chassisHeads,
  eyes: chassisEyes,
  horns: chassisHorns,
  limbs: chassisLimbs,
  tail: chassisTails,
  back: chassisBacks,
  core: chassisCores,
  pattern: chassisPatterns,
  aura: chassisAuras,
} as const;

function allele(rng: RandomService, catalog: readonly string[]): ChassisAllele {
  return {
    d: rng.pick(catalog),
    r1: rng.pick(catalog),
    r2: rng.pick(catalog),
  };
}

export function growthFromLifeStage(stage?: LifeStage | null): ChassisGrowthStage {
  if (stage === "ADULT") {
    return "Adult";
  }
  if (stage === "YOUNG") {
    return "Juvenile";
  }
  return "Baby";
}

export function expressed(allele: ChassisAllele): string {
  return allele.d || allele.r1;
}

/**
 * Assinatura do fenótipo visível. Sem growth: Baby/Adult é o mesmo indivíduo.
 * É a chave de unicidade no banco.
 */
export function chassisSignature(dna: ChassisDna): string {
  return [
    dna.chassisId,
    expressed(dna.body),
    expressed(dna.head),
    expressed(dna.eyes),
    expressed(dna.horns),
    expressed(dna.limbs),
    expressed(dna.tail),
    expressed(dna.back),
    expressed(dna.core),
    expressed(dna.pattern),
    expressed(dna.aura),
    dna.primaryColorId,
    dna.secondaryColorId,
    dna.patternColorId,
    dna.eyeColorId,
    dna.coreColorId,
  ].join("/");
}

export function rollChassisDna(input: {
  seed: number;
  lifeStage?: LifeStage | null;
  salt?: string | number;
}): ChassisDna {
  const seed = input.salt === undefined ? input.seed : seedFromParts([input.seed, String(input.salt), "chassis"]);
  return rollChassisWith(createSeededRandom(seed), input.lifeStage);
}

export function rollChassisWith(rng: RandomService, lifeStage?: LifeStage | null): ChassisDna {
  const core = allele(rng, chassisCores);
  const coreId = expressed(core) as (typeof chassisCores)[number];
  const matchAura = rng.chance(0.72);
  return {
    chassisId: CHASSIS_ID,
    body: { d: CHASSIS_BODY_ID, r1: CHASSIS_BODY_ID, r2: CHASSIS_BODY_ID },
    head: allele(rng, SLOTS.head),
    eyes: allele(rng, SLOTS.eyes),
    horns: rng.chance(0.38)
      ? { d: "HORNS_NONE", r1: rng.pick(HORN_PAIRS), r2: rng.pick(chassisHorns) }
      : allele(rng, HORN_PAIRS),
    limbs: allele(rng, SLOTS.limbs),
    tail: allele(rng, SLOTS.tail),
    back: allele(rng, SLOTS.back),
    core,
    pattern: allele(rng, SLOTS.pattern),
    aura: matchAura
      ? { d: chassisCoreAura[coreId], r1: rng.pick(chassisAuras), r2: rng.pick(chassisAuras) }
      : allele(rng, SLOTS.aura),
    primaryColorId: rng.pick(chassisBodyColorIds),
    secondaryColorId: rng.pick(chassisAccentColorIds),
    patternColorId: rng.pick(chassisEmissiveColorIds),
    eyeColorId: rng.pick(chassisEmissiveColorIds),
    coreColorId: chassisCoreColor[coreId],
    growthStage: growthFromLifeStage(lifeStage),
  };
}

function crossAllele(rng: RandomService, a: ChassisAllele, b: ChassisAllele): ChassisAllele {
  const source = rng.chance(0.5) ? a : b;
  const other = source === a ? b : a;
  return {
    d: rng.chance(0.18) ? other.d : source.d,
    r1: rng.chance(0.5) ? source.r1 : other.d,
    r2: rng.chance(0.5) ? other.r2 : source.r1,
  };
}

export function breedChassisDna(input: {
  seed: number;
  parentA: ChassisDna;
  parentB: ChassisDna;
  salt?: string | number;
}): ChassisDna {
  const rng = createSeededRandom(seedFromParts([input.seed, String(input.salt ?? ""), "chassis-breed"]));
  const head = crossAllele(rng, input.parentA.head, input.parentB.head);
  const core = crossAllele(rng, input.parentA.core, input.parentB.core);
  const coreId = expressed(core) as (typeof chassisCores)[number];
  return {
    chassisId: CHASSIS_ID,
    body: { d: CHASSIS_BODY_ID, r1: CHASSIS_BODY_ID, r2: CHASSIS_BODY_ID },
    head,
    eyes: crossAllele(rng, input.parentA.eyes, input.parentB.eyes),
    horns: crossAllele(rng, input.parentA.horns, input.parentB.horns),
    limbs: crossAllele(rng, input.parentA.limbs, input.parentB.limbs),
    tail: crossAllele(rng, input.parentA.tail, input.parentB.tail),
    back: crossAllele(rng, input.parentA.back, input.parentB.back),
    core,
    pattern: crossAllele(rng, input.parentA.pattern, input.parentB.pattern),
    aura: crossAllele(rng, input.parentA.aura, input.parentB.aura),
    primaryColorId: rng.chance(0.5) ? input.parentA.primaryColorId : input.parentB.primaryColorId,
    secondaryColorId: rng.chance(0.5) ? input.parentA.secondaryColorId : input.parentB.secondaryColorId,
    patternColorId: rng.chance(0.5) ? input.parentA.patternColorId : input.parentB.patternColorId,
    eyeColorId: rng.chance(0.5) ? input.parentA.eyeColorId : input.parentB.eyeColorId,
    coreColorId: chassisCoreColor[coreId],
    growthStage: "Baby",
  };
}

export function parseChassisDna(value: unknown): ChassisDna | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const row = value as Partial<ChassisDna>;
  if (row.chassisId !== CHASSIS_ID || !row.head || !row.core) {
    return null;
  }
  return row as ChassisDna;
}

export function withUniqueChassis(
  seed: number,
  taken: ReadonlySet<string>,
  lifeStage?: LifeStage | null,
  preferred?: ChassisDna | null,
): ChassisDna {
  let dna = preferred ?? rollChassisDna({ seed, lifeStage });
  for (let attempt = 0; attempt < 256; attempt += 1) {
    const signature = chassisSignature(dna);
    if (!taken.has(signature)) {
      return dna;
    }
    dna = rollChassisDna({ seed, lifeStage, salt: `retry:${attempt}` });
  }
  throw new Error("espaço de fenótipo esgotado: não há criatura visualmente única disponível");
}
