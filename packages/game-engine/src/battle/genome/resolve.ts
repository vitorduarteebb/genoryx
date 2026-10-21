import { combatConfig, genomeV2, type GenomeCardSpeed, type GenomeCondition, type GenomeDomain } from "@nexora/config";
import type { GeneRank } from "@nexora/types";
import type { RandomService } from "../../random/random-service";
import type { Combatant } from "../types";
import type { GenomeProfile } from "./profile";
import { precisionPoints, rankIndex, rankOf } from "./ranks";

export type StrikeInput = {
  actor?: Combatant;
  target: Combatant;
  profile: GenomeProfile;
  flat: number;
  elementMul: number;
  hostile: boolean;
  rng: RandomService;
  allyAppliedStatus?: boolean;
  targetAlreadyHit?: boolean;
};

export type StrikeResult = {
  missed: boolean;
  hitChance: number;
  damage: number;
  crit: boolean;
  breakdown: Record<string, number>;
  logs: string[];
  guardBroken: boolean;
  dodged: boolean;
  statusPotencyMul: number;
  statusDurationDelta: number;
  overcharge: boolean;
};

export function cardSpeedBonus(speed: GenomeCardSpeed, tags: readonly string[], spdRank: GeneRank) {
  let bonus = genomeV2.cardSpeedBonus[speed];
  if (tags.includes("QUICK") && speed === "NORMAL" && rankIndex(spdRank) >= rankIndex("A")) {
    bonus = genomeV2.cardSpeedBonus.FAST;
  }
  return bonus;
}

export function initiativeOf(input: {
  actor?: Combatant;
  speed: GenomeCardSpeed;
  tags: readonly string[];
  seed: number;
  instanceId: string;
  counterReady?: boolean;
}) {
  const spd = input.actor?.spd ?? 0;
  const spdRank = rankOf(input.actor?.genes, "SPD");
  let bonus = cardSpeedBonus(input.speed, input.tags, spdRank);
  const logs: string[] = [];
  if (input.actor && !input.actor.spdOpeningUsed && rankIndex(spdRank) >= rankIndex("S")) {
    const opening = spdRank === "SS" ? genomeV2.breakpoints.spdSsOpening : genomeV2.breakpoints.spdSOpening;
    bonus += opening;
    input.actor.spdOpeningUsed = true;
    logs.push(`SPD ${spdRank}: +${opening} de iniciativa na primeira carta.`);
  }
  if (input.counterReady) {
    bonus += genomeV2.breakpoints.evaSCounterInitiative;
    logs.push(`Janela de contra (EVA S): +${genomeV2.breakpoints.evaSCounterInitiative} de iniciativa.`);
  }
  const tie = Math.abs(hashTie(input.seed, input.instanceId)) % 3;
  return { initiative: spd + bonus + tie, logs };
}

function hashTie(seed: number, id: string) {
  let hash = seed | 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 33 + id.charCodeAt(i)) | 0;
  return hash;
}

export function hitChance(actor: Combatant | undefined, target: Combatant, profile: GenomeProfile) {
  if (!actor || profile.tags.includes("INEVITABLE")) return 1;
  const prec = precisionPoints(rankOf(actor.genes, "PRECISION"));
  let eva = precisionPoints(rankOf(target.genes, "EVASION"));
  if (target.statuses.some((row) => row.key === "MARK" || row.key === "MARKED")) {
    eva = Math.max(0, eva - genomeV2.counterplay.markEvaPenalty);
  }
  let bonus = 0;
  if (profile.tags.includes("AIM") && rankIndex(rankOf(actor.genes, "PRECISION")) >= rankIndex("A")) bonus += genomeV2.hit.aimBonus;
  if (profile.tags.includes("PERFECT_AIM") || (profile.tags.includes("AIM") && rankIndex(rankOf(actor.genes, "PRECISION")) >= rankIndex("S"))) {
    bonus += genomeV2.hit.perfectAimBonus;
  }
  let chance = genomeV2.hit.base + (prec + bonus - eva) * genomeV2.hit.perPoint;
  chance = Math.min(genomeV2.hit.ceiling, Math.max(genomeV2.hit.floor, chance));
  if (profile.tags.includes("PERFECT_AIM") || (profile.tags.includes("AIM") && rankIndex(rankOf(actor.genes, "PRECISION")) >= rankIndex("S"))) {
    chance = Math.max(chance, genomeV2.hit.perfectAimFloor);
  }
  if (profile.tags.includes("INEVITABLE")) return 1;
  return Math.round(chance * 1000) / 1000;
}

