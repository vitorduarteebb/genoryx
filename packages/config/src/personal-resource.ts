/** Recurso pessoal: tokens visuais + texto gerado das regras. Sem if (HEAT) texto fixo. */

export const PERSONAL_RESOURCE_VERSION = "gxr-pr-v1" as const;

export type ResourceTrigger =
  | "APPLY_STATUS"
  | "GAIN_SHIELD"
  | "RECEIVE_DAMAGE"
  | "DEAL_DAMAGE"
  | "CRITICAL_HIT"
  | "HEAL"
  | "PLAY_CARD"
  | "END_TURN";

export type ResourceScope = "SELF" | "ALLY" | "ENEMY" | "ANY";

export type ResourceDecay = "NONE" | "END_OF_TURN" | "START_OF_TURN" | "AFTER_ATTACK" | "BATTLE_END";

export type ResourceGenerationRule = {
  trigger: ResourceTrigger;
  amount: number;
  oncePerEvent?: boolean;
  scope?: ResourceScope;
  status?: string;
  minimumShield?: number;
  targetHpBelow?: number;
  condition?: { selfPosition?: string };
};

export type ResourceConsumptionRule = {
  trigger: "PLAY_CARD" | "ACTIVATE_EFFECT";
  cardGrade?: string;
  amount: number | "ALL";
  require?: number;
  upTo?: boolean;
};

export type ResourceThreshold = {
  stacks: number;
  key: string;
  textPt: string;
  textEn: string;
};

export type PersonalResourceDefinition = {
  id: string;
  resourceType: string;
  displayName: string;
  displayNameEn: string;
  shortDescription: string;
  shortDescriptionEn: string;
  icon: string;
  maxStacks: number;
  generationRules: ResourceGenerationRule[];
  consumptionRules: ResourceConsumptionRule[];
  passiveEffects: Array<{ key: string; textPt: string; textEn: string }>;
  thresholdEffects: ResourceThreshold[];
  decayRule: ResourceDecay;
  resetRule: { battleStart: number; battleEnd: "clear"; persistBetweenRounds: boolean };
  sourceGenes: Array<{ key: string; expression: number }>;
  relatedCardIds: string[];
  generatorVersion: string;
  variant: string;
  risk?: { key: string; textPt: string; textEn: string };
  generateTriggers: string[];
  consumeTriggers: string[];
};

export const resourceVisuals: Record<string, { icon: string; namePt: string; nameEn: string }> = {
  HEAT: { icon: "🔥", namePt: "Calor", nameEn: "Heat" },
  STONE: { icon: "🪨", namePt: "Rocha", nameEn: "Stone" },
  SPORE: { icon: "🌿", namePt: "Esporo", nameEn: "Spore" },
  TIDE: { icon: "🌊", namePt: "Maré", nameEn: "Tide" },
  SPARK: { icon: "⚡", namePt: "Faísca", nameEn: "Spark" },
  VOID: { icon: "🌑", namePt: "Vazio", nameEn: "Void" },
  ECHO: { icon: "✦", namePt: "Eco", nameEn: "Echo" },
  FROST: { icon: "❄", namePt: "Geada", nameEn: "Frost" },
  FOCUS: { icon: "◎", namePt: "Foco", nameEn: "Focus" },
  RAGE: { icon: "💢", namePt: "Fúria", nameEn: "Rage" },
  MOMENTUM: { icon: "➤", namePt: "Impulso", nameEn: "Momentum" },
  CHARGE: { icon: "↗", namePt: "Carga", nameEn: "Charge" },
  ESSENCE: { icon: "◇", namePt: "Essência", nameEn: "Essence" },
  FEROCITY: { icon: "🐾", namePt: "Ferocidade", nameEn: "Ferocity" },
  GUARD: { icon: "🛡", namePt: "Guarda", nameEn: "Guard" },
};

const STATUS_PT: Record<string, string> = {
  BURN: "Queimadura",
  WET: "Umidade",
  SHOCK: "Choque",
  POISON: "Veneno",
  CRACKED: "Rachadura",
  MARKED: "Marca",
  FROST: "Geada",
  FOCUS: "Foco",
  EXPOSED: "Exposição",
};

const STATUS_EN: Record<string, string> = {
  BURN: "Burn",
  WET: "Wet",
  SHOCK: "Shock",
  POISON: "Poison",
  CRACKED: "Cracked",
  MARKED: "Mark",
  FROST: "Frost",
  FOCUS: "Focus",
  EXPOSED: "Exposed",
};

