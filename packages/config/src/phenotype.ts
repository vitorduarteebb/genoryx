import type { BodyPlan, Element, HeadType } from "@nexora/types";
import { speciesElements, speciesVisuals } from "./species";

export const PART_PUBLIC_BASE = "/creatures/parts";

export type CreaturePhenotype = {
  body: string;
  head: string;
  limbs: string | null;
  tail: string | null;
  eyes: string;
  horns: string | null;
};

export type PhenotypeInput = {
  speciesKey: string;
  bodyPlan?: BodyPlan;
  head?: HeadType;
  element?: Element | string;
  seed?: number;
};

const BODY_FILE: Record<BodyPlan, string> = {
  QUADRUPED: "body/quadruped.png",
  BIPED: "body/biped.png",
  SERPENT_WYRM: "body/serpentine.png",
  FLOATING: "body/spectral.png",
  HUMANOID_BEAST: "body/biped-armored.png",
  AVIAN: "body/biped-raptor.png",
  ARACHNID: "body/hexaped.png",
  GOLEM: "body/biped-heavy.png",
  AMPHIBIAN: "body/aquatic.png",
  ABYSSAL: "body/aquatic.png",
  CENTAUROID: "body/quadruped-socket.png",
  INSECTOID_BIPED: "body/myriapod.png",
};

const HEAD_FILE: Record<HeadType, string> = {
  DRACONIC: "head/draconic.png",
  BEAST: "head/beast.jpg",
  SERPENT: "head/serpent.png",
  EXOTIC: "head/exotic.png",
};

const EYES_BY_ELEMENT: Record<string, readonly string[]> = {
  FIRE: ["eyes/01.jpg", "eyes/05.jpg"],
  WATER: ["eyes/02.jpg", "eyes/04.jpg"],
  NATURE: ["eyes/05.jpg", "eyes/04.jpg"],
  EARTH: ["eyes/03.jpg", "eyes/05.jpg"],
  ELECTRIC: ["eyes/04.jpg", "eyes/02.jpg"],
  ICE: ["eyes/02.jpg", "eyes/04.jpg"],
  DARK: ["eyes/03.jpg", "eyes/05.jpg"],
  LIGHT: ["eyes/04.jpg", "eyes/02.jpg"],
  ARCANE: ["eyes/05.jpg", "eyes/03.jpg"],
};

const HORNS_BY_ELEMENT: Record<string, readonly string[]> = {
  FIRE: ["horns/01.jpg", "horns/03.jpg"],
  WATER: ["horns/05.jpg", "horns/04.jpg"],
  NATURE: ["horns/05.jpg", "horns/04.jpg"],
  EARTH: ["horns/02.jpg", "horns/01.jpg"],
  ELECTRIC: ["horns/05.jpg", "horns/03.jpg"],
  ICE: ["horns/05.jpg", "horns/04.jpg"],
  DARK: ["horns/02.jpg", "horns/03.jpg"],
  LIGHT: ["horns/05.jpg", "horns/04.jpg"],
  ARCANE: ["horns/04.jpg", "horns/05.jpg"],
};

export const CATALOG_PART_RELS = [
  "body/quadruped.png",
  "body/biped.png",
  "body/serpentine.png",
  "body/spectral.png",
  "body/biped-heavy.png",
  "body/quadruped-socket.png",
  "body/myriapod.png",
  "body/biped-armored.png",
  "body/quadruped-dorsal.png",
  "body/aquatic.png",
  "body/hexaped.png",
  "body/biped-raptor.png",
  "head/draconic.png",
  "head/beast.jpg",
  "head/serpent.png",
  "head/exotic.png",
  "limbs/clawed.png",
  "limbs/heavy.png",
  "limbs/raptor.png",
  "limbs/mantis.png",
  "tail/predator.png",
  "tail/heavy.png",
  "tail/blade.png",
  "eyes/01.jpg",
  "eyes/02.jpg",
  "eyes/03.jpg",
  "eyes/04.jpg",
  "eyes/05.jpg",
  "horns/01.jpg",
  "horns/02.jpg",
  "horns/03.jpg",
  "horns/04.jpg",
  "horns/05.jpg",
] as const;

export function partSrc(rel: string) {
  return `${PART_PUBLIC_BASE}/${rel}`;
}

export function phenotypePartRels(phenotype: CreaturePhenotype) {
  return [phenotype.tail, phenotype.body, phenotype.head].filter((rel): rel is string => Boolean(rel));
}

function pick(options: readonly string[], seed: number) {
  return options[Math.abs(seed) % options.length] ?? options[0];
}

function hashKey(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
  }
  return hash >>> 0;
}

function limbsFor() {
  return null;
}

function tailFor(bodyPlan: BodyPlan, tags: readonly string[], element: string) {
  if (bodyPlan !== "QUADRUPED" && bodyPlan !== "CENTAUROID") {
    return null;
  }
  if (tags.includes("TANK") || element === "EARTH") {
    return "tail/heavy.png";
  }
  if (element === "FIRE" || tags.includes("BURN")) {
    return "tail/blade.png";
  }
  return "tail/predator.png";
}

function bodyFor(speciesKey: string, bodyPlan: BodyPlan, tags: readonly string[]) {
  if (speciesKey === "drakor" || (bodyPlan === "QUADRUPED" && tags.includes("TANK"))) {
    return "body/quadruped-dorsal.png";
  }
  return BODY_FILE[bodyPlan];
}

export function assemblePhenotype(input: PhenotypeInput): CreaturePhenotype {
  const visual = speciesVisuals[input.speciesKey];
  const bodyPlan = input.bodyPlan ?? visual?.bodyPlan ?? "QUADRUPED";
  const head = input.head ?? visual?.head ?? "DRACONIC";
  const element = String(input.element ?? speciesElements[input.speciesKey] ?? "ARCANE");
  const tags = visual?.tags ?? [];
  const seed = input.seed ?? hashKey(input.speciesKey);

  const hornsPool = HORNS_BY_ELEMENT[element] ?? HORNS_BY_ELEMENT.ARCANE;
  const skipHorns = bodyPlan === "AMPHIBIAN" || bodyPlan === "ABYSSAL" || bodyPlan === "SERPENT_WYRM";

  return {
    body: bodyFor(input.speciesKey, bodyPlan, tags),
    head: HEAD_FILE[head],
    limbs: limbsFor(),
    tail: tailFor(bodyPlan, tags, element),
    eyes: pick(EYES_BY_ELEMENT[element] ?? EYES_BY_ELEMENT.ARCANE, seed),
    horns: skipHorns ? null : pick(hornsPool, Math.floor(seed / 7)),
  };
}
