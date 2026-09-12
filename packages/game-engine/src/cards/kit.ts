import {
  CARD_GEN_VERSION,
  GENETIC_ENGINE_VERSION,
  cardKitSlots,
  cardsForLocus,
  cardsForSpecies,
  clampCardCost,
  describeEffects,
  getCardDefinition,
  type CardEffectDef,
  type CardKitFunction,
  type CardKitTier,
} from "@nexora/config";
import {
  GENE_RANKS,
  GENETIC_CARD_LOCI,
  type CardTargetType,
  type Element,
  type GeneKey,
  type GeneRank,
  type GeneticCardExpression,
  type GeneticCardLocusKey,
} from "@nexora/types";
import type { ChassisDna } from "../chassis/dna";
import { assembleGeneticCombat } from "../genetic-combat/assemble";
import { seedFromParts } from "../genes/hash";
import type { CreatureBlueprint, LocusBlueprint } from "../genes/generate";
import { createSeededRandom, type RandomService } from "../random/random-service";
import { clampEffectsToBudget } from "../powers/budget";
import { ELEMENT_STATUS, MUTATION_STATUS, kitNameParts } from "./kit-lexicon";

export type CardKitDerived = {
  element: Element;
  secondary?: Element | null;
  species: string;
  head: string;
  body: string;
  eyes?: string | null;
  horns?: string | null;
  limbs?: string | null;
  back?: string | null;
  tail?: string | null;
  mutation?: string | null;
  inherited: string[];
  luckRoll: number;
  powerBudget: number;
  generatorVersion: string;
};

export type CardKitManifest = GeneticCardExpression & {
  generatorVersion: string;
  locus: GeneticCardLocusKey;
  name: string;
  namePt: string;
  cost: number;
  targetType: CardTargetType;
  effects: CardEffectDef[];
  text: string;
  function: CardKitFunction;
  tier: CardKitTier;
  locusRole: (typeof GENETIC_CARD_LOCI)[number]["role"];
  luckRoll: number;
  powerBudget: number;
  derivedFrom: CardKitDerived;
  ability?: import("../genetic-combat/types").AbilityGraph;
  sourceGenes?: string[];
  luckVariant?: string;
};

export type CreatureCardKit = {
  version: string;
  cards: CardKitManifest[];
  combat?: import("../genetic-combat/types").GeneticCombatManifest;
};

export type ParentKitHint = {
  element: Element;
  families: string[];
  functions?: CardKitFunction[];
};

export function isCardKitManifest(value: unknown): value is CardKitManifest {
  if (!value || typeof value !== "object") {
    return false;
  }
  const row = value as Partial<CardKitManifest>;
  const version = row.generatorVersion;
  const sealed = version === CARD_GEN_VERSION || version === GENETIC_ENGINE_VERSION;
  return Boolean(sealed && Array.isArray(row.effects) && typeof row.namePt === "string");
}

export function kitSeed(input: { creatureId: string; geneticHash: string }): number {
  return seedFromParts([input.creatureId, input.geneticHash, CARD_GEN_VERSION]);
}

export function assembleCreatureCardKit(input: {
  creatureId: string;
  blueprint: CreatureBlueprint;
  parents?: ParentKitHint[];
}): CreatureCardKit {
  const combat = assembleGeneticCombat({
    creatureId: input.creatureId,
    blueprint: input.blueprint,
    parents: input.parents?.map((row) => ({ element: row.element, families: [...row.families] })),
  });
  const cards = combat.cards.map((card) => {
    const catalog = nearestCatalog(input.blueprint.speciesKey, GENETIC_CARD_LOCI.find((row) => row.key === card.locus)!.role, card.element);
    const profile = readProfile(input.blueprint);
    return {
      cardFamily: catalog?.key ?? `gxr-gce:${card.element.toLowerCase()}:${card.function.toLowerCase()}`,
      variant: GENETIC_ENGINE_VERSION,
      element: card.element,
      powerExpression: String(card.effects.find((row) => row.value)?.value ?? 10),
      energyExpression: String(card.cost),
      speedExpression: card.function === "MOBILITY" ? "FAST" : "NORMAL",
      statusExpression: card.effects.find((row) => row.status)?.status ?? "NONE",
      targetExpression: card.targetType,
      modifierGenes: [...profile.paths],
      mutationState: input.blueprint.mutationKey ?? "NONE",
      generatorVersion: GENETIC_ENGINE_VERSION,
      locus: card.locus,
      name: card.namePt,
      namePt: card.namePt,
      cost: card.cost,
      targetType: card.targetType,
      effects: card.effects,
      text: card.text,
      function: card.function,
      tier: card.tier,
      locusRole: GENETIC_CARD_LOCI.find((row) => row.key === card.locus)!.role,
      luckRoll: combat.rolls.efficiency / 100,
      powerBudget: cardKitSlots[card.locus].budget,
      derivedFrom: {
        element: card.element,
        secondary: input.blueprint.elementSecondary ?? null,
        species: input.blueprint.speciesKey,
        head: profile.head,
        body: profile.body,
        eyes: profile.chassis?.eyes?.d ?? null,
        horns: profile.chassis?.horns?.d ?? null,
        limbs: profile.chassis?.limbs?.d ?? null,
        back: profile.chassis?.back?.d ?? null,
        tail: profile.chassis?.tail?.d ?? null,
        mutation: input.blueprint.mutationKey ?? null,
        inherited: input.parents?.flatMap((row) => row.families).slice(0, 6) ?? [],
        luckRoll: combat.rolls.efficiency / 100,
        powerBudget: cardKitSlots[card.locus].budget,
        generatorVersion: GENETIC_ENGINE_VERSION,
      },
      ability: card.ability,
      sourceGenes: card.sourceGenes,
      luckVariant: card.luckVariant,
    } satisfies CardKitManifest;
  });
  return { version: GENETIC_ENGINE_VERSION, cards, combat };
}