export type ResourceLocale = "pt-BR" | "en-US";

export type ResourceHelpView = {
  title: string;
  icon: string;
  blurb: string;
  simple: string;
  generate: Array<{ label: string; amount: string }>;
  consume: Array<{ label: string; amount: string }>;
  limit: string;
  decay: string;
  effects: Array<{ label: string; text: string }>;
  risk: string | null;
  origin: Array<{ key: string; expression: number }>;
  cards: string[];
  debug: string;
};

function statusName(status: string | undefined, locale: ResourceLocale): string {
  if (!status) return locale === "en-US" ? "a status" : "um estado";
  return (locale === "en-US" ? STATUS_EN[status] : STATUS_PT[status]) ?? status;
}

function posName(slot: string | undefined, locale: ResourceLocale): string {
  if (!slot) return "";
  return locale === "en-US" ? ` while in ${slot}` : ` se estiver em ${slot}`;
}

export function formatGenerationRule(rule: ResourceGenerationRule, locale: ResourceLocale): string {
  const en = locale === "en-US";
  const pos = posName(rule.condition?.selfPosition, locale);
  if (rule.trigger === "APPLY_STATUS") {
    return en ? `Apply ${statusName(rule.status, locale)}${pos}` : `Aplicar ${statusName(rule.status, locale)}${pos}`;
  }
  if (rule.trigger === "GAIN_SHIELD") {
    const min = rule.minimumShield ? (en ? ` at least ${rule.minimumShield}` : ` pelo menos ${rule.minimumShield}`) : "";
    return en ? `Gain${min} Shield${pos}` : `Receber${min} de escudo${pos}`;
  }
  if (rule.trigger === "RECEIVE_DAMAGE") {
    return en ? `Take damage${pos}` : `Receber dano${pos}`;
  }
  if (rule.trigger === "DEAL_DAMAGE") {
    const hp = rule.targetHpBelow ? (en ? ` to a target below ${Math.round(rule.targetHpBelow * 100)}% HP` : ` em alvo abaixo de ${Math.round(rule.targetHpBelow * 100)}% de vida`) : "";
    return en ? `Deal damage${hp}${pos}` : `Causar dano${hp}${pos}`;
  }
  if (rule.trigger === "CRITICAL_HIT") {
    return en ? `Land a critical hit${pos}` : `Acertar um crítico${pos}`;
  }
  if (rule.trigger === "HEAL") {
    return en ? `Heal${pos}` : `Curar${pos}`;
  }
  return rule.trigger;
}

export function formatConsumptionRule(rule: ResourceConsumptionRule, locale: ResourceLocale, name: string): string {
  const en = locale === "en-US";
  const qty =
    rule.amount === "ALL"
      ? en
        ? `all ${name}`
        : `todo o ${name}`
      : rule.upTo
        ? en
          ? `up to ${rule.amount} ${name}`
          : `até ${rule.amount} ${name}`
        : `${rule.amount} ${name}`;
  const need = rule.require ? (en ? ` (needs ${rule.require})` : ` (requer ${rule.require})`) : "";
  if (rule.cardGrade === "G9") return en ? `Signature consumes ${qty}${need}` : `A Assinatura consome ${qty}${need}`;
  if (rule.cardGrade === "G10") return en ? `Supreme consumes ${qty}${need}` : `A Suprema consome ${qty}${need}`;
  if (rule.cardGrade) return en ? `${rule.cardGrade} consumes ${qty}${need}` : `${rule.cardGrade} consome ${qty}${need}`;
  return en ? `Cards consume ${qty}${need}` : `Cartas consomem ${qty}${need}`;
}

export function formatDecay(rule: ResourceDecay, name: string, locale: ResourceLocale): string {
  const en = locale === "en-US";
  if (rule === "NONE") return en ? `${name} does not fade during battle.` : `${name} não desaparece automaticamente durante a batalha.`;
  if (rule === "END_OF_TURN") return en ? `Loses 1 ${name} at the end of the turn.` : `Perde 1 ${name} no fim do turno.`;
  if (rule === "START_OF_TURN") return en ? `Loses 1 ${name} at the start of the turn.` : `Perde 1 ${name} no início do turno.`;
  if (rule === "AFTER_ATTACK") return en ? `Loses 1 ${name} after attacking.` : `Perde 1 ${name} depois de atacar.`;
  return en ? `${name} clears when battle ends.` : `${name} zera ao fim da batalha.`;
}

