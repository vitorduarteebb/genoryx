import { genomeV2, type GenomeCardSpeed, type GenomeCondition, type GenomeDomain, type GenomeHook } from "@nexora/config";
import type { PlayableCard } from "../types";

export type GenomeProfile = {
  domain: GenomeDomain;
  speed: GenomeCardSpeed;
  flat: number;
  scale: number;
  healScale: number;
  shieldScale: number;
  tags: string[];
  conditions: GenomeCondition[];
  hooks: GenomeHook[];
  range: string[];
  rulesText: string;
  flavorText: string;
  cardKey: string;
};

const ELEMENTAL = new Set(["FIRE", "WATER", "NATURE", "ELECTRIC", "ICE", "LIGHT", "DARK", "ARCANE"]);

export function hydrateGenomeProfile(card: PlayableCard | null | undefined, locus?: string | null): GenomeProfile {
  const tags = [...(card?.tags ?? [])];
  const effects = card?.effects ?? [];
  const hasDamage = effects.some((row) => row.op === "DAMAGE");
  const flat = effects.find((row) => row.op === "DAMAGE")?.value ?? effects.find((row) => row.op === "HEAL" || row.op === "SHIELD")?.value ?? 0;
  const domain = inferDomain(card, tags, hasDamage);
  const speed = inferSpeed(card, tags, locus);
  const range = inferRange(tags, card?.targetType);
  const conditions = inferConditions(card, tags);
  const hooks = inferHooks(tags, card?.type);
  const scale = genomeV2.damage.legacyScale;
  const profile: GenomeProfile = {
    domain,
    speed,
    flat,
    scale,
    healScale: genomeV2.damage.healScale,
    shieldScale: genomeV2.damage.shieldScale,
    tags: unique([...tags, domain, speed, ...range]),
    conditions,
    hooks,
    range,
    rulesText: "",
    flavorText: card?.name ? `${card.name} ainda carrega a leitura original do kit.` : "",
    cardKey: card?.key ?? "unknown",
  };
  profile.rulesText = rulesText(profile, card);
  return profile;
}

function inferDomain(card: PlayableCard | null | undefined, tags: string[], hasDamage: boolean): GenomeDomain {
  if (tags.includes("PHYSICAL")) return "PHYSICAL";
  if (tags.includes("MAGIC") || tags.includes("MAGICAL")) return "MAGIC";
  if (tags.includes("HYBRID")) return "HYBRID";
  if (tags.includes("UTILITY") && !hasDamage) return "UTILITY";
  const fantasy = card?.name
    ? (() => {
        const lower = card.name.toLowerCase();
        if (/mordida|golpe|investida|presa|cornada|chicote|espinho/.test(lower)) return "PHYSICAL" as const;
        if (/véu|égide|muralha|guarda|casca|pulso|pacto|passo|abertura|troca/.test(lower) && !hasDamage) return "UTILITY" as const;
        return null;
      })()
    : null;
  if (fantasy) return fantasy;
  if (!hasDamage && card?.type !== "ATTACK") return "UTILITY";
  if (card?.element && ELEMENTAL.has(card.element) && !tags.includes("PHYSICAL")) return "MAGIC";
  return hasDamage || card?.type === "ATTACK" ? "PHYSICAL" : "UTILITY";
}

function inferSpeed(card: PlayableCard | null | undefined, tags: string[], locus?: string | null): GenomeCardSpeed {
  if (tags.includes("VERY_FAST")) return "VERY_FAST";
  if (tags.includes("HEAVY")) return "HEAVY";
  if (tags.includes("FAST")) return "FAST";
  if (card?.type === "REACTION" || locus === "G7" || card?.locusRole === "REACTION" || tags.includes("COUNTER")) return "VERY_FAST";
  if (tags.includes("IMPETUS") || tags.includes("MOBILITY") || tags.includes("DODGE") || tags.includes("INTERCEPT")) return "FAST";
  if (locus === "G10" || card?.type === "ULTIMATE" || card?.locusRole === "ULTIMATE") return "HEAVY";
  return "NORMAL";
}

function inferRange(tags: string[], targetType?: string) {
  const known = ["MELEE", "RANGED", "LEAP", "FLIGHT", "PULL", "PUSH", "GRAPPLE", "BREATH", "ROAR"].filter((tag) => tags.includes(tag));
  if (known.length) return known;
  if (targetType === "ALL_ENEMIES" || targetType === "ALL_ALLIES") return ["ROAR"];
  return ["MELEE"];
}

function inferConditions(card: PlayableCard | null | undefined, tags: string[]): GenomeCondition[] {
  const found: GenomeCondition[] = [];
  const effects = card?.effects ?? [];
  if (effects.some((row) => row.condition?.selfPosition === "FRONT") || tags.includes("FRONT")) found.push("IF_SELF_FRONT");
  if (effects.some((row) => row.condition?.selfPosition === "BACK") || tags.includes("BACK")) found.push("IF_SELF_BACK");
  if (effects.some((row) => row.condition?.targetHas === "BURN") || tags.includes("BURN")) found.push("IF_TARGET_BURNING");
  if (effects.some((row) => row.condition?.targetHas === "SHOCK")) found.push("IF_TARGET_SHOCKED");
  if (effects.some((row) => row.condition?.targetHas === "MARK") || tags.includes("MARK") || tags.includes("HUNT")) found.push("IF_TARGET_MARKED");
  if (effects.some((row) => row.condition?.targetHpBelow)) found.push("IF_SELF_LOW_HP");
  if (effects.some((row) => row.condition?.resourceAtLeast)) found.push("IF_RESOURCE_AT_LEAST");
  if (tags.includes("PREDATOR") || tags.includes("EXECUTE")) found.push("IF_PREC_GREATER_THAN_TARGET_EVA");
  if (tags.includes("GUARD_BREAK")) found.push("IF_TARGET_GUARDED");
  return unique(found);
}

function inferHooks(tags: string[], type?: string): GenomeHook[] {
  const hooks: GenomeHook[] = ["ON_HIT"];
  if (type === "REACTION" || tags.includes("COUNTER")) hooks.push("BEFORE_HIT", "ON_DODGE");
  if (tags.includes("GUARD") || tags.includes("SHIELD")) hooks.push("ON_GUARD");
  if (tags.includes("CLEANSE") || tags.includes("DISPEL")) hooks.push("ON_STATUS_REMOVED");
  if (tags.includes("MARK") || tags.includes("BURN") || tags.includes("POISON")) hooks.push("ON_STATUS_APPLIED");
  return unique(hooks);
}

function rulesText(profile: GenomeProfile, card: PlayableCard | null | undefined) {
  const domain = genomeV2.domainLabel[profile.domain];
  const speed = genomeV2.speedLabel[profile.speed];
  if (profile.domain === "UTILITY") {
    return `Detalhes: ${domain} · ${speed}. Sem escala de ATK.`;
  }
  if (profile.domain === "MAGIC") {
    return `Detalhes: escala ${Math.round(profile.scale * 100)}% MAG · enfrenta RES · ${speed}.`;
  }
  if (profile.domain === "HYBRID") {
    return `Detalhes: escala ATK+MAG · ${speed}.`;
  }
  return `Detalhes: escala ${Math.round(profile.scale * 100)}% ATK · enfrenta DEF · ${speed}.`;
}

function unique<T>(rows: T[]) {
  return [...new Set(rows)];
}
