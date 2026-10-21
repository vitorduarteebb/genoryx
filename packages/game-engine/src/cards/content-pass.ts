import type { CardEffectDef } from "@nexora/config";
import { genomeV2, type GenomeCardSpeed, type GenomeDomain } from "@nexora/config";
import { GENE_RANKS, type Element, type GeneRank, type GeneticCardLocusKey } from "@nexora/types";

export const CONTENT_PASS_VERSION = "gxr-content-v2" as const;

export const TACTICAL_ROLES = [
  "FOUNDATION",
  "SETUP",
  "PRESSURE",
  "FINISHER",
  "RESOURCE",
  "DEFENSE",
  "REACTION",
  "CONTROL",
  "TEMPO",
  "DISRUPTION",
  "SYNERGY",
  "POSITIONING",
  "SUSTAIN",
] as const;
export type TacticalRole = (typeof TACTICAL_ROLES)[number];

export type SealedCardInput = {
  key: string;
  name: string;
  locus: GeneticCardLocusKey | string;
  cost: number;
  element: Element | string;
  function: string;
  tier?: string;
  type?: string;
  targetType?: string;
  effects: readonly CardEffectDef[];
  resourceId?: string | null;
  genes?: Partial<Record<string, string>>;
  anatomy?: readonly string[];
  quirks?: readonly string[];
  verbs?: readonly string[];
};

export type RefinedCardContent = {
  effects: CardEffectDef[];
  domain: GenomeDomain;
  speed: GenomeCardSpeed;
  roles: TacticalRole[];
  tags: string[];
  changes: string[];
  targetType?: string;
};

type Mutable = {
  effects: CardEffectDef[];
  domain: GenomeDomain;
  speed: GenomeCardSpeed;
  roles: Set<TacticalRole>;
  tags: Set<string>;
  changes: string[];
  targetType?: string;
};

type Working = { input: SealedCardInput; state: Mutable };

const RANK_INDEX = new Map(GENE_RANKS.map((rank, index) => [rank, index]));

function cloneEffects(effects: readonly CardEffectDef[]): CardEffectDef[] {
  return effects.map((row) => ({
    ...row,
    condition: row.condition ? { ...row.condition } : undefined,
  }));
}

function hasOp(effects: readonly CardEffectDef[], op: string) {
  return effects.some((row) => row.op === op);
}

function firstOp(effects: readonly CardEffectDef[], op: string) {
  return effects.find((row) => row.op === op);
}

function effectBeatCount(effects: readonly CardEffectDef[]) {
  return effects.filter((row) => row.op !== "CONSUME_RESOURCE").length;
}

function trimBeats(state: Mutable, max = 3) {
  const consume = state.effects.filter((row) => row.op === "CONSUME_RESOURCE");
  const rest = state.effects.filter((row) => row.op !== "CONSUME_RESOURCE");
  if (rest.length <= max) return;
  state.effects = [...consume, ...rest.slice(0, max)];
  state.changes.push(`face: truncado a ${max} batidas`);
}

function elementStatus(element: string) {
  switch (element) {
    case "FIRE":
      return "BURN";
    case "ELECTRIC":
      return "SHOCK";
    case "NATURE":
      return "POISON";
    case "WATER":
    case "ICE":
      return "SLOW";
    case "EARTH":
      return "STUN";
    case "DARK":
      return "SLEEP";
    case "LIGHT":
      return "BLIND";
    default:
      return "MARKED";
  }
}

function resourceOf(card: SealedCardInput) {
  return (
    card.resourceId ??
    firstOp(card.effects, "CONSUME_RESOURCE")?.resource ??
    firstOp(card.effects, "GAIN_RESOURCE")?.resource ??
    (card.element === "FIRE"
      ? "HEAT"
      : card.element === "ELECTRIC"
        ? "SPARK"
        : card.element === "EARTH"
          ? "STONE"
          : card.element === "NATURE"
            ? "SPORE"
            : card.element === "WATER"
              ? "TIDE"
              : "FOCUS")
  );
}

function geneRank(card: SealedCardInput, key: string): GeneRank {
  const raw = card.genes?.[key] ?? card.genes?.[aliasGene(key)] ?? "C";
  return RANK_INDEX.has(raw as GeneRank) ? (raw as GeneRank) : "C";
}

function aliasGene(key: string) {
  if (key === "EVA" || key === "EVASION") return key === "EVA" ? "EVASION" : "EVA";
  if (key === "PREC" || key === "PRECISION") return key === "PREC" ? "PRECISION" : "PREC";
  if (key === "STA" || key === "STATUS") return key === "STA" ? "STATUS" : "STA";
  if (key === "CDMG" || key === "CRIT_DAMAGE") return key === "CDMG" ? "CRIT_DAMAGE" : "CDMG";
  return key;
}

function rankAtLeast(card: SealedCardInput, key: string, min: GeneRank) {
  return (RANK_INDEX.get(geneRank(card, key)) ?? 0) >= (RANK_INDEX.get(min) ?? 0);
}

function anatomyHas(card: SealedCardInput, ...needles: string[]) {
  const blob = [...(card.anatomy ?? []), ...(card.verbs ?? [])].join(" ").toLowerCase();
  return needles.some((needle) => blob.includes(needle.toLowerCase()));
}

function baseDomain(card: SealedCardInput): GenomeDomain {
  const name = card.name.toLowerCase();
  const damage = hasOp(card.effects, "DAMAGE");
  if (/mordida|golpe|investida|presa|cornada|chicote|espinho|pisada|lançamento|garra/.test(name)) return "PHYSICAL";
  if (/véu|égide|muralha|guarda|casca|placa|pulso|pacto|passo|abertura|troca|foco|amparo/.test(name) && !damage) {
    return "UTILITY";
  }
  if (["SHIELD", "DEFENSE", "BUFF", "UTILITY", "HEAL", "SUPPORT", "SUSTAIN"].includes(card.function) && !damage) {
    return "UTILITY";
  }
  if (damage && ["FIRE", "WATER", "NATURE", "ELECTRIC", "ICE", "LIGHT", "DARK", "ARCANE"].includes(String(card.element))) {
    if (/mordida|golpe|investida|presa|cornada|garra/.test(name)) return "PHYSICAL";
    if (rankAtLeast(card, "ATK", "A") && rankAtLeast(card, "MAG", "A") && /híbrid|plasma|raio-presa/.test(name)) return "HYBRID";
    if (rankAtLeast(card, "ATK", "A") && !rankAtLeast(card, "MAG", "B") && /pressão|impacto|carga/.test(name)) return "PHYSICAL";
    return "MAGIC";
  }
  return damage ? "PHYSICAL" : "UTILITY";
}