export function resolveStrike(input: StrikeInput): StrikeResult {
  const profile = input.profile;
  const chance = input.hostile && profile.domain !== "UTILITY" ? hitChance(input.actor, input.target, profile) : 1;
  const logs: string[] = [];
  if (input.hostile && profile.domain !== "UTILITY" && chance < 1 && input.rng.next() >= chance) {
    const prec = rankOf(input.actor?.genes, "PRECISION");
    const eva = rankOf(input.target.genes, "EVASION");
    logs.push(`Esquivou. Precisão ${prec} contra Evasão ${eva} (${Math.round(chance * 100)}%).`);
    if (rankIndex(eva) >= rankIndex("S") && input.target) input.target.counterReady = true;
    return emptyMiss(chance, logs);
  }
  if (input.hostile && profile.domain !== "UTILITY") {
    logs.push(`Acertou. Precisão ${rankOf(input.actor?.genes, "PRECISION")} contra Evasão ${rankOf(input.target.genes, "EVASION")} (${Math.round(chance * 100)}%).`);
  }
  return landStrike(input, chance, logs);
}

function emptyMiss(chance: number, logs: string[]): StrikeResult {
  return {
    missed: true,
    hitChance: chance,
    damage: 0,
    crit: false,
    breakdown: { hitChance: chance, missed: 1, final: 0 },
    logs,
    guardBroken: false,
    dodged: true,
    statusPotencyMul: 1,
    statusDurationDelta: 0,
    overcharge: false,
  };
}

function landStrike(input: StrikeInput, chance: number, logs: string[]): StrikeResult {
  const actor = input.actor;
  const target = input.target;
  const profile = input.profile;
  const domain = profile.domain === "UTILITY" ? "PHYSICAL" : profile.domain;
  let scale = profile.scale;
  let overcharge = false;
  if (domain === "MAGIC" && actor && rankIndex(rankOf(actor.genes, "MAG")) >= rankIndex("S")) {
    scale *= genomeV2.breakpoints.magSOvercharge;
    overcharge = true;
    logs.push("Overcharge (MAG S).");
  }
  const offense = offenseOf(actor, domain);
  const mitigationStat = mitigationOf(target, domain);
  const raw = input.flat + Math.round(offense * scale);
  const afterElement = Math.round(raw * input.elementMul);
  let mitigation = Math.round(mitigationStat * genomeV2.damage.mitigationRate);
  let guardBroken = false;
  if (domain === "PHYSICAL" && actor && rankIndex(rankOf(actor.genes, "ATK")) >= rankIndex("S") && target.statuses.some((row) => row.key === "GUARD")) {
    target.statuses = target.statuses.filter((row) => row.key !== "GUARD");
    guardBroken = true;
    mitigation = Math.round(mitigation * (1 - genomeV2.breakpoints.atkSShieldIgnore));
    logs.push("Guarda quebrada (ATK S).");
  }
  let dealt = Math.max(combatConfig.minDamageOnHit, afterElement - mitigation);
  const precPts = precisionPoints(rankOf(actor?.genes, "PRECISION"));
  const evaPts = precisionPoints(rankOf(target.genes, "EVASION"));
  if (profile.tags.includes("PREDATOR") && precPts > evaPts) {
    dealt = Math.round(dealt * genomeV2.damage.predatorBonus);
    logs.push("Predador.");
  }
  if (target.statuses.some((row) => row.key === "MARK" || row.key === "MARKED") && rankIndex(rankOf(actor?.genes, "STATUS")) >= rankIndex("S")) {
    dealt = Math.round(dealt * (1 + genomeV2.breakpoints.staEvolvedMarkBonus));
  }
  const heavy = actor && dealt >= Math.round(target.maxHp * genomeV2.breakpoints.defSHeavyRatio);
  if (heavy && !target.heavyGuardUsed && rankIndex(rankOf(target.genes, "DEF")) >= rankIndex("S") && domain === "PHYSICAL") {
    dealt = Math.max(combatConfig.minDamageOnHit, Math.round(dealt * (1 - genomeV2.breakpoints.defSReduction)));
    target.heavyGuardUsed = true;
    logs.push("DEF S: o primeiro golpe pesado perde parte do impacto.");
  }
  const critChance = actor?.crit ?? 0;
  const critMul = genomeV2.critDamageByRank[rankOf(actor?.genes, "CRIT_DAMAGE")];
  const crit = Boolean(actor && input.rng.next() < critChance);
  const finalDamage = crit ? Math.round(dealt * critMul) : dealt;
  if (crit) logs.push(`Crítico (${Math.round(critChance * 100)}% · ×${critMul.toFixed(2)} CDMG ${rankOf(actor?.genes, "CRIT_DAMAGE")}).`);
  const status = statusScale(actor, target);
  const label = domain === "MAGIC" ? "MAG" : domain === "HYBRID" ? "ATK+MAG" : "ATK";
  const resist = domain === "MAGIC" ? "RES" : domain === "HYBRID" ? "DEF/RES" : "DEF";
  logs.push(`${input.flat} + ${Math.round(scale * 100)}% ${label} → ${afterElement}, ${resist} −${mitigation} → ${finalDamage}.`);
  return {
    missed: false,
    hitChance: chance,
    damage: finalDamage,
    crit,
    breakdown: {
      base: input.flat,
      atkScaling: Math.round(offense * scale),
      element: afterElement - raw,
      defMitigation: -mitigation,
      crit: crit ? finalDamage - dealt : 0,
      final: finalDamage,
      hitChance: chance,
      missed: 0,
      critMultiplier: critMul,
      scale,
    },
    logs,
    guardBroken,
    dodged: false,
    statusPotencyMul: status.potencyMul,
    statusDurationDelta: status.durationDelta,
    overcharge,
  };
}

