import type { CardEffectOp, CardTargetType, Element, GeneticCardLocusKey } from "@nexora/types";
import { GENETIC_CARD_LOCI } from "@nexora/types";
import { getCardDefinition, type CardDefinition, type CardEffectDef } from "./cards";
import { resourceVisuals } from "./personal-resource";

const STATUS_PT: Record<string, string> = {
  BURN: "Queimadura",
  POISON: "Veneno",
  STUN: "Atordoamento",
  SLEEP: "Sono",
  BLIND: "Cegueira",
  SHOCK: "Choque",
  MOLTEN: "Fusão",
};

const ELEMENT_PT: Record<Element, string> = {
  FIRE: "Fogo",
  WATER: "Água",
  NATURE: "Natureza",
  EARTH: "Terra",
  ELECTRIC: "Elétrico",
  ICE: "Gelo",
  LIGHT: "Luz",
  DARK: "Sombra",
  ARCANE: "Arcano",
};

const TYPE_PT: Record<CardDefinition["type"], string> = {
  ATTACK: "Ataque",
  SKILL: "Habilidade",
  REACTION: "Reação",
  ULTIMATE: "Suprema",
  GENETIC: "Genética",
  SYNERGY: "Sinergia",
};

const TARGET_PT: Record<CardTargetType, string> = {
  SELF: "em você",
  ALLY: "num aliado",
  ENEMY: "no inimigo",
  ALL_ENEMIES: "em todos os inimigos",
  ALL_ALLIES: "em todos os aliados",
};

const LABELS: Record<string, string> = {
  ember_strike: "Golpe de Brasa",
  flame_rush: "Investida Flamejante",
  cinder_bolt: "Raio de Cinza",
  heat_plate: "Placa de Calor",
  spark_step: "Passo de Fagulha",
  ash_snare: "Laço de Cinzas",
  flare_guard: "Guarda da Labareda",
  kindling_pact: "Pacto da Brasinha",
  crimson_roar: "Rugido Carmesim",
  inferno_burst: "Explosão Infernal",
  aqua_jab: "Estocada d'Água",
  tide_slam: "Pancada da Maré",
  water_jet: "Jato d'Água",
  bubble_film: "Película de Bolha",
  mend_current: "Corrente Curativa",
  bind_kelp: "Algas Prendedoras",
  ripple_ward: "Guarda da Ondulação",
  tidal_pact: "Pacto da Maré",
  moon_tide: "Maré Lunar",
  abyss_surge: "Surto do Abismo",
  vine_tap: "Chicote de Trepadeira",
  thorn_spike: "Espinho",
  bloom_burst: "Estouro de Flor",
  bark_guard: "Guarda de Casca",
  pollen_drift: "Pólen à Deriva",
  root_snare: "Raízes Prendedoras",
  leaf_veil: "Véu de Folhas",
  grove_pact: "Pacto do Bosque",
  sunpetal: "Pétala Solar",
  verdant_bloom: "Florescimento Verde",
  stone_guard: "Guarda de Pedra",
  quake_stomp: "Pisada Sísmica",
  granite_wall: "Muralha de Granito",
  dust_cloud: "Nuvem de Poeira",
  titan_growl: "Rosnado Titânico",
  molten_armor: "Armadura Incandescente",
  plasma_arc: "Arco de Plasma",
  overgrowth: "Supercrescimento",
  spark_jolt: "Faísca Elétrica",
  boulder_toss: "Lançamento de Rocha",
  tremor_pulse: "Pulso Sísmico",
  stone_brace: "Trava de Pedra",
  rumble_guard: "Guarda do Tremor",
  bedrock_pact: "Pacto do Leito",
  mountain_crash: "Queda da Montanha",
};

const TEXT_OVERRIDE: Record<string, string> = {
  molten_armor: "Ganha 18 de escudo. Quem atacar o portador recebe Queimadura.",
  plasma_arc: "Causa 21 de dano elétrico no inimigo e aplica Choque por 2 rodadas.",
  overgrowth: "Cura 14 e concede 10 de escudo num aliado.",
  moon_tide: "Causa 14 de dano em todos os inimigos e cura 10 em você.",
  verdant_bloom: "Causa 28 de dano no inimigo e cura 12 em você.",
  ripple_ward: "Ganha 10 de escudo e remove status negativos.",
  bedrock_pact: "Ganha 2 de ímpeto. Alimenta sinergias de Terra.",
  kindling_pact: "Ganha 2 de ímpeto. Alimenta sinergias de Fogo.",
  grove_pact: "Ganha 2 de ímpeto. Alimenta sinergias de Natureza.",
  tidal_pact: "Compra 1 carta e ganha 1 de ímpeto.",
};