function baseSpeed(card: SealedCardInput): GenomeCardSpeed {
  if (card.type === "REACTION" || card.function === "COUNTER" || card.locus === "G7") return "VERY_FAST";
  if (card.locus === "G10" || card.tier === "SUPREME" || card.function === "AOE") return "HEAVY";
  if (card.function === "MOBILITY" || /passo|rajada|faísca|marca|pulso|véu|sopro/.test(card.name.toLowerCase())) return "FAST";
  if (/prisão|colapso|tempestade|montanha|explosão|erupção|avalanche/.test(card.name.toLowerCase())) return "HEAVY";
  if (rankAtLeast(card, "SPD", "A") && (card.function === "ATTACK" || card.locus === "G2")) return "FAST";
  if (!rankAtLeast(card, "SPD", "C") && (card.locus === "G9" || card.cost >= 3)) return "HEAVY";
  return "NORMAL";
}

function baseRoles(card: SealedCardInput, domain: GenomeDomain): TacticalRole[] {
  const roles = new Set<TacticalRole>();
  const name = card.name.toLowerCase();
  if (card.locus === "G1" || card.function === "ATTACK") roles.add("FOUNDATION");
  if (hasOp(card.effects, "APPLY_STATUS") || /marca|laço|campo/.test(name)) roles.add("SETUP");
  if (hasOp(card.effects, "DAMAGE")) roles.add("PRESSURE");
  if (card.function === "EXECUTE" || card.locus === "G9" || card.locus === "G10") roles.add("FINISHER");
  if (hasOp(card.effects, "GAIN_RESOURCE") || hasOp(card.effects, "CONSUME_RESOURCE") || hasOp(card.effects, "GAIN_ENERGY")) {
    roles.add("RESOURCE");
  }
  if (hasOp(card.effects, "SHIELD") || card.function === "DEFENSE" || card.function === "SHIELD") roles.add("DEFENSE");
  if (card.function === "COUNTER" || card.locus === "G7") roles.add("REACTION");
  if (card.function === "CONTROL" || /prisão|trava|laço/.test(name)) roles.add("CONTROL");
  if (/passo|faísca|pulso|véu/.test(name) || card.function === "MOBILITY") roles.add("TEMPO");
  if (hasOp(card.effects, "HEAL") || card.function === "SUSTAIN") roles.add("SUSTAIN");
  if (domain === "UTILITY" && roles.size === 0) roles.add("RESOURCE");
  return [...roles];
}

function alignResourceGates(state: Mutable) {
  for (const effect of state.effects) {
    if (effect.op !== "CONSUME_RESOURCE") continue;
    const amount = effect.value ?? 1;
    const need = effect.condition?.resourceAtLeast ?? amount;
    if (need !== amount) {
      effect.condition = { ...(effect.condition ?? {}), resourceAtLeast: amount };
      state.changes.push(`resource: require ${need}→${amount} alinhado ao consumo`);
    }
  }
}