export function applyKitToLoci(loci: LocusBlueprint[], kit: CreatureCardKit): LocusBlueprint[] {
  return loci.map((locus, index) => {
    const match = kit.cards[index];
    if (!match) {
      return locus;
    }
    return { ...locus, expressed: match };
  });
}

type Profile = {
  element: Element;
  secondary?: Element;
  species: string;
  paths: string[];
  gene: (key: GeneKey) => number;
  mutation?: string;
  inherited: string[];
  chassis: Partial<ChassisDna> | undefined;
  body: string;
  head: string;
};

function readProfile(blueprint: CreatureBlueprint): Profile {
  const chassis = blueprint.chassis;
  const paths: string[] = [];
  const head = chassis?.head.d ?? blueprint.headExpressed;
  const body = chassis?.body.d ?? blueprint.bodyPlanExpressed;
  if (String(head).includes("PREDATOR") || blueprint.headExpressed === "DRACONIC") paths.push("predator");
  if (String(head).includes("DRACONIC")) paths.push("draconic");
  if (String(head).includes("ARCANE") || String(chassis?.eyes.d ?? "").includes("VOID")) paths.push("arcane");
  if (String(chassis?.limbs.d ?? "").includes("AGILE") || blueprint.bodyPlanExpressed === "AVIAN") paths.push("agile", "wings");
  if (String(chassis?.limbs.d ?? "").includes("ARMORED") || String(chassis?.limbs.d ?? "").includes("HEAVY") || String(chassis?.back.d ?? "").includes("PLATE")) {
    paths.push("tank");
  }
  if (String(chassis?.back.d ?? "").includes("FIN") || blueprint.bodyPlanExpressed === "AVIAN") paths.push("wings");
  if (chassis?.horns.d && chassis.horns.d !== "HORNS_NONE") paths.push("horns");
  if (chassis?.tail.d) paths.push("tail");
  if (blueprint.tags.includes("BURN") || blueprint.headExpressed === "DRACONIC") paths.push("predator");
  return {
    element: blueprint.elementPrimary,
    secondary: blueprint.elementSecondary,
    species: blueprint.speciesKey,
    paths: [...new Set(paths)],
    gene: (key) => rankScore(blueprint.genes[key] ?? "C"),
    mutation: blueprint.mutationKey,
    inherited: blueprint.loci.map((row) => row.expressed.cardFamily),
    chassis,
    body,
    head,
  };
}

function rankScore(rank: GeneRank): number {
  return Math.max(0, GENE_RANKS.indexOf(rank));
}

function pickFunction(rng: RandomService, allowed: readonly CardKitFunction[], profile: Profile, locus: GeneticCardLocusKey): CardKitFunction {
  if (locus === "G2" && (profile.paths.includes("agile") || profile.paths.includes("wings") || profile.gene("SPD") >= 5)) {
    return "MOBILITY";
  }
  if (locus === "G4" && (profile.paths.includes("tank") || profile.gene("DEF") >= 5)) {
    return "SHIELD";
  }
  if (locus === "G8" && (profile.paths.includes("arcane") || profile.gene("MAG") >= 5)) {
    return "SUPPORT";
  }
  if (locus === "G8" && profile.gene("HP") >= 5) {
    return "HEAL";
  }
  return rng.pick([...allowed]);
}