function offenseOf(actor: Combatant | undefined, domain: GenomeDomain) {
  if (!actor) return 10;
  if (domain === "MAGIC") return actor.mag;
  if (domain === "HYBRID") return Math.round(actor.atk * genomeV2.damage.hybridWeight + actor.mag * genomeV2.damage.hybridWeight);
  return actor.atk;
}

function mitigationOf(target: Combatant, domain: GenomeDomain) {
  if (domain === "MAGIC") return target.res;
  if (domain === "HYBRID") return Math.round((target.def + target.res) / 2);
  return target.def;
}

export function statusScale(actor: Combatant | undefined, target: Combatant) {
  const sta = rankOf(actor?.genes, "STATUS");
  const res = rankOf(target.genes, "RES");
  const staMul = combatConfig.geneRankMultiplier[sta];
  const resMul = combatConfig.geneRankMultiplier[res];
  const gap = rankIndex(sta) - rankIndex(res);
  const durationDelta = gap >= genomeV2.breakpoints.statusRankGap ? 1 : gap <= -genomeV2.breakpoints.statusRankGap ? -1 : 0;
  return { potencyMul: staMul / resMul, durationDelta, sta, res };
}

export function scaledStatus(basePotency: number, baseDuration: number, scale: ReturnType<typeof statusScale>) {
  const potency = Math.min(genomeV2.limits.maxStatusPotency, Math.max(1, Math.round(basePotency * scale.potencyMul)));
  const duration = Math.min(genomeV2.limits.maxStatusDuration, Math.max(1, baseDuration + scale.durationDelta));
  return { potency, duration };
}

export function conditionMet(condition: GenomeCondition, ctx: {
  actor?: Combatant;
  target?: Combatant;
  actedBefore?: boolean;
  crit?: boolean;
  dodged?: boolean;
  guardBroken?: boolean;
  allyLow?: boolean;
  allyAppliedStatus?: boolean;
  targetAlreadyHit?: boolean;
}): boolean {
  const target = ctx.target;
  const actor = ctx.actor;
  switch (condition) {
    case "IF_TARGET_BURNING":
      return Boolean(target?.statuses.some((row) => row.key === "BURN"));
    case "IF_TARGET_SHOCKED":
      return Boolean(target?.statuses.some((row) => row.key === "SHOCK"));
    case "IF_TARGET_MARKED":
      return Boolean(target?.statuses.some((row) => row.key === "MARK" || row.key === "MARKED"));
    case "IF_SELF_FRONT":
      return actor?.slot === "FRONT";
    case "IF_SELF_BACK":
      return actor?.slot === "BACK" || actor?.slot === "BACK_LEFT" || actor?.slot === "BACK_RIGHT";
    case "IF_ACTS_BEFORE_TARGET":
      return Boolean(ctx.actedBefore);
    case "IF_ACTS_AFTER_TARGET":
      return ctx.actedBefore === false;
    case "IF_CRIT":
      return Boolean(ctx.crit);
    case "IF_DODGED":
      return Boolean(ctx.dodged);
    case "IF_TARGET_GUARDED":
      return Boolean(target?.statuses.some((row) => row.key === "GUARD"));
    case "IF_GUARD_BROKEN":
      return Boolean(ctx.guardBroken);
    case "IF_ALLY_LOW_HP":
      return Boolean(ctx.allyLow);
    case "IF_SELF_LOW_HP":
      return Boolean(actor && actor.maxHp > 0 && actor.hp / actor.maxHp <= genomeV2.limits.lowHpRatio);
    case "IF_RESOURCE_AT_LEAST":
      return Boolean(actor?.resources && Object.values(actor.resources).some((value) => value > 0));
    case "IF_PREC_GREATER_THAN_TARGET_EVA":
      return precisionPoints(rankOf(actor?.genes, "PRECISION")) > precisionPoints(rankOf(target?.genes, "EVASION"));
    case "IF_MAG_GREATER_THAN_TARGET_RES":
      return (actor?.mag ?? 0) > (target?.res ?? 0);
    case "IF_ATK_GREATER_THAN_TARGET_DEF":
      return (actor?.atk ?? 0) > (target?.def ?? 0);
    case "IF_ALLY_APPLIED_STATUS_THIS_ROUND":
      return Boolean(ctx.allyAppliedStatus);
    case "IF_TARGET_ALREADY_HIT_THIS_ROUND":
      return Boolean(ctx.targetAlreadyHit);
    default:
      return false;
  }
}

export function advanceInitiative(current: number, steps = 1) {
  return current + steps * genomeV2.cardSpeedBonus.FAST;
}

export function delayInitiative(current: number, steps = 1) {
  return current + steps * genomeV2.cardSpeedBonus.HEAVY;
}