function applyAnatomyAndGenes(card: SealedCardInput, state: Mutable) {
  const name = card.name.toLowerCase();
  const status = elementStatus(String(card.element));

  if (/sopro|baforada|hálito|breath/.test(name) || (card.verbs?.includes("BREATH") && /sopro|baforada|hálito/.test(name))) {
    state.tags.add("BREATH");
    state.domain = state.domain === "PHYSICAL" ? "HYBRID" : "MAGIC";
    state.roles.add("PRESSURE");
    if (hasOp(state.effects, "DAMAGE") && !hasOp(state.effects, "APPLY_STATUS") && effectBeatCount(state.effects) < 3) {
      state.effects.push({ op: "APPLY_STATUS", status, duration: 2 });
      state.changes.push("anatomia BREATH: status no sopro");
    }
  }
  if (
    /asa|voo|mergulho|planeio|flight|rajada alada/.test(name) ||
    (card.verbs?.includes("FLIGHT") && /asa|voo|mergulho|passo|rajada/.test(name)) ||
    (anatomyHas(card, "wings") && (card.function === "MOBILITY" || /passo|rajada|mergulho/.test(name)))
  ) {
    state.tags.add("FLIGHT");
    state.tags.add("REPOSITION");
    state.speed = state.speed === "HEAVY" ? "NORMAL" : "FAST";
    state.roles.add("TEMPO");
    state.roles.add("POSITIONING");
    if (!hasOp(state.effects, "GAIN_MOMENTUM") && effectBeatCount(state.effects) < 3 && card.function === "MOBILITY") {
      state.effects.push({ op: "GAIN_MOMENTUM", value: 1 });
      state.changes.push("anatomia FLIGHT: ímpeto");
    }
  }
  if (
    /cauda|chicote|rabo|arrasto|varredura/.test(name) ||
    (card.verbs?.includes("PULL") && /cauda|chicote|arrasto|varredura/.test(name))
  ) {
    state.tags.add("PULL");
    state.tags.add("SWEEP");
    state.domain = /sopro|labareda|arco|descarga/.test(name) ? state.domain : "PHYSICAL";
    state.roles.add("CONTROL");
    state.roles.add("POSITIONING");
    if (
      hasOp(state.effects, "DAMAGE") &&
      !state.effects.some((row) => row.condition?.selfPosition) &&
      effectBeatCount(state.effects) < 3
    ) {
      state.effects.push({ op: "GAIN_MOMENTUM", value: 1, condition: { selfPosition: "FRONT" } });
      state.changes.push("anatomia PULL/cauda: ímpeto FRONT");
    }
  }
  if (/rugido|uivo|grito|bramido|roar/.test(name) || (card.verbs?.includes("ROAR") && /rugido|uivo|grito|bramido/.test(name))) {
    state.tags.add("ROAR");
    state.roles.add("CONTROL");
    state.roles.add("DISRUPTION");
    if (!hasOp(state.effects, "APPLY_STATUS") && effectBeatCount(state.effects) < 3) {
      state.effects.push({ op: "APPLY_STATUS", status, duration: 1 });
      state.changes.push("anatomia ROAR: status curto");
    }
  }
  if (/laço|agarra|embraço|grappling/.test(name) || (card.verbs?.includes("GRAPPLE") && /laço|agarra|embraço|presa/.test(name))) {
    state.tags.add("GRAPPLE");
    state.roles.add("CONTROL");
    state.domain = "PHYSICAL";
    if (!hasOp(state.effects, "APPLY_STATUS") && effectBeatCount(state.effects) < 3) {
      state.effects.unshift({ op: "APPLY_STATUS", status: "MARKED", duration: 2 });
      state.changes.push("anatomia GRAPPLE: Marked");
    }
  }
  if (
    /(?:^|[\s-])(?:cornada|chifre|investida)(?:$|[\s-])/i.test(name) ||
    (card.verbs?.includes("CHARGE") && /(?:^|[\s-])(?:investida|cornada|carga|choque frontal)(?:$|[\s-])/i.test(name) && !/descarga/.test(name)) ||
    (anatomyHas(card, "horns") && /(?:^|[\s-])(?:investida|cornada|carga|choque frontal)(?:$|[\s-])/i.test(name) && !/descarga/.test(name))
  ) {
    state.tags.add("CHARGE");
    state.tags.add("GUARD_BREAK");
    state.domain = "PHYSICAL";
    state.roles.add("DISRUPTION");
    if (
      hasOp(state.effects, "DAMAGE") &&
      !state.effects.some((row) => row.condition?.selfPosition === "FRONT") &&
      effectBeatCount(state.effects) < 3
    ) {
      const dmg = firstOp(state.effects, "DAMAGE")!;
      state.effects.push({
        op: "DAMAGE",
        value: Math.max(4, Math.round((dmg.value ?? 10) * 0.3)),
        condition: { selfPosition: "FRONT" },
      });
      state.changes.push("anatomia CHARGE: bônus FRONT");
    }
  }
  if (/espinho|espinha|thorn/.test(name) || (anatomyHas(card, "spine") && /espinho|placa|couraça|guarda/.test(name))) {
    state.tags.add("THORNS");
    state.tags.add("GUARD");
    if (hasOp(state.effects, "SHIELD") && effectBeatCount(state.effects) < 3 && !hasOp(state.effects, "DAMAGE")) {
      state.effects.push({ op: "DAMAGE", value: 6, condition: { targetHas: status } });
      state.roles.add("REACTION");
      state.changes.push("anatomia THORNS: retaliação condicional");
    }
  }

  if (rankAtLeast(card, "ATK", "A")) state.tags.add("ATK_FOCUS");
  if (rankAtLeast(card, "MAG", "A")) state.tags.add("MAG_FOCUS");
  if (rankAtLeast(card, "DEF", "A") && hasOp(state.effects, "SHIELD")) {
    state.tags.add("GUARD");
    state.roles.add("POSITIONING");
  }
  if (rankAtLeast(card, "RES", "A") && state.domain === "MAGIC") state.tags.add("WARD");
  if (rankAtLeast(card, "SPD", "A")) {
    state.tags.add("IMPETUS");
    if (state.speed === "NORMAL" && (card.function === "MOBILITY" || card.locus === "G2" || /passo|faísca|marca/.test(name))) {
      state.speed = "FAST";
      state.changes.push("gene SPD: carta de ritmo vira FAST");
    }
  }
  if (rankAtLeast(card, "PRECISION", "A") || rankAtLeast(card, "PREC", "A")) {
    state.tags.add("MARK");
    state.tags.add("HUNT");
    if ((card.locus === "G2" || card.locus === "G9" || /marca|caça|presa/.test(name)) && !state.effects.some((row) => row.status === "MARKED")) {
      if (effectBeatCount(state.effects) < 3) {
        state.effects.unshift({ op: "APPLY_STATUS", status: "MARKED", duration: 2 });
        state.roles.add("SETUP");
        state.changes.push("gene PREC: aplica Marked");
      }
    }
  }
  if (rankAtLeast(card, "EVASION", "A") || rankAtLeast(card, "EVA", "A")) {
    state.tags.add("DODGE");
    if (card.function === "MOBILITY" || /passo|véu|rajada/.test(name)) {
      state.speed = "FAST";
      state.roles.add("TEMPO");
    }
  }
  if (rankAtLeast(card, "CRIT", "A") || rankAtLeast(card, "CRIT_DAMAGE", "A") || rankAtLeast(card, "CDMG", "A")) {
    state.tags.add("EXECUTE");
    if (card.locus === "G9" || card.function === "EXECUTE") state.roles.add("FINISHER");
  }
  if (rankAtLeast(card, "STATUS", "A") || rankAtLeast(card, "STA", "A")) {
    state.tags.add("STA_FOCUS");
    for (const effect of state.effects) {
      if (effect.op === "APPLY_STATUS" && (effect.duration ?? 0) > 0 && (effect.duration ?? 0) < 3) {
        effect.duration = (effect.duration ?? 1) + 1;
        state.changes.push("gene STA: duração de status +1");
        break;
      }
    }
  }
  if (card.quirks?.includes("STUBBORN") && hasOp(state.effects, "SHIELD")) {
    state.effects = state.effects.map((row) =>
      row.op === "SHIELD" && !row.condition ? { ...row, condition: { selfPosition: "FRONT" } } : row,
    );
    state.changes.push("quirk STUBBORN: escudo prefere FRONT");
  }
  if (card.quirks?.includes("COLD_BLOODED") && hasOp(state.effects, "DAMAGE") && !state.effects.some((row) => row.condition?.targetHas)) {
    const dmg = firstOp(state.effects, "DAMAGE")!;
    dmg.condition = { ...(dmg.condition ?? {}), targetHas: status };
    state.changes.push("quirk COLD_BLOODED: dano exige status");
  }
  if (card.quirks?.includes("PATIENT_HUNTER") && (card.locus === "G9" || card.function === "EXECUTE")) {
    if (!state.effects.some((row) => row.condition?.targetHas === "MARKED")) {
      const dmg = firstOp(state.effects, "DAMAGE");
      if (dmg && effectBeatCount(state.effects) < 3) {
        state.effects.push({ op: "DAMAGE", value: Math.max(5, Math.round((dmg.value ?? 12) * 0.35)), condition: { targetHas: "MARKED" } });
        state.changes.push("quirk PATIENT_HUNTER: payoff Marked");
      }
    }
  }

  trimBeats(state, 3);
}