function describeEffect(effect: CardEffectDef): string {
  const op = effect.op;
  let text = String(op);
  if (op === "DAMAGE") text = `Causa ${effect.value ?? 0} de dano`;
  else if (op === "HEAL") text = `Cura ${effect.value ?? 0}`;
  else if (op === "SHIELD") text = `Ganha ${effect.value ?? 0} de escudo`;
  else if (op === "APPLY_STATUS") {
    const status = STATUS_PT[effect.status ?? ""] ?? effect.status ?? "status";
    const rounds = effect.duration ?? 2;
    text = `Aplica ${status} por ${rounds} ${rounds === 1 ? "rodada" : "rodadas"}`;
  } else if (op === "REMOVE_STATUS") text = "Remove status";
  else if (op === "DRAW") text = `Compra ${effect.value ?? 1} carta${(effect.value ?? 1) > 1 ? "s" : ""}`;
  else if (op === "GAIN_ENERGY") text = `Ganha ${effect.value ?? 1} de energia`;
  else if (op === "GAIN_MOMENTUM") text = `Ganha ${effect.value ?? 1} de ímpeto`;
  else if (op === "GAIN_RESOURCE") {
    const visual = resourceVisuals[effect.resource ?? ""];
    text = `Ganha ${effect.value ?? 1} ${visual?.namePt ?? effect.resource ?? "recurso"}`;
  } else if (op === "CONSUME_RESOURCE") {
    const visual = resourceVisuals[effect.resource ?? ""];
    text = `Consome ${effect.value ?? 1} ${visual?.namePt ?? effect.resource ?? "recurso"}`;
  }
  if (effect.condition?.selfPosition) text += ` se estiver em ${effect.condition.selfPosition}`;
  if (effect.condition?.targetHas) text += ` se o alvo tiver ${effect.condition.targetHas}`;
  if (effect.condition?.resourceAtLeast) text += ` se tiver ${effect.condition.resourceAtLeast} de recurso`;
  return text;
}

export function describeEffects(effects: readonly CardEffectDef[]): string {
  return effects.map(describeEffect).join(" e ");
}

export function describeCardEffects(def: CardDefinition): string {
  if (TEXT_OVERRIDE[def.key]) {
    return TEXT_OVERRIDE[def.key]!;
  }
  const parts = def.effects.map(describeEffect);
  if (parts.length === 0) {
    return "Efeito ainda sem descrição.";
  }
  const joined = parts.join(" e ");
  const target = TARGET_PT[def.targetType];
  const needsTarget = def.effects.some((row) =>
    ["DAMAGE", "HEAL", "SHIELD", "APPLY_STATUS", "REMOVE_STATUS"].includes(String(row.op)),
  );
  return needsTarget ? `${joined} ${target}.` : `${joined}.`;
}

export function cardLabel(key: string): string {
  return LABELS[key] ?? getCardDefinition(key)?.name ?? key;
}

export function cardTypeLabel(type: CardDefinition["type"]): string {
  return TYPE_PT[type] ?? type;
}

export function cardElementLabel(element: Element): string {
  return ELEMENT_PT[element] ?? element;
}

export function presentCard(key: string) {
  const def = getCardDefinition(key);
  if (!def) {
    return {
      key,
      name: cardLabel(key),
      cost: 0,
      rank: 0,
      type: "SKILL" as const,
      typeLabel: "Carta",
      element: "ARCANE" as const,
      elementLabel: "—",
      text: "Carta desconhecida.",
      description: "Carta desconhecida.",
      targetType: "ENEMY" as const,
      targetLabel: "",
      tags: [] as string[],
      locus: null as string | null,
      variant: "BASE",
      timingClass: "ACTION" as const,
      timingLabel: "Ação",
    };
  }
  const locus = def.locusRole
    ? (GENETIC_CARD_LOCI.find((row) => row.role === def.locusRole)?.key ?? null)
    : null;
  return {
    key: def.key,
    name: cardLabel(def.key),
    cost: def.cost,
    rank: def.rank,
    type: def.type,
    typeLabel: cardTypeLabel(def.type),
    element: def.element,
    elementLabel: cardElementLabel(def.element),
    text: describeCardEffects(def),
    description: describeCardEffects(def),
    targetType: def.targetType,
    targetLabel: TARGET_PT[def.targetType],
    tags: [...def.tags],
    locus,
    variant: "BASE",
    timingClass: def.locusRole === "ULTIMATE" ? "RITUAL" : def.type === "REACTION" ? "REACTION" : "ACTION",
    timingLabel: def.locusRole === "ULTIMATE" ? "Ritual" : def.type === "REACTION" ? "Reação" : "Ação",
  };
}

export type CardPresentation = ReturnType<typeof presentCard>;

export function presentPlayableCard(card: {
  key: string;
  name?: string;
  cost?: number;
  rank?: number;
  type?: CardDefinition["type"];
  element?: Element | string;
  text?: string;
  targetType?: CardTargetType | string;
  tags?: readonly string[];
  locusRole?: string;
  effects?: readonly { op: string; value?: number; status?: string; duration?: number; resource?: string; condition?: CardEffectDef["condition"] }[];
}): CardPresentation & { effects?: readonly { op: string; value?: number; status?: string; duration?: number; resource?: string; condition?: CardEffectDef["condition"] }[] } {
  const base = presentCard(card.key);
  const type = (card.type ?? base.type) as CardDefinition["type"];
  const element = (card.element ?? base.element) as Element;
  const text = card.text ?? (card.effects ? describeEffects(card.effects as CardEffectDef[]) : base.text);
  return {
    ...base,
    name: card.name ?? base.name,
    cost: card.cost ?? base.cost,
    rank: card.rank ?? card.cost ?? base.rank,
    type,
    typeLabel: cardTypeLabel(type),
    element,
    elementLabel: cardElementLabel(element),
    text,
    description: text,
    targetType: (card.targetType ?? base.targetType) as CardTargetType,
    tags: card.tags ? [...card.tags] : base.tags,
    locus: (card.locusRole
      ? (GENETIC_CARD_LOCI.find((row) => row.role === card.locusRole)?.key ?? base.locus)
      : base.locus) as GeneticCardLocusKey | null,
    effects: card.effects,
    timingClass: card.locusRole === "ULTIMATE" || type === "ULTIMATE" ? "RITUAL" : type === "REACTION" ? "REACTION" : "ACTION",
    timingLabel: card.locusRole === "ULTIMATE" || type === "ULTIMATE" ? "Ritual" : type === "REACTION" ? "Reação" : "Ação",
  };
}
