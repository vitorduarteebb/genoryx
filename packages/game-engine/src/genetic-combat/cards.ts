import {
  cardKitSlots,
  clampCardCost,
  describeEffects,
  elementStatus,
  type CardEffectDef,
  type CardKitFunction,
  type CardKitTier,
} from "@nexora/config";
import { GENETIC_CARD_LOCI, type CardTargetType, type Element, type GeneticCardLocusKey } from "@nexora/types";
import type { CreatureBlueprint } from "../genes/generate";
import { createSeededRandom, type RandomService } from "../random/random-service";
import { kitNameParts } from "../cards/kit-lexicon";
import { cardPowerBudget, clampIdentityEffects, clampMagnitude, luckVariant } from "./budget";
import { subSeed } from "./seeds";
import type { AbilityGraph, BirthRolls, CombatIdentity, GeneticCardManifest, GeneticExpression } from "./types";

function pickFn(rng: RandomService, allowed: readonly CardKitFunction[], identity: CombatIdentity, locus: GeneticCardLocusKey): CardKitFunction {
  if (locus === "G4" && allowed.includes("SHIELD")) return "SHIELD";
  if (locus === "G7" && allowed.includes("COUNTER")) return "COUNTER";
  if (locus === "G1" && allowed.includes("ATTACK")) return "ATTACK";
  if (locus === "G2" && identity.verbs.some((row) => ["DODGE", "FLIGHT", "LEAP", "REPOSITION"].includes(row))) return "MOBILITY";
  if (locus === "G8" && identity.quirks.some((row) => row.key === "SYMBIOTIC")) return "HEAL";
  if (locus === "G9" && identity.archetype === "PREDATOR") return "EXECUTE";
  if (locus === "G6" && identity.verbs.includes("CONTROL")) return "CONTROL";
  return rng.pick([...allowed]);
}

function targetFor(fn: CardKitFunction, locus: GeneticCardLocusKey, identity: CombatIdentity): CardTargetType {
  if (fn === "SHIELD" || fn === "DEFENSE" || fn === "COUNTER" || fn === "BUFF" || fn === "UTILITY") return "SELF";
  if (fn === "HEAL" || fn === "SUPPORT" || fn === "SUSTAIN") return identity.quirks.some((row) => row.key === "SYMBIOTIC") ? "ALLY" : "SELF";
  if (fn === "AOE" || locus === "G10") return "ALL_ENEMIES";
  return "ENEMY";
}

function buildClauses(input: {
  fn: CardKitFunction;
  locus: GeneticCardLocusKey;
  identity: CombatIdentity;
  element: Element;
  rolls: BirthRolls;
  rng: RandomService;
  damage: number;
  shield: number;
  heal: number;
}): CardEffectDef[] {
  const status = elementStatus[input.element] ?? "MARKED";
  const resource = input.identity.resource.id;
  const stubborn = input.identity.quirks.some((row) => row.key === "STUBBORN") || input.rolls.coherence < 42;
  const cold = input.identity.quirks.some((row) => row.key === "COLD_BLOODED") || input.rolls.efficiency < 38;
  const front: CardEffectDef["condition"] = stubborn && ["G1", "G3", "G9"].includes(input.locus) ? { selfPosition: "FRONT" } : undefined;
  const needStatus: CardEffectDef["condition"] = cold && ["G5", "G6", "G10"].includes(input.locus) ? { targetHas: status } : undefined;
  const clauses: CardEffectDef[] = [];
  switch (input.fn) {
    case "ATTACK":
    case "EXECUTE":
      clauses.push({ op: "DAMAGE", value: input.damage, condition: front ?? needStatus });
      if (input.locus === "G9" || input.locus === "G3") clauses.push({ op: "APPLY_STATUS", status, duration: 2 });
      break;
    case "MOBILITY":
      clauses.push({ op: "DAMAGE", value: Math.round(input.damage * 0.72) });
      clauses.push({ op: "GAIN_MOMENTUM", value: 1 });
      break;
    case "DOT":
      clauses.push({ op: "DAMAGE", value: Math.round(input.damage * 0.62) });
      clauses.push({ op: "APPLY_STATUS", status, duration: 3 });
      break;
    case "AOE":
      clauses.push({ op: "DAMAGE", value: Math.round(input.damage * 0.82), condition: needStatus });
      clauses.push({ op: "APPLY_STATUS", status, duration: 2 });
      break;
    case "SHIELD":
    case "DEFENSE":
      clauses.push({ op: "SHIELD", value: input.shield, condition: front });
      break;
    case "COUNTER":
      clauses.push({ op: "SHIELD", value: Math.round(input.shield * 0.6) });
      clauses.push({ op: "DAMAGE", value: Math.round(input.damage * 0.55), condition: { targetHas: status } });
      break;
    case "CONTROL":
    case "DEBUFF":
      clauses.push({ op: "APPLY_STATUS", status, duration: 2 });
      clauses.push({ op: "DAMAGE", value: Math.round(input.damage * 0.42) });
      break;
    case "BUFF":
    case "UTILITY":
      clauses.push(input.rng.chance(0.5) ? { op: "GAIN_ENERGY", value: 1 } : { op: "GAIN_MOMENTUM", value: 1 });
      break;
    case "HEAL":
    case "SUSTAIN":
      clauses.push({ op: "HEAL", value: input.heal });
      break;
    case "SUPPORT":
      clauses.push({ op: "SHIELD", value: Math.round(input.shield * 0.5) });
      clauses.push({ op: "HEAL", value: Math.round(input.heal * 0.5) });
      break;
    default:
      clauses.push({ op: "DAMAGE", value: input.damage });
  }
  const consumeRule = input.identity.resource.consumptionRules?.find((row) => row.cardGrade === input.locus);
  if (consumeRule) {
    const amount = consumeRule.amount === "ALL" ? input.identity.resource.maxStacks : consumeRule.amount;
    const need = consumeRule.require ?? (consumeRule.upTo ? 1 : amount);
    clauses.unshift({
      op: "CONSUME_RESOURCE",
      value: amount,
      resource,
      condition: { resourceAtLeast: need },
    });
    if (consumeRule.upTo && input.fn === "ATTACK") {
      clauses.push({ op: "DAMAGE", value: 8, condition: { resourceAtLeast: 1 } });
    }
  }
  return clauses;
}

