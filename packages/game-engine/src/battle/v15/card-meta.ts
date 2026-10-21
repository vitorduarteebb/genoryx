import type { RetargetPolicy } from "@nexora/config";
import type { CardInstance, PlayableCard } from "../types";

export type EffectMeta = {
  produces: string[];
  consumes: string[];
  reactsTo: string[];
  transforms: string[];
  requires: string[];
  retargetPolicy: RetargetPolicy;
};

function unique(rows: string[]): string[] {
  return [...new Set(rows.filter(Boolean))];
}

const TAG_PRODUCES: Record<string, string> = {
  HEAL: "HEAL",
  SHIELD: "GUARD",
  DEFENSE: "GUARD",
  BURN: "BURN",
  DOT: "DOT",
  CONTROL: "CONTROL",
  TANK: "TANK",
  DEBUFF: "MARK",
};

const TAG_CONSUMES: Record<string, readonly string[]> = {
  SYNERGY: ["HEAL", "GUARD", "TANK", "CONTROL", "BURN", "DOT", "HIT"],
  SUSTAIN: ["HEAL", "GUARD"],
  ADVANCED: ["HIT", "GUARD", "HEAL"],
  EXECUTE: ["MARK", "EXPOSED", "HIT"],
  COUNTER: ["HIT"],
  REACTION: ["HIT"],
};

export function effectMetaOf(card: PlayableCard | null | undefined): EffectMeta {
  const ability = card?.ability;
  const produces = [...(ability?.produces ?? [])];
  const consumes = [...(ability?.consumes ?? [])];
  const reactsTo = [...(ability?.reactsTo ?? [])];
  const transforms = [...(ability?.transforms ?? [])];
  const requires = [...(ability?.requires ?? [])];
  for (const effect of card?.effects ?? []) {
    if (effect.op === "APPLY_STATUS" && effect.status) {
      produces.push(effect.status);
    }
    if (effect.op === "DAMAGE") {
      produces.push("HIT");
    }
    if (effect.op === "HEAL") {
      produces.push("HEAL");
    }
    if (effect.op === "GAIN_SHIELD" || effect.op === "SHIELD") {
      produces.push("GUARD");
    }
    if (effect.condition?.targetHas) {
      reactsTo.push(effect.condition.targetHas);
    }
    if (effect.op === "CONSUME_RESOURCE" && effect.resource) {
      consumes.push(effect.resource);
    }
  }
  if (card?.typology) {
    produces.push(card.typology);
  }
  const tags = card?.tags ?? [];
  for (const tag of tags) {
    const token = TAG_PRODUCES[tag];
    if (token) {
      produces.push(token);
    }
    const needed = TAG_CONSUMES[tag];
    if (needed) {
      consumes.push(...needed);
    }
  }
  let retarget: RetargetPolicy = "NONE";
  if (tags.includes("RETARGET_NEAREST") || tags.includes("NEAREST_VALID")) retarget = "NEAREST_VALID";
  else if (tags.includes("RETARGET_SAME_LINE") || tags.includes("SAME_LINE")) retarget = "SAME_LINE";
  else if (tags.includes("RETARGET_LOWEST_HP") || tags.includes("LOWEST_HP_VALID")) retarget = "LOWEST_HP_VALID";
  else if (tags.includes("RETARGET_MARKED") || tags.includes("MARKED_VALID")) retarget = "MARKED_VALID";
  else if (ability?.retargetPolicy) retarget = ability.retargetPolicy;
  return {
    produces: unique(produces),
    consumes: unique(consumes),
    reactsTo: unique(reactsTo),
    transforms: unique(transforms),
    requires: unique(requires),
    retargetPolicy: retarget,
  };
}

export function isReactionCard(card: PlayableCard | null | undefined): boolean {
  const type = card?.type;
  if (type === "REACTION") return true;
  const tags = card?.tags ?? [];
  return tags.includes("REACTION") || tags.includes("COUNTER") || tags.includes("INTERCEPT");
}

export function sourceIdOf(card: CardInstance | undefined): string | undefined {
  return card?.sourceCreatureId;
}