function refineByName(card: SealedCardInput, state: Mutable) {
  const name = card.name.toLowerCase();
  const status = elementStatus(String(card.element));
  const resource = resourceOf(card);

  if (/descarga|arco|voltagem|plasma|faísca elétrica/.test(name)) {
    const onlyUtility =
      state.effects.every((row) => ["GAIN_ENERGY", "GAIN_MOMENTUM", "GAIN_RESOURCE", "CONSUME_RESOURCE", "SHIELD"].includes(row.op)) ||
      (hasOp(state.effects, "GAIN_ENERGY") && !hasOp(state.effects, "DAMAGE"));
    if (onlyUtility || (!hasOp(state.effects, "DAMAGE") && (hasOp(state.effects, "GAIN_ENERGY") || hasOp(state.effects, "SHIELD")))) {
      const energy = firstOp(state.effects, "GAIN_ENERGY")?.value ?? 1;
      state.effects = [
        { op: "DAMAGE", value: 8 },
        { op: "GAIN_ENERGY", value: energy, condition: { targetHas: status } },
      ];
      state.domain = "MAGIC";
      state.speed = "FAST";
      state.roles.add("PRESSURE");
      state.roles.add("RESOURCE");
      state.roles.add("TEMPO");
      state.targetType = "ENEMY";
      state.changes.push("nome Descarga/Arco: dano leve + energia se status");
    }
  }

  if (/labareda|brasa|cinza|magma|fornalha/.test(name) && hasOp(state.effects, "SHIELD") && !hasOp(state.effects, "DAMAGE")) {
    const shield = firstOp(state.effects, "SHIELD")?.value ?? 12;
    state.effects = [
      { op: "DAMAGE", value: Math.max(8, Math.round(shield * 0.55)) },
      { op: "APPLY_STATUS", status: "BURN", duration: 2 },
      { op: "SHIELD", value: Math.max(6, Math.round(shield * 0.4)), condition: { targetHas: "BURN" } },
    ];
    state.domain = "MAGIC";
    state.roles.add("PRESSURE");
    state.roles.add("DEFENSE");
    state.targetType = "ENEMY";
    state.changes.push("Labareda/Magma escudo-only: pressão + escudo se Burning");
  }

  if (/mordida|golpe|investida|presa|cornada|garra/.test(name)) {
    state.domain = "PHYSICAL";
    state.tags.add("PHYSICAL");
    if (!hasOp(state.effects, "DAMAGE")) {
      state.effects.unshift({ op: "DAMAGE", value: 12 + card.cost * 2 });
      state.changes.push("Mordida sem dano: dano físico adicionado");
    }
    if (!hasOp(state.effects, "APPLY_STATUS") && ["FIRE", "ELECTRIC", "NATURE"].includes(String(card.element))) {
      state.effects.push({ op: "APPLY_STATUS", status, duration: 2 });
      state.changes.push("Mordida: status elemental no impacto");
    }
    state.roles.add("FOUNDATION");
    state.roles.add("PRESSURE");
  }

  if (/véu|égide/.test(name) && hasOp(state.effects, "SHIELD")) {
    const shield = firstOp(state.effects, "SHIELD")!;
    state.speed = "FAST";
    state.domain = "UTILITY";
    state.roles.add("DEFENSE");
    state.roles.add("SYNERGY");
    const value = shield.value ?? 14;
    if (card.element === "FIRE") {
      state.effects = [
        { op: "SHIELD", value },
        { op: "GAIN_RESOURCE", value: 1, resource, condition: { selfPosition: "FRONT" } },
      ];
      state.changes.push("Véu: escudo rápido + Calor se FRONT");
    } else {
      state.effects = [
        { op: "SHIELD", value },
        { op: "SHIELD", value: Math.max(6, Math.round(value * 0.45)), condition: { resourceAtLeast: 1 } },
      ];
      state.changes.push("Véu: escudo rápido + reforço condicional");
    }
    state.tags.add("FAST");
  }

  if (/guarda|muralha|casca|placa|couraça|baluarte/.test(name) && hasOp(state.effects, "SHIELD") && !/véu|égide/.test(name)) {
    const shield = firstOp(state.effects, "SHIELD")!;
    const value = shield.value ?? 16;
    state.speed = "NORMAL";
    state.domain = "UTILITY";
    state.roles.add("DEFENSE");
    state.roles.add("POSITIONING");
    state.tags.add("GUARD");
    state.effects = [
      { op: "SHIELD", value },
      { op: "SHIELD", value: Math.max(4, Math.round(value * 0.35)), condition: { selfPosition: "FRONT" } },
    ];
    state.changes.push("Guarda: escudo + bônus FRONT");
  }

  if (/prisão|trava|laço|campo|raiz|algas/.test(name)) {
    state.roles.add("CONTROL");
    state.roles.add("SETUP");
    if (!hasOp(state.effects, "APPLY_STATUS")) {
      state.effects.unshift({ op: "APPLY_STATUS", status, duration: 2 });
      state.changes.push("Prisão/Laço: status de controle");
    }
    if (!hasOp(state.effects, "DAMAGE")) {
      state.effects.push({ op: "DAMAGE", value: 6 + card.cost * 2 });
      state.changes.push("Prisão/Laço: dano de pressão");
    }
    state.domain = state.domain === "PHYSICAL" ? "PHYSICAL" : "MAGIC";
    state.speed = state.speed === "FAST" ? "NORMAL" : state.speed;
  }

  if (/marca/.test(name)) {
    state.roles.add("SETUP");
    state.speed = state.speed === "HEAVY" ? "FAST" : state.speed === "NORMAL" ? "FAST" : state.speed;
    const hasMark = state.effects.some((row) => row.status === "MARK" || row.status === "MARKED");
    if (!hasMark) {
      state.effects = [
        { op: "APPLY_STATUS", status: "MARKED", duration: 2 },
        ...state.effects.filter((row) => row.op !== "APPLY_STATUS" || row.status !== status),
      ];
      if (!hasOp(state.effects, "DAMAGE")) state.effects.push({ op: "DAMAGE", value: 6 });
      if (["FIRE", "ELECTRIC"].includes(String(card.element)) && !state.effects.some((row) => row.status === status)) {
        state.effects.push({ op: "APPLY_STATUS", status, duration: 2 });
      }
      state.changes.push("Marca: Marked + pressão");
    }
  }

  if (/labareda|brasa|cinza|magma|fornalha/.test(name) && hasOp(state.effects, "DAMAGE")) {
    state.domain = /mordida|golpe/.test(name) ? "PHYSICAL" : "MAGIC";
    state.roles.add("PRESSURE");
    if (!hasOp(state.effects, "APPLY_STATUS")) {
      state.effects.push({ op: "APPLY_STATUS", status: "BURN", duration: 2 });
      state.changes.push("Labareda/Brasa: aplica Burn");
    }
    if (!state.effects.some((row) => row.op === "GAIN_RESOURCE")) {
      const apply = state.effects.filter((row) => !(row.op === "APPLY_STATUS" && row.status === "BURN"));
      const burnApply = state.effects.filter((row) => row.op === "APPLY_STATUS" && row.status === "BURN");
      state.effects = [
        ...apply.filter((row) => row.op === "DAMAGE"),
        { op: "GAIN_RESOURCE", value: 1, resource, condition: { targetHas: "BURN" } },
        ...burnApply,
        ...apply.filter((row) => row.op !== "DAMAGE"),
      ];
      state.changes.push("Labareda/Brasa: +recurso se alvo já queima");
      state.roles.add("RESOURCE");
    }
  }

  if (/pulso|ímpeto|foco/.test(name)) {
    state.domain = "UTILITY";
    state.roles.add("RESOURCE");
    state.roles.add("TEMPO");
    state.speed = "FAST";
    state.tags.add("FAST");
    if (hasOp(state.effects, "CONSUME_RESOURCE") && hasOp(state.effects, "GAIN_ENERGY")) {
      const consume = firstOp(state.effects, "CONSUME_RESOURCE")!;
      const energy = firstOp(state.effects, "GAIN_ENERGY")!;
      const need = consume.value ?? 2;
      consume.condition = { ...(consume.condition ?? {}), resourceAtLeast: need };
      state.effects = [consume, energy, { op: "SHIELD", value: 6, condition: { selfPosition: "FRONT" } }];
      state.changes.push("Pulso: consome recurso → energia; escudo leve se FRONT");
    } else if (hasOp(state.effects, "GAIN_ENERGY") && !hasOp(state.effects, "DAMAGE")) {
      state.effects = [
        { op: "GAIN_ENERGY", value: firstOp(state.effects, "GAIN_ENERGY")?.value ?? 1 },
        { op: "GAIN_RESOURCE", value: 1, resource },
      ];
      state.changes.push("Pulso: energia + gera recurso");
    } else if (!hasOp(state.effects, "GAIN_ENERGY") && !hasOp(state.effects, "DAMAGE")) {
      state.effects = [
        { op: "GAIN_RESOURCE", value: 1, resource },
        { op: "GAIN_ENERGY", value: 1, condition: { resourceAtLeast: 1 } },
      ];
      state.changes.push("Pulso: gera recurso e converte em energia");
    }
  }

  if (/retorno|réplica|espinho|contra/.test(name) || card.function === "COUNTER" || card.locus === "G7") {
    state.speed = "VERY_FAST";
    state.roles.add("REACTION");
    state.tags.add("REACTION");
    if (!hasOp(state.effects, "SHIELD") && !hasOp(state.effects, "DAMAGE")) {
      state.effects = [
        { op: "SHIELD", value: 8 },
        { op: "DAMAGE", value: 8, condition: { targetHas: status } },
      ];
      state.changes.push("Retorno: escudo + dano no gatilho de status");
    } else if (hasOp(state.effects, "DAMAGE") && !state.effects.some((row) => row.condition?.targetHas)) {
      const dmg = firstOp(state.effects, "DAMAGE")!;
      dmg.condition = { ...(dmg.condition ?? {}), targetHas: status };
      state.changes.push("Retorno: dano amarrado ao status");
    }
    if (hasOp(state.effects, "SHIELD") && hasOp(state.effects, "DAMAGE")) {
      const shield = firstOp(state.effects, "SHIELD")!;
      const dmg = firstOp(state.effects, "DAMAGE")!;
      state.effects = [
        { op: "SHIELD", value: shield.value ?? 10 },
        { op: "DAMAGE", value: dmg.value ?? 9, condition: { targetHas: status } },
      ];
      state.changes.push("Retorno: TRIGGER → escudo; payoff se status");
    }
  }

  if (/prisão|trava/.test(name) && hasOp(state.effects, "APPLY_STATUS")) {
    state.speed = "HEAVY";
    state.tags.add("HEAVY");
    state.roles.add("CONTROL");
    state.roles.add("TEMPO");
    if (!state.effects.some((row) => row.op === "APPLY_STATUS" && row.condition?.targetHas)) {
      const primary = firstOp(state.effects, "APPLY_STATUS")!;
      state.effects.push({
        op: "APPLY_STATUS",
        status: primary.status,
        duration: Math.max(1, (primary.duration ?? 2) + 1),
        condition: { targetHas: primary.status },
      });
      state.changes.push("Prisão: prolonga status se já ativo");
    }
  }

  trimBeats(state, 3);
}