function graphOf(clauses: CardEffectDef[], target: CardTargetType, identity: CombatIdentity, genes: string[]): AbilityGraph {
  const produces = [...new Set(clauses.flatMap((row) => [row.status, row.op === "GAIN_RESOURCE" ? row.resource : undefined]).filter((row): row is string => Boolean(row)))];
  const consumes = clauses.filter((row) => row.op === "CONSUME_RESOURCE").map((row) => row.resource).filter((row): row is string => Boolean(row));
  const positions = [...new Set(clauses.map((row) => row.condition?.selfPosition).filter((row): row is string => Boolean(row)))];
  return {
    trigger: "PLAYED",
    target,
    clauses,
    produces,
    consumes,
    reactsTo: clauses.map((row) => row.condition?.targetHas).filter((row): row is string => Boolean(row)),
    requires: consumes,
    positions,
    sourceGenes: genes,
  };
}

export function generateIdentityCards(input: {
  blueprint: CreatureBlueprint;
  identity: CombatIdentity;
  expression: GeneticExpression;
  rolls: BirthRolls;
  birthSeed: number;
  retryIndex?: number;
}): GeneticCardManifest[] {
  const rng = createSeededRandom(subSeed(input.birthSeed, `cards:${input.retryIndex ?? 0}`));
  const names = new Set<string>();
  return GENETIC_CARD_LOCI.map((locus) => {
    const slot = cardKitSlots[locus.key];
    const fn = pickFn(rng, slot.functions, input.identity, locus.key);
    const luck = luckVariant(input.rolls, rng);
    let cost = slot.cost;
    if (luck === "UNSTABLE") cost = clampCardCost(cost + 1);
    if (luck === "EFFICIENT") cost = clampCardCost(cost - 1);
    if (locus.key === "G1" || locus.key === "G2") cost = Math.min(2, cost);
    if (locus.key === "G10") cost = Math.max(3, cost);
    const budget = cardPowerBudget(slot.tier, cost, luck);
    const damage = clampMagnitude(slot.tier, "DAMAGE", input.rolls.potency);
    const shield = clampMagnitude(slot.tier, "SHIELD", input.rolls.potency);
    const heal = clampMagnitude(slot.tier, "HEAL", input.rolls.potency);
    const target = targetFor(fn, locus.key, input.identity);
    const raw = buildClauses({
      fn,
      locus: locus.key,
      identity: input.identity,
      element: input.blueprint.elementPrimary,
      rolls: input.rolls,
      rng,
      damage,
      shield,
      heal,
    });
    const clauses = clampIdentityEffects(raw, slot.budget);
    const ability = graphOf(clauses, target, input.identity, [
      input.blueprint.elementPrimary,
      input.identity.resource.id,
      ...input.identity.verbs.slice(0, 2),
    ]);
    void budget;
    const { nouns, adjs } = kitNameParts(input.blueprint.elementPrimary, fn, input.identity.verbs.map((row) => row.toLowerCase()));
    let namePt = `${rng.pick(nouns)} ${rng.pick(adjs)}`;
    let guard = 0;
    while (names.has(namePt) && guard < 16) {
      namePt = `${rng.pick(nouns)} ${rng.pick(adjs)} ${locus.key}`;
      guard += 1;
    }
    if (names.has(namePt)) {
      namePt = `${rng.pick(nouns)} ${locus.key}`;
    }
    names.add(namePt);
    const timingClass =
      fn === "COUNTER" ? "COUNTER" : fn === "MOBILITY" ? "IMPETUS" : locus.key === "G10" ? "RITUAL" : locus.key === "G8" && fn === "SUPPORT" ? "CHANNEL" : locus.key === "G4" ? "PREPARATION" : "ACTION";
    if (timingClass === "IMPETUS" && clauses.some((row) => row.op === "DAMAGE" && row.value)) {
      const dmg = clauses.find((row) => row.op === "DAMAGE");
      if (dmg?.value) dmg.value = Math.max(6, Math.round(dmg.value * 0.82));
    }
    return {
      locus: locus.key,
      tier: slot.tier as CardKitTier,
      function: fn,
      namePt,
      cost,
      element: input.blueprint.elementPrimary,
      targetType: target,
      effects: clauses,
      ability,
      text: describeEffects(clauses),
      sourceGenes: ability.sourceGenes,
      luckVariant: luck,
      timingClass: timingClass as GeneticCardManifest["timingClass"],
    };
  });
}