export function explainPersonalResource(def: PersonalResourceDefinition, locale: ResourceLocale = "pt-BR"): ResourceHelpView {
  const en = locale === "en-US";
  const name = en ? def.displayNameEn : def.displayName;
  const generate = def.generationRules.map((rule) => ({
    label: formatGenerationRule(rule, locale),
    amount: `+${rule.amount} ${name}`,
  }));
  const consume = def.consumptionRules.map((rule) => ({
    label: formatConsumptionRule(rule, locale, name),
    amount: rule.amount === "ALL" ? (en ? "all" : "tudo") : `−${rule.amount}`,
  }));
  const simpleBits = generate.map((row) => row.label.toLowerCase());
  const simple = en
    ? `Gain ${name} by ${simpleBits.join(" or ")}. Spend it on Signature and Supreme.`
    : `Ganhe ${name} ${simpleBits.join(" ou ")}. Use nas cartas Assinatura e Suprema.`;
  return {
    title: name,
    icon: def.icon,
    blurb: en ? def.shortDescriptionEn : def.shortDescription,
    simple,
    generate,
    consume,
    limit: `0 / ${def.maxStacks}`,
    decay: formatDecay(def.decayRule, name, locale),
    effects: [
      ...def.passiveEffects.map((row) => ({ label: en ? "Each stack" : "Cada stack", text: en ? row.textEn : row.textPt })),
      ...def.thresholdEffects.map((row) => ({
        label: `${row.stacks} ${name}`,
        text: en ? row.textEn : row.textPt,
      })),
    ],
    risk: def.risk ? (en ? def.risk.textEn : def.risk.textPt) : null,
    origin: def.sourceGenes,
    cards: def.relatedCardIds,
    debug: [
      `Resource: ${def.resourceType}`,
      `variant: ${def.variant}`,
      `maxStacks: ${def.maxStacks}`,
      `generation: ${def.generationRules.map((row) => `${row.trigger}${row.status ? `:${row.status}` : ""} +${row.amount}`).join(" | ")}`,
      `consumption: ${def.consumptionRules.map((row) => `${row.cardGrade ?? row.trigger} ${row.amount}`).join(" | ")}`,
      `decay: ${def.decayRule}`,
      `sourceGenes: ${def.sourceGenes.map((row) => `${row.key} ${row.expression}`).join(" ")}`,
      `generatorVersion: ${def.generatorVersion}`,
    ].join("\n"),
  };
}

export function resourcePlayGate(
  effects: ReadonlyArray<{
    op: string;
    value?: number;
    resource?: string;
    condition?: { resourceAtLeast?: number };
  }>,
  current = 0,
  def?: PersonalResourceDefinition | null,
): { need: number; have: number; name: string; missing: number } | null {
  const consume = effects.find((row) => row.op === "CONSUME_RESOURCE");
  if (!consume) return null;
  const need = consume.condition?.resourceAtLeast ?? (consume.value && consume.value > 0 ? consume.value : def?.maxStacks ?? 1);
  if (current >= need) return null;
  const name = def?.displayName ?? resourceVisuals[consume.resource ?? ""]?.namePt ?? consume.resource ?? "recurso";
  return { need, have: current, name, missing: need - current };
}

export function resourceChipFromEffect(effect: {
  op: string;
  value?: number;
  resource?: string;
  condition?: { resourceAtLeast?: number; targetHas?: string; selfPosition?: string };
}): { kind: "gain" | "consume" | "require"; text: string } | null {
  const visual = resourceVisuals[effect.resource ?? ""] ?? { icon: "●", namePt: effect.resource ?? "recurso" };
  if (effect.op === "GAIN_RESOURCE") {
    const extra = effect.condition?.targetHas
      ? ` se o alvo tiver ${statusName(effect.condition.targetHas, "pt-BR")}`
      : effect.condition?.selfPosition
        ? ` se estiver em ${effect.condition.selfPosition}`
        : "";
    return { kind: "gain", text: `${visual.icon} +${effect.value ?? 1} ${visual.namePt}${extra}` };
  }
  if (effect.op === "CONSUME_RESOURCE") {
    const need = effect.condition?.resourceAtLeast ?? effect.value ?? 1;
    return { kind: "consume", text: `${visual.icon} Consome ${effect.value ?? 1} ${visual.namePt}` };
  }
  if (effect.condition?.resourceAtLeast) {
    return { kind: "require", text: `${visual.icon} Requer ${effect.condition.resourceAtLeast} ${visual.namePt}` };
  }
  return null;
}