function differentiateShields(cards: Working[]) {
  const shields = cards.filter((row) => hasOp(row.state.effects, "SHIELD") && !hasOp(row.state.effects, "DAMAGE"));
  if (shields.length < 2) return;
  shields.sort((a, b) => String(a.input.locus).localeCompare(String(b.input.locus)));

  const scoreTank = (row: Working) => {
    const name = row.input.name.toLowerCase();
    if (/guarda|muralha|casca|placa|couraça|baluarte|amparo/.test(name)) return 3;
    if (row.input.locus === "G8") return 2;
    if (/véu|égide/.test(name)) return 0;
    return 1;
  };
  const scoreSupport = (row: Working) => {
    const name = row.input.name.toLowerCase();
    if (/véu|égide|folha|ondulação/.test(name)) return 3;
    if (row.input.locus === "G4" || row.input.locus === "G5") return 1;
    return 0;
  };

  let tank = shields[0]!;
  let support = shields[1]!;
  if (scoreTank(shields[1]!) > scoreTank(shields[0]!) || scoreSupport(shields[0]!) > scoreSupport(shields[1]!)) {
    tank = shields[1]!;
    support = shields[0]!;
  }

  const aShield = firstOp(tank.state.effects, "SHIELD")?.value ?? 0;
  const bShield = firstOp(support.state.effects, "SHIELD")?.value ?? 0;
  if (tank.input.cost !== support.input.cost || Math.abs(aShield - bShield) > 2) return;

  const tankValue = firstOp(tank.state.effects, "SHIELD")?.value ?? 16;
  tank.state.effects = [
    { op: "SHIELD", value: tankValue },
    { op: "SHIELD", value: Math.max(4, Math.round(tankValue * 0.35)), condition: { selfPosition: "FRONT" } },
  ];
  tank.state.speed = "NORMAL";
  tank.state.roles.add("DEFENSE");
  tank.state.roles.add("POSITIONING");
  tank.state.tags.add("GUARD");
  tank.state.changes.push("anti-duplicata: escudo FRONT (tank)");

  const supportValue = firstOp(support.state.effects, "SHIELD")?.value ?? 16;
  support.state.effects = [
    { op: "SHIELD", value: supportValue },
    { op: "REMOVE_STATUS", value: 1 },
  ];
  support.state.speed = "FAST";
  support.state.roles.add("DEFENSE");
  support.state.roles.add("SUSTAIN");
  support.state.roles.add("SYNERGY");
  support.state.changes.push("anti-duplicata: escudo rápido + cleanse (support)");
}

