import { combatMatrixConfig } from "@nexora/config";
import type { Typology } from "@nexora/types";

const FUNCTIONAL = combatMatrixConfig.functionalTypologies as readonly string[];

/** Função/tier de carta e tags de alvo. Não inclui anatomia de chassi. */
const COMBAT_TAG = new Set([
  "ATTACK",
  "DEFENSE",
  "BUFF",
  "DEBUFF",
  "CONTROL",
  "HEAL",
  "SHIELD",
  "UTILITY",
  "COUNTER",
  "MOBILITY",
  "DOT",
  "AOE",
  "EXECUTE",
  "SUSTAIN",
  "SUPPORT",
  "FOUNDATION",
  "SPECIALIZATION",
  "SYNERGY",
  "ADVANCED",
  "SIGNATURE",
  "SUPREME",
  "BACKLINE",
  "PIERCE",
  "LIVING_FURNACE",
]);

export function isFunctionalTypology(tag: string | undefined | null): tag is Typology {
  return Boolean(tag && FUNCTIONAL.includes(tag));
}

/** Tipologia de combate da carta: dono da carta, nunca a função (HEAL/CONTROL) nas tags. */
export function canonicalPlayTypology(input: { typology?: string; tags?: readonly string[] }): Typology | undefined {
  if (isFunctionalTypology(input.typology)) {
    return input.typology;
  }
  return undefined;
}

export function combatMechanicTags(input: { typology?: string; tags?: readonly string[] }): string[] {
  const typology = canonicalPlayTypology(input);
  const tags: string[] = [];
  if (typology) {
    tags.push(typology);
  }
  for (const tag of input.tags ?? []) {
    if (!tag || tag === typology) {
      continue;
    }
    if (isFunctionalTypology(tag)) {
      continue;
    }
    if (COMBAT_TAG.has(tag)) {
      tags.push(tag);
    }
  }
  return [...new Set(tags)];
}

const TARGET_TAG = new Set([
  "BACKLINE",
  "PIERCE",
  "PIERCE_FORMATION",
  "MOBILITY",
  "AOE",
  "EXECUTE",
  "PREDATOR",
  "ASSASSIN",
  "RANGED",
  "RANGED_ACCESS",
  "IGNORE_FRONTLINE",
  "ASSASSIN_ACCESS",
  "TRUE_PIERCE",
  "IGNORE_TAUNT",
  "PULL",
  "TARGET_LOWEST_HP",
  "CONTROL",
  "BACKLINE_ACCESS",
]);

export function targetingTags(tags: readonly string[] = []): string[] {
  return tags.filter((tag) => TARGET_TAG.has(tag));
}