function buildCard(input: {
  rng: RandomService;
  locus: GeneticCardLocusKey;
  role: (typeof GENETIC_CARD_LOCI)[number]["role"];
  fn: CardKitFunction;
  slot: (typeof cardKitSlots)[GeneticCardLocusKey];
  luck: number;
  profile: Profile;
  blueprint: CreatureBlueprint;
  parents: ParentKitHint[];
  names: Set<string>;
}): CardKitManifest {
  const hybrid = hybridElement(input.profile, input.parents, input.rng);
  const element = hybrid ?? input.profile.element;
  const catalog = nearestCatalog(input.blueprint.speciesKey, input.role, element);
  const quality = 0.72 + input.luck * 0.28 + input.profile.gene(geneFor(input.fn)) * 0.03;
  const cost = clampCardCost(input.slot.cost + (input.luck > 0.85 && input.slot.cost < 4 ? 1 : 0) - (input.luck < 0.2 && input.slot.cost > 1 ? 1 : 0));
  const effects = clampEffectsToBudget(effectsFor(input.fn, element, input.profile, input.locus, quality, input.rng), input.slot.budget) as CardEffectDef[];
  const target = targetFor(input.fn, input.locus, input.profile);
  const namePt = uniqueName(input.rng, element, input.fn, input.profile.paths, input.names, input.locus);
  const derived: CardKitDerived = {
    element,
    secondary: input.profile.secondary ?? null,
    species: input.profile.species,
    head: input.profile.head,
    body: input.profile.body,
    eyes: input.profile.chassis?.eyes?.d ?? null,
    horns: input.profile.chassis?.horns?.d ?? null,
    limbs: input.profile.chassis?.limbs?.d ?? null,
    back: input.profile.chassis?.back?.d ?? null,
    tail: input.profile.chassis?.tail?.d ?? null,
    mutation: input.profile.mutation ?? null,
    inherited: input.parents.flatMap((row) => row.families).slice(0, 6),
    luckRoll: input.luck,
    powerBudget: input.slot.budget,
    generatorVersion: CARD_GEN_VERSION,
  };
  return {
    cardFamily: catalog?.key ?? `gxr-kit:${element.toLowerCase()}:${input.fn.toLowerCase()}`,
    variant: CARD_GEN_VERSION,
    element,
    powerExpression: String(effects.find((row) => row.value)?.value ?? 10),
    energyExpression: String(cost),
    speedExpression: input.fn === "MOBILITY" ? "FAST" : "NORMAL",
    statusExpression: effects.find((row) => row.status)?.status ?? "NONE",
    targetExpression: target,
    modifierGenes: [...input.profile.paths],
    mutationState: input.profile.mutation ?? "NONE",
    generatorVersion: CARD_GEN_VERSION,
    locus: input.locus,
    name: namePt,
    namePt,
    cost,
    targetType: target,
    effects,
    text: describeEffects(effects) + targetPhrase(target),
    function: input.fn,
    tier: input.slot.tier,
    locusRole: input.role,
    luckRoll: input.luck,
    powerBudget: input.slot.budget,
    derivedFrom: derived,
  };
}

function hybridElement(profile: Profile, parents: ParentKitHint[], rng: RandomService): Element | null {
  const mutation = profile.mutation ? MUTATION_STATUS[profile.mutation] : undefined;
  if (mutation && mutation.element !== profile.element && rng.chance(0.55)) {
    return mutation.element;
  }
  if (profile.secondary && profile.secondary !== profile.element && rng.chance(0.28)) {
    return profile.secondary;
  }
  const foreign = parents.find((row) => row.element !== profile.element);
  if (foreign && rng.chance(0.22) && (profile.mutation || profile.secondary === foreign.element)) {
    return foreign.element;
  }
  return null;
}

function nearestCatalog(speciesKey: string, role: (typeof GENETIC_CARD_LOCI)[number]["role"], element: Element) {
  return (
    cardsForLocus(speciesKey, role)[0] ??
    cardsForSpecies(speciesKey).find((row) => row.element === element) ??
    cardsForSpecies(speciesKey)[0] ??
    getCardDefinition("spark_jolt")
  );
}

function geneFor(fn: CardKitFunction): GeneKey {
  if (fn === "SHIELD" || fn === "DEFENSE" || fn === "COUNTER") return "DEF";
  if (fn === "CONTROL" || fn === "DEBUFF" || fn === "SUPPORT") return "MAG";
  if (fn === "MOBILITY") return "SPD";
  if (fn === "HEAL" || fn === "SUSTAIN") return "HP";
  if (fn === "EXECUTE") return "CRIT";
  return "ATK";
}