function diversifyStatusCycle(cards: Working[], element: string, status: string, label: string) {
  const pressure = cards
    .filter(
      (row) =>
        row.input.element === element &&
        hasOp(row.state.effects, "DAMAGE") &&
        row.state.effects.some((effect) => effect.status === status || effect.condition?.targetHas === status),
    )
    .sort((a, b) => String(a.input.locus).localeCompare(String(b.input.locus)));
  if (pressure.length < 3) return;
  const apply = pressure[0]!;
  const punish = pressure[1]!;
  const convert = pressure[2]!;

  if (!apply.state.effects.some((row) => row.op === "APPLY_STATUS" && row.status === status)) {
    apply.state.effects.push({ op: "APPLY_STATUS", status, duration: 2 });
    apply.state.changes.push(`${label}-cycle: aplica`);
    apply.state.roles.add("SETUP");
  }

  if (!punish.state.effects.some((row) => row.condition?.targetHas === status)) {
    const dmg = firstOp(punish.state.effects, "DAMAGE");
    const bonus = Math.max(4, Math.round((dmg?.value ?? 8) * 0.4));
    punish.state.effects.push({ op: "DAMAGE", value: bonus, condition: { targetHas: status } });
    punish.state.changes.push(`${label}-cycle: pune ${status}`);
    punish.state.roles.add("FINISHER");
    punish.state.roles.add("SYNERGY");
  }

  if (["G9", "G10", "G6"].includes(String(convert.input.locus)) || convert.input.cost >= 2) {
    const resource = resourceOf(convert.input);
    if (!convert.state.effects.some((row) => row.op === "CONSUME_RESOURCE")) {
      convert.state.effects.unshift({
        op: "CONSUME_RESOURCE",
        value: 2,
        resource,
        condition: { resourceAtLeast: 2 },
      });
      const dmg = firstOp(convert.state.effects, "DAMAGE");
      if (dmg) dmg.value = Math.round((dmg.value ?? 10) * 1.25);
      convert.state.changes.push(`${label}-cycle: gasta recurso para burst`);
      convert.state.roles.add("FINISHER");
      convert.state.roles.add("RESOURCE");
    }
  }
  for (const row of [apply, punish, convert]) trimBeats(row.state, 3);
}

function diversifyElectricKit(cards: Working[]) {
  const electric = cards.filter((row) => row.input.element === "ELECTRIC");
  if (electric.length < 2) return;
  const pressure = electric
    .filter((row) => hasOp(row.state.effects, "DAMAGE"))
    .sort((a, b) => String(a.input.locus).localeCompare(String(b.input.locus)));
  for (const row of electric) {
    if (
      hasOp(row.state.effects, "DAMAGE") &&
      !row.state.effects.some((effect) => effect.status === "SHOCK" || effect.condition?.targetHas === "SHOCK") &&
      ["G1", "G2", "G3"].includes(String(row.input.locus))
    ) {
      row.state.effects.push({ op: "APPLY_STATUS", status: "SHOCK", duration: 2 });
      row.state.changes.push("electric-cycle: aplica Shock");
      row.state.roles.add("SETUP");
      trimBeats(row.state, 3);
    }
  }
  if (pressure.length >= 2) {
    const punish = pressure[1]!;
    if (!punish.state.effects.some((row) => row.condition?.targetHas === "SHOCK")) {
      const dmg = firstOp(punish.state.effects, "DAMAGE");
      punish.state.effects.push({ op: "DAMAGE", value: Math.max(4, Math.round((dmg?.value ?? 8) * 0.35)), condition: { targetHas: "SHOCK" } });
      punish.state.changes.push("electric-cycle: pune Shocked");
      punish.state.roles.add("FINISHER");
      punish.state.roles.add("SYNERGY");
      trimBeats(punish.state, 3);
    }
  }
  if (pressure.length >= 3) {
    const convert = pressure[2]!;
    if (!hasOp(convert.state.effects, "GAIN_ENERGY") && !hasOp(convert.state.effects, "CONSUME_RESOURCE")) {
      convert.state.effects.push({ op: "GAIN_ENERGY", value: 1, condition: { targetHas: "SHOCK" } });
      convert.state.changes.push("electric-cycle: recupera energia em Shocked");
      convert.state.roles.add("RESOURCE");
      trimBeats(convert.state, 3);
    }
  }
}

/** Diferencia pressão genérica “só dano(+mesmo status)” no mesmo kit. */
function diversifyPlainPressure(cards: Working[]) {
  const plain = cards
    .filter((row) => {
      if (!hasOp(row.state.effects, "DAMAGE")) return false;
      const ops = row.state.effects.map((effect) => effect.op).filter((op) => op !== "CONSUME_RESOURCE");
      return ops.every((op) => op === "DAMAGE" || op === "APPLY_STATUS");
    })
    .sort((a, b) => String(a.input.locus).localeCompare(String(b.input.locus)));
  if (plain.length < 3) return;

  const status = elementStatus(String(plain[0]!.input.element));
  const setup = plain[0]!;
  const tempo = plain[1]!;
  const finisher = plain[plain.length - 1]!;

  if (!setup.state.effects.some((row) => row.op === "APPLY_STATUS")) {
    setup.state.effects.push({ op: "APPLY_STATUS", status, duration: 2 });
    setup.state.roles.add("SETUP");
    setup.state.changes.push("anti-redundância: setup de status");
  }

  tempo.state.speed = "FAST";
  tempo.state.roles.add("TEMPO");
  if (!tempo.state.effects.some((row) => row.condition?.targetHas === status)) {
    const dmg = firstOp(tempo.state.effects, "DAMAGE");
    tempo.state.effects.push({
      op: "DAMAGE",
      value: Math.max(3, Math.round((dmg?.value ?? 8) * 0.3)),
      condition: { targetHas: status },
    });
    tempo.state.changes.push("anti-redundância: pressão rápida condicional");
    tempo.state.roles.add("SYNERGY");
  }

  finisher.state.speed = "HEAVY";
  finisher.state.roles.add("FINISHER");
  if (!finisher.state.effects.some((row) => row.condition?.selfPosition === "FRONT" || row.condition?.targetHas)) {
    const dmg = firstOp(finisher.state.effects, "DAMAGE")!;
    finisher.state.effects.push({
      op: "DAMAGE",
      value: Math.max(5, Math.round((dmg.value ?? 12) * 0.35)),
      condition: { targetHas: status },
    });
    finisher.state.changes.push("anti-redundância: finisher HEAVY vs status");
  }

  for (const row of [setup, tempo, finisher]) trimBeats(row.state, 3);
}

function ensureSpeedSpread(cards: Working[]) {
  const damage = cards.filter((row) => hasOp(row.state.effects, "DAMAGE"));
  if (damage.length < 2) return;
  const hasFast = damage.some((row) => row.state.speed === "FAST" || row.state.speed === "VERY_FAST");
  const hasHeavy = damage.some((row) => row.state.speed === "HEAVY");
  if (!hasFast) {
    const poke = [...damage].sort((a, b) => a.input.cost - b.input.cost || String(a.input.locus).localeCompare(String(b.input.locus)))[0]!;
    poke.state.speed = "FAST";
    poke.state.roles.add("TEMPO");
    poke.state.changes.push("timeline: pressão barata vira FAST");
  }
  if (!hasHeavy) {
    const heavy = [...damage].sort((a, b) => b.input.cost - a.input.cost || String(b.input.locus).localeCompare(String(a.input.locus)))[0]!;
    if (heavy.state.speed !== "VERY_FAST") {
      heavy.state.speed = "HEAVY";
      heavy.state.roles.add("FINISHER");
      heavy.state.changes.push("timeline: pressão cara vira HEAVY");
    }
  }
}

function ensureKitCycle(cards: Working[]) {
  const roles = new Set(cards.flatMap((row) => [...row.state.roles]));
  if (![...roles].includes("SETUP")) {
    const candidate = cards.find((row) => hasOp(row.state.effects, "DAMAGE") && ["G2", "G3", "G6"].includes(String(row.input.locus)));
    if (candidate && effectBeatCount(candidate.state.effects) < 3) {
      const status = elementStatus(String(candidate.input.element));
      if (!hasOp(candidate.state.effects, "APPLY_STATUS")) {
        candidate.state.effects.push({ op: "APPLY_STATUS", status, duration: 2 });
        candidate.state.roles.add("SETUP");
        candidate.state.changes.push("ciclo: setup adicionado");
      }
    }
  }
  if (![...roles].includes("DEFENSE") && ![...roles].includes("REACTION")) {
    const soft = cards.find((row) => row.input.locus === "G4" || row.input.locus === "G8" || row.input.function === "SHIELD");
    if (soft && !hasOp(soft.state.effects, "SHIELD")) {
      soft.state.effects = [{ op: "SHIELD" as const, value: 12 }, ...soft.state.effects].slice(0, 3);
      soft.state.roles.add("DEFENSE");
      soft.state.changes.push("ciclo: ferramenta defensiva");
    }
  }
  if (![...roles].includes("RESOURCE")) {
    const util = cards.find((row) => row.input.locus === "G5" || /pulso|foco|pacto/.test(row.input.name.toLowerCase()));
    if (util && effectBeatCount(util.state.effects) < 3) {
      util.state.effects.push({ op: "GAIN_RESOURCE", value: 1, resource: resourceOf(util.input) });
      util.state.roles.add("RESOURCE");
      util.state.changes.push("ciclo: gera recurso");
    }
  }
}

function ensureCounterTools(cards: Working[]) {
  const hasCleanse = cards.some((row) => hasOp(row.state.effects, "REMOVE_STATUS"));
  const hasStatusPressure = cards.some((row) => row.state.effects.some((effect) => effect.op === "APPLY_STATUS"));
  if (hasStatusPressure && !hasCleanse) {
    const defensive = cards.find(
      (row) =>
        hasOp(row.state.effects, "SHIELD") &&
        !hasOp(row.state.effects, "DAMAGE") &&
        effectBeatCount(row.state.effects) <= 2 &&
        (row.input.locus === "G8" || /véu|égide|folha|cura|ondulação|amparo|guarda/.test(row.input.name.toLowerCase())),
    );
    if (defensive && !hasOp(defensive.state.effects, "REMOVE_STATUS")) {
      const primary = firstOp(defensive.state.effects, "SHIELD")!;
      defensive.state.effects = [{ op: "SHIELD", value: primary.value ?? 14 }, { op: "REMOVE_STATUS", value: 1 }];
      defensive.state.speed = defensive.state.speed === "NORMAL" ? "FAST" : defensive.state.speed;
      defensive.state.roles.add("SUSTAIN");
      defensive.state.roles.add("DISRUPTION");
      defensive.state.changes.push("counterplay: escudo + cleanse");
    }
  }

  const hasMark = cards.some((row) => row.state.effects.some((effect) => effect.status === "MARKED" || effect.status === "MARK"));
  const hasPrecisionPayoff = cards.some((row) =>
    row.state.effects.some((effect) => effect.condition?.targetHas === "MARKED" || effect.condition?.targetHas === "MARK"),
  );
  if (hasMark && !hasPrecisionPayoff) {
    const finisher = [...cards]
      .filter((row) => hasOp(row.state.effects, "DAMAGE") && (row.input.locus === "G9" || row.input.locus === "G6" || row.input.function === "EXECUTE"))
      .sort((a, b) => String(a.input.locus).localeCompare(String(b.input.locus)))[0];
    if (finisher && effectBeatCount(finisher.state.effects) < 3) {
      const dmg = firstOp(finisher.state.effects, "DAMAGE");
      finisher.state.effects.push({
        op: "DAMAGE",
        value: Math.max(5, Math.round((dmg?.value ?? 12) * 0.3)),
        condition: { targetHas: "MARKED" },
      });
      finisher.state.roles.add("SYNERGY");
      finisher.state.roles.add("FINISHER");
      finisher.state.changes.push("synergy: payoff contra Marked");
    }
  }

  const hasGuard = cards.some((row) => row.state.tags.has("GUARD") || hasOp(row.state.effects, "SHIELD"));
  const hasBreak = cards.some((row) => row.state.tags.has("GUARD_BREAK"));
  if (hasGuard && !hasBreak) {
    const breaker = cards.find((row) => hasOp(row.state.effects, "DAMAGE") && (row.input.locus === "G3" || row.input.locus === "G9"));
    if (breaker) {
      breaker.state.tags.add("GUARD_BREAK");
      breaker.state.roles.add("DISRUPTION");
      breaker.state.changes.push("counterplay: tag GUARD_BREAK vs escudos");
    }
  }
}