function effectsFor(
  fn: CardKitFunction,
  element: Element,
  profile: Profile,
  locus: GeneticCardLocusKey,
  quality: number,
  rng: RandomService,
): CardEffectDef[] {
  const status = profile.mutation && MUTATION_STATUS[profile.mutation] && (element === MUTATION_STATUS[profile.mutation]!.element || rng.chance(0.35))
    ? MUTATION_STATUS[profile.mutation]!.status
    : ELEMENT_STATUS[element];
  const dmg = Math.max(8, Math.round(10 + quality * 10 + profile.gene("ATK")));
  const shield = Math.max(8, Math.round(10 + quality * 8 + profile.gene("DEF")));
  const heal = Math.max(6, Math.round(8 + quality * 6 + profile.gene("HP") * 0.6));
  const duration = 1 + (quality > 0.88 ? 1 : 0);
  switch (fn) {
    case "ATTACK":
      return locus === "G9" || locus === "G10"
        ? [{ op: "DAMAGE", value: dmg + 6 }, { op: "APPLY_STATUS", status, duration }]
        : [{ op: "DAMAGE", value: dmg }];
    case "MOBILITY":
      return [{ op: "DAMAGE", value: Math.round(dmg * 0.7) }, { op: "GAIN_MOMENTUM", value: 1 }];
    case "DOT":
      return [{ op: "DAMAGE", value: Math.round(dmg * 0.65) }, { op: "APPLY_STATUS", status, duration: duration + 1 }];
    case "AOE":
      return [{ op: "DAMAGE", value: Math.round(dmg * 0.85) }, { op: "APPLY_STATUS", status, duration }];
    case "SHIELD":
    case "DEFENSE":
      return [{ op: "SHIELD", value: shield }];
    case "COUNTER":
      return [{ op: "SHIELD", value: Math.round(shield * 0.6) }, { op: "DAMAGE", value: Math.round(dmg * 0.55) }];
    case "CONTROL":
    case "DEBUFF":
      return [{ op: "APPLY_STATUS", status, duration: duration + 1 }, { op: "DAMAGE", value: Math.round(dmg * 0.45) }];
    case "BUFF":
    case "UTILITY":
      return rng.chance(0.5) ? [{ op: "GAIN_ENERGY", value: 1 }] : [{ op: "GAIN_MOMENTUM", value: 1 }];
    case "HEAL":
    case "SUSTAIN":
      return [{ op: "HEAL", value: heal }];
    case "SUPPORT":
      return [{ op: "SHIELD", value: Math.round(shield * 0.5) }, { op: "HEAL", value: Math.round(heal * 0.5) }];
    case "EXECUTE":
      return [{ op: "DAMAGE", value: dmg + 8 }];
    default:
      return [{ op: "DAMAGE", value: dmg }];
  }
}

function targetFor(fn: CardKitFunction, locus: GeneticCardLocusKey, profile: Profile): CardTargetType {
  if (fn === "SHIELD" || fn === "DEFENSE" || fn === "BUFF" || fn === "UTILITY" || fn === "COUNTER") {
    return "SELF";
  }
  if (fn === "HEAL" || fn === "SUPPORT" || fn === "SUSTAIN") {
    return profile.paths.includes("tank") || locus === "G8" ? "ALLY" : "SELF";
  }
  if (fn === "AOE" || locus === "G10") {
    return "ALL_ENEMIES";
  }
  return "ENEMY";
}

function targetPhrase(target: CardTargetType): string {
  if (target === "SELF") return " em você.";
  if (target === "ALLY") return " num aliado.";
  if (target === "ALL_ENEMIES") return " em todos os inimigos.";
  if (target === "ALL_ALLIES") return " em todos os aliados.";
  return " no inimigo.";
}

function uniqueName(
  rng: RandomService,
  element: Element,
  fn: CardKitFunction,
  tags: readonly string[],
  taken: Set<string>,
  locus: GeneticCardLocusKey,
): string {
  const { nouns, adjs } = kitNameParts(element, fn, tags);
  for (let i = 0; i < 12; i += 1) {
    const name = `${rng.pick(nouns)} ${rng.pick(adjs)}`;
    if (!taken.has(name)) {
      return name;
    }
  }
  return `${rng.pick(nouns)} ${locus}`;
}

export function kitCardType(card: CardKitManifest): "ATTACK" | "SKILL" | "REACTION" | "ULTIMATE" | "GENETIC" | "SYNERGY" {
  if (card.tier === "SUPREME") return "ULTIMATE";
  if (card.function === "COUNTER") return "REACTION";
  if (card.function === "ATTACK" || card.function === "EXECUTE" || card.function === "AOE" || card.function === "DOT") {
    return "ATTACK";
  }
  if (card.function === "SUPPORT" || card.tier === "SYNERGY") return "SYNERGY";
  return "SKILL";
}

export function kitToDefinition(card: CardKitManifest) {
  return {
    key: card.cardFamily,
    name: card.namePt,
    type: kitCardType(card),
    cost: card.cost,
    rank: card.cost,
    element: card.element as Element,
    targetType: card.targetType,
    locusRole: card.locusRole,
    tags: [card.function, card.tier] as readonly string[],
    visualTags: [...card.modifierGenes] as readonly string[],
    species: [] as string[],
    effects: card.effects,
    ability: card.ability,
  };
}