function finalizeTags(state: Mutable) {
  state.tags.add(state.domain);
  state.tags.add(state.speed);
  for (const role of state.roles) state.tags.add(role);
}

export function refineSealedCard(card: SealedCardInput): RefinedCardContent {
  const domain = baseDomain(card);
  const speed = baseSpeed(card);
  const state: Mutable = {
    effects: cloneEffects(card.effects),
    domain,
    speed,
    roles: new Set(baseRoles(card, domain)),
    tags: new Set([card.function, card.tier ?? "FOUNDATION"].filter(Boolean) as string[]),
    changes: [],
    targetType: card.targetType,
  };

  refineByName(card, state);
  applyAnatomyAndGenes(card, state);
  alignResourceGates(state);
  finalizeTags(state);

  return {
    effects: state.effects,
    domain: state.domain,
    speed: state.speed,
    roles: [...state.roles],
    tags: [...state.tags],
    changes: state.changes,
    targetType: state.targetType,
  };
}

export function refineSealedKit(cards: readonly SealedCardInput[]): RefinedCardContent[] {
  const working: Working[] = cards.map((input) => {
    const refined = refineSealedCard(input);
    return {
      input,
      state: {
        effects: cloneEffects(refined.effects),
        domain: refined.domain,
        speed: refined.speed,
        roles: new Set(refined.roles),
        tags: new Set(refined.tags),
        changes: [...refined.changes],
        targetType: refined.targetType,
      },
    };
  });

  differentiateShields(working);
  diversifyStatusCycle(working, "FIRE", "BURN", "burn");
  diversifyStatusCycle(working, "NATURE", "POISON", "poison");
  diversifyStatusCycle(working, "EARTH", "STUN", "stun");
  diversifyElectricKit(working);
  diversifyPlainPressure(working);
  ensureSpeedSpread(working);
  ensureKitCycle(working);
  ensureCounterTools(working);

  return working.map((row) => {
    finalizeTags(row.state);
    return {
      effects: row.state.effects,
      domain: row.state.domain,
      speed: row.state.speed,
      roles: [...row.state.roles],
      tags: [...row.state.tags],
      changes: row.state.changes,
      targetType: row.state.targetType,
    };
  });
}

export function auditSealedCard(card: SealedCardInput, refined = refineSealedCard(card)) {
  const problems: string[] = [];
  const shieldOnly = hasOp(card.effects, "SHIELD") && card.effects.every((row) => row.op === "SHIELD" || row.op === "CONSUME_RESOURCE");
  const energyOnly = hasOp(card.effects, "GAIN_ENERGY") && !hasOp(card.effects, "DAMAGE");
  if (energyOnly && /descarga|arco|voltagem/.test(card.name.toLowerCase())) problems.push("nome de descarga sem dano");
  if (shieldOnly) problems.push("escudo puro sem diferenciação");
  if (/mordida|golpe|investida/.test(card.name.toLowerCase()) && refined.domain !== "PHYSICAL") {
    problems.push("corpo com domínio não físico");
  }
  const consume = firstOp(card.effects, "CONSUME_RESOURCE");
  if (consume && (consume.condition?.resourceAtLeast ?? consume.value) !== consume.value) problems.push("require≠consume");
  if (refined.roles.length < 1) problems.push("sem função tática");
  if (effectBeatCount(refined.effects) > 3) problems.push("face sobrecarregada");
  return {
    name: card.name,
    locus: card.locus,
    problems,
    changes: refined.changes,
    roles: refined.roles,
    domain: refined.domain,
    speed: refined.speed,
  };
}

export function contentPassFingerprint(cards: readonly SealedCardInput[]) {
  const refined = refineSealedKit(cards);
  return refined.map((row, index) => ({
    key: cards[index]?.key,
    locus: cards[index]?.locus,
    domain: row.domain,
    speed: row.speed,
    roles: row.roles,
    effectOps: row.effects.map((effect) => effect.op).join(">"),
    changes: row.changes.length,
  }));
}

export type ContentPassAuditRow = ReturnType<typeof auditSealedCard>;

export function summarizeContentPass(cards: readonly SealedCardInput[]) {
  const audits = cards.map((card) => auditSealedCard(card));
  const refined = refineSealedKit(cards);
  const changed = refined.filter((row) => row.changes.length > 0).length;
  const problems = audits.flatMap((row) => row.problems.map((problem) => `${row.name}: ${problem}`));
  return {
    audited: cards.length,
    changed,
    kept: cards.length - changed,
    problemsBefore: problems,
    domains: Object.fromEntries(
      (["PHYSICAL", "MAGIC", "HYBRID", "UTILITY"] as const).map((domain) => [domain, refined.filter((row) => row.domain === domain).length]),
    ),
    speeds: Object.fromEntries(
      (["VERY_FAST", "FAST", "NORMAL", "HEAVY"] as const).map((speed) => [speed, refined.filter((row) => row.speed === speed).length]),
    ),
    roleCoverage: Object.fromEntries(TACTICAL_ROLES.map((role) => [role, refined.filter((row) => row.roles.includes(role)).length])),
  };
}

export function kitRoleCoverage(refined: readonly RefinedCardContent[]) {
  const roles = new Set(refined.flatMap((row) => row.roles));
  return {
    hasFoundation: roles.has("FOUNDATION"),
    hasSetup: roles.has("SETUP"),
    hasPressure: roles.has("PRESSURE"),
    hasFinisher: roles.has("FINISHER"),
    hasReaction: roles.has("REACTION") || roles.has("DEFENSE"),
    hasResource: roles.has("RESOURCE"),
    hasSynergy: roles.has("SYNERGY") || refined.some((row) => row.effects.some((effect) => Boolean(effect.condition?.targetHas))),
    hasTiming: refined.some((row) => row.speed === "FAST" || row.speed === "VERY_FAST") && refined.some((row) => row.speed === "HEAVY"),
  };
}

void genomeV2;
