import { genomeV2, type GenomeCardSpeed, type GenomeDomain } from "./combat-genome";
import { resourceVisuals } from "./personal-resource";

export type CardEffectLike = {
  op: string;
  value?: number;
  status?: string;
  duration?: number;
  resource?: string;
  condition?: {
    selfPosition?: string;
    targetHas?: string;
    resourceAtLeast?: number;
    targetHpBelow?: number;
  };
};

export type CardKeywordKey =
  | "BURN"
  | "SHOCK"
  | "POISON"
  | "MARK"
  | "MARKED"
  | "GUARD"
  | "STUN"
  | "COUNTER"
  | "EXECUTE"
  | "INEVITABLE"
  | "DELAY"
  | "ADVANCE"
  | "CLEANSE"
  | "DISPEL"
  | "REACTION"
  | "HEAT"
  | "SPARK"
  | "FOCUS"
  | "IMPULSE"
  | "SHIELD"
  | "HEAL"
  | "ENERGY";

export const CARD_KEYWORD_HELP: Record<CardKeywordKey, { label: string; help: string }> = {
  BURN: { label: "Queimadura", help: "Dano ao fim do round. STA aumenta a potência. RES reduz." },
  SHOCK: { label: "Choque", help: "Pressão elétrica. Pode atrapalhar a iniciativa do alvo." },
  POISON: { label: "Veneno", help: "Dano contínuo. Pilhas se acumulam até o teto." },
  MARK: { label: "Marcado", help: "Alvo marcado fica mais fácil de acertar e abre executes." },
  MARKED: { label: "Marcado", help: "Alvo marcado fica mais fácil de acertar e abre executes." },
  GUARD: { label: "Guarda", help: "Proteção. ATK S pode quebrá-la." },
  STUN: { label: "Atordoamento", help: "Trava ataques neste turno." },
  COUNTER: { label: "Contra", help: "Resposta no Reaction Stack após um gatilho." },
  EXECUTE: { label: "Execute", help: "Payoff contra alvo marcado ou com vida baixa." },
  INEVITABLE: { label: "Inevitável", help: "Ignora Evasão." },
  DELAY: { label: "Delay", help: "Recua a ação na Timeline. Não cancela." },
  ADVANCE: { label: "Advance", help: "Adianta a ação na Timeline." },
  CLEANSE: { label: "Purificar", help: "Remove status negativos." },
  DISPEL: { label: "Dissipar", help: "Remove escudos ou benefícios do alvo." },
  REACTION: { label: "Reação", help: "Dispara no Reaction Stack, não na Timeline normal." },
  HEAT: { label: "Calor", help: "Recurso pessoal. Fonte, sink e payoff na identidade." },
  SPARK: { label: "Faísca", help: "Recurso pessoal elétrico. Alimenta assinaturas." },
  FOCUS: { label: "Foco", help: "Recurso pessoal de concentração." },
  IMPULSE: { label: "Impulso", help: "Recurso pessoal de ritmo." },
  SHIELD: { label: "Escudo", help: "Absorve dano antes da vida." },
  HEAL: { label: "Cura", help: "Recupera vida. Escala com MAG quando a carta é mágica." },
  ENERGY: { label: "Energia", help: "Paga o custo das cartas do round." },
};

export type CardFaceLine = {
  kind: "damage" | "heal" | "shield" | "status" | "resource" | "energy" | "momentum" | "draw" | "cleanse" | "trigger" | "flow";
  icon: string;
  label: string;
  value?: string;
  keyword?: CardKeywordKey;
};

export type CardReadout = {
  faceLines: CardFaceLine[];
  conditionLines: CardFaceLine[];
  triggerLine: string | null;
  badges: Array<{ key: string; label: string }>;
  keywords: Array<{ key: CardKeywordKey; label: string; help: string }>;
  details: {
    scaling?: string;
    defense?: string;
    domain?: string;
    speed?: string;
    locus?: string | null;
    tags: string[];
    resourceNote?: string | null;
    fantasyNote?: string | null;
  };
  faceSummary: string;
};

const STATUS_PT: Record<string, string> = {
  BURN: "Queimadura",
  SHOCK: "Choque",
  POISON: "Veneno",
  MARK: "Marcado",
  MARKED: "Marcado",
  GUARD: "Guarda",
  STUN: "Atordoamento",
  SLOW: "Lentidão",
  MOLTEN: "Fusão",
  SLEEP: "Sono",
  BLIND: "Cegueira",
  WARD: "Proteção",
};

const STATUS_ICON: Record<string, string> = {
  BURN: "🔥",
  SHOCK: "⚡",
  POISON: "☠️",
  MARK: "◎",
  MARKED: "◎",
  GUARD: "⛨",
  STUN: "✦",
  SLOW: "⤵",
  MOLTEN: "♨",
};

const RESOURCE_KEY: Record<string, CardKeywordKey> = {
  HEAT: "HEAT",
  SPARK: "SPARK",
  FOCUS: "FOCUS",
  IMPULSE: "IMPULSE",
  MOMENTUM: "IMPULSE",
};

function resourceLabel(id?: string) {
  return resourceVisuals[id ?? ""]?.namePt ?? id ?? "recurso";
}

function resourceIcon(id?: string) {
  return resourceVisuals[id ?? ""]?.icon ?? "●";
}

function statusLabel(status?: string) {
  if (!status) return "status";
  return STATUS_PT[status] ?? CARD_KEYWORD_HELP[status as CardKeywordKey]?.label ?? status;
}

function domainBadge(domain?: GenomeDomain | string | null) {
  if (!domain) return null;
  if (domain === "PHYSICAL" || domain === "Físico") return { key: "PHYSICAL", label: "Físico" };
  if (domain === "MAGIC" || domain === "Mágico" || domain === "MAGICAL") return { key: "MAGIC", label: "Mágico" };
  if (domain === "HYBRID" || domain === "Híbrido") return { key: "HYBRID", label: "Híbrido" };
  if (domain === "UTILITY" || domain === "Utilidade") return { key: "UTILITY", label: "Utilidade" };
  return { key: String(domain), label: String(domain) };
}

function speedBadge(speed?: GenomeCardSpeed | string | null) {
  if (!speed) return null;
  const map: Record<string, string> = {
    VERY_FAST: "Muito rápida",
    FAST: "Rápida",
    NORMAL: "Normal",
    HEAVY: "Pesada",
    "Muito rápida": "Muito rápida",
    Rápida: "Rápida",
    Normal: "Normal",
    Pesada: "Pesada",
  };
  return { key: String(speed), label: map[String(speed)] ?? String(speed) };
}

function fantasyNote(name: string, effects: readonly CardEffectLike[]) {
  const lower = name.toLowerCase();
  const ops = new Set(effects.map((row) => row.op));
  const hasDamage = ops.has("DAMAGE");
  const hasShield = ops.has("SHIELD");
  const hasStatus = ops.has("APPLY_STATUS");
  if (/mordida|golpe|investida|presa|cornada/.test(lower) && !hasDamage) {
    return "Nome corporal, mas a carta atual não causa dano. Revisar no próximo passe de conteúdo.";
  }
  if (/prisão|trava|laço|campo/.test(lower) && !hasStatus) {
    return "Nome de controle sem status. Revisar no próximo passe de conteúdo.";
  }
  if (/véu|égide|muralha|guarda|casca|placa/.test(lower) && !hasShield && !ops.has("REMOVE_STATUS")) {
    return "Nome defensivo sem escudo/cleanse. Revisar no próximo passe de conteúdo.";
  }
  if (/marca/.test(lower) && !effects.some((row) => row.status === "MARK" || row.status === "MARKED" || row.condition?.targetHas === "MARK")) {
    return "Nome de marca sem Mark estruturado. O status elemental cobre o setup por enquanto.";
  }
  return null;
}

export function inferDomainFromFantasy(name: string, hasDamage = true, tags: readonly string[] = []): GenomeDomain | null {
  const lower = name.toLowerCase();
  if (/mordida|golpe|investida|presa|cornada|chicote|espinho/.test(lower)) return "PHYSICAL";
  if (/véu|égide|muralha|guarda|casca|pulso|pacto|passo|abertura|troca/.test(lower) && !hasDamage) return "UTILITY";
  if (tags.includes("PHYSICAL")) return "PHYSICAL";
  if (tags.includes("MAGIC") || tags.includes("MAGICAL")) return "MAGIC";
  return null;
}

export function buildCardReadout(input: {
  name: string;
  cost: number;
  type?: string;
  element?: string | null;
  locus?: string | null;
  tags?: readonly string[];
  effects?: readonly CardEffectLike[];
  domain?: GenomeDomain | string | null;
  speed?: GenomeCardSpeed | string | null;
  estimatedDamage?: number | null;
  estimatedShield?: number | null;
  estimatedHeal?: number | null;
}): CardReadout {
  const effects = input.effects ?? [];
  const faceLines: CardFaceLine[] = [];
  const conditionLines: CardFaceLine[] = [];
  const keywords = new Map<CardKeywordKey, { key: CardKeywordKey; label: string; help: string }>();
  const addKeyword = (key: CardKeywordKey) => {
    const help = CARD_KEYWORD_HELP[key];
    if (help) keywords.set(key, { key, ...help });
  };

  let triggerLine: string | null = null;
  if (input.type === "REACTION" || input.tags?.includes("REACTION") || input.locus === "G7") {
    triggerLine = "Quando o gatilho ocorrer no Reaction Stack";
    addKeyword("REACTION");
    const burnGate = effects.find((row) => row.condition?.targetHas === "BURN" || row.condition?.targetHas === "SHOCK");
    if (burnGate?.condition?.targetHas === "BURN") {
      triggerLine = "Quando um inimigo em Queimadura atacar";
      addKeyword("BURN");
    } else if (burnGate?.condition?.targetHas === "SHOCK") {
      triggerLine = "Quando um inimigo em Choque atacar";
      addKeyword("SHOCK");
    }
  }

  const consume = effects.find((row) => row.op === "CONSUME_RESOURCE");
  const payoff = effects.filter((row) => row.op !== "CONSUME_RESOURCE");

  if (consume) {
    const need = consume.condition?.resourceAtLeast ?? consume.value ?? 1;
    const amount = consume.value ?? 1;
    const resKey = RESOURCE_KEY[consume.resource ?? ""] ?? "HEAT";
    addKeyword(resKey);
    if (need !== amount) {
      faceLines.push({
        kind: "flow",
        icon: resourceIcon(consume.resource),
        label: `Com ${need}+ ${resourceLabel(consume.resource)} → consome ${amount}`,
        keyword: resKey,
      });
    } else {
      faceLines.push({
        kind: "resource",
        icon: resourceIcon(consume.resource),
        label: `Consuma ${amount} ${resourceLabel(consume.resource)}`,
        value: String(amount),
        keyword: resKey,
      });
    }
  }

  for (const effect of payoff) {
    const conditional = Boolean(effect.condition?.targetHas || effect.condition?.selfPosition || effect.condition?.targetHpBelow);
    const bucket = conditional ? conditionLines : faceLines;
    if (effect.condition?.targetHas) {
      const key = (effect.condition.targetHas === "MARKED" ? "MARK" : effect.condition.targetHas) as CardKeywordKey;
      if (CARD_KEYWORD_HELP[key]) addKeyword(key);
    }
    if (effect.op === "DAMAGE") {
      const domain = input.domain === "PHYSICAL" ? "Físico" : input.domain === "HYBRID" ? "Híbrido" : "Mágico";
      const shown = input.estimatedDamage ?? effect.value ?? 0;
      bucket.push({
        kind: "damage",
        icon: "⚔",
        label: `${shown} Dano ${domain}`,
        value: String(shown),
      });
    } else if (effect.op === "SHIELD") {
      addKeyword("SHIELD");
      const shown = input.estimatedShield ?? effect.value ?? 0;
      bucket.push({ kind: "shield", icon: "🛡", label: `Escudo · ${shown}`, value: String(shown), keyword: "SHIELD" });
    } else if (effect.op === "HEAL") {
      addKeyword("HEAL");
      const shown = input.estimatedHeal ?? effect.value ?? 0;
      bucket.push({ kind: "heal", icon: "✚", label: `Cura · ${shown}`, value: String(shown), keyword: "HEAL" });
    } else if (effect.op === "APPLY_STATUS" && effect.status) {
      const key = (effect.status === "MARKED" ? "MARK" : effect.status) as CardKeywordKey;
      if (CARD_KEYWORD_HELP[key]) addKeyword(key);
      const rounds = effect.duration ?? 2;
      bucket.push({
        kind: "status",
        icon: STATUS_ICON[effect.status] ?? "●",
        label: `${statusLabel(effect.status)} · ${rounds} rodada${rounds === 1 ? "" : "s"}`,
        value: String(rounds),
        keyword: CARD_KEYWORD_HELP[key] ? key : undefined,
      });
    } else if (effect.op === "REMOVE_STATUS") {
      addKeyword("CLEANSE");
      bucket.push({ kind: "cleanse", icon: "✧", label: "Purifica status", keyword: "CLEANSE" });
    } else if (effect.op === "GAIN_ENERGY") {
      addKeyword("ENERGY");
      bucket.push({ kind: "energy", icon: "⚡", label: `Energia +${effect.value ?? 1}`, value: String(effect.value ?? 1), keyword: "ENERGY" });
    } else if (effect.op === "GAIN_MOMENTUM") {
      addKeyword("IMPULSE");
      bucket.push({ kind: "momentum", icon: "➤", label: `Ímpeto +${effect.value ?? 1}`, value: String(effect.value ?? 1), keyword: "IMPULSE" });
    } else if (effect.op === "DRAW") {
      bucket.push({ kind: "draw", icon: "🂠", label: `Compre ${effect.value ?? 1}` });
    } else if (effect.op === "GAIN_RESOURCE") {
      const resKey = RESOURCE_KEY[effect.resource ?? ""] ?? "HEAT";
      addKeyword(resKey);
      bucket.push({
        kind: "resource",
        icon: resourceIcon(effect.resource),
        label: `+${effect.value ?? 1} ${resourceLabel(effect.resource)}`,
        value: String(effect.value ?? 1),
        keyword: resKey,
      });
    }
  }

  const badges = [
    domainBadge(input.domain),
    speedBadge(input.speed),
    input.type === "REACTION" || input.locus === "G7" ? { key: "REACTION", label: "Reação" } : null,
    input.locus === "G9" ? { key: "SIGNATURE", label: "Assinatura" } : null,
    input.locus === "G10" ? { key: "SUPREME", label: "Suprema" } : null,
  ].filter((row): row is { key: string; label: string } => Boolean(row));

  const metaTags = (input.tags ?? []).filter(
    (tag) =>
      ![
        "PHYSICAL",
        "MAGIC",
        "MAGICAL",
        "HYBRID",
        "UTILITY",
        "FAST",
        "NORMAL",
        "HEAVY",
        "VERY_FAST",
        "FOUNDATION",
        "SPECIALIZATION",
        "ADVANCED",
        "ATTACK",
        "DEFENSE",
        "SYNERGY",
      ].includes(tag),
  );

  const defense = input.domain === "PHYSICAL" ? "DEF" : input.domain === "HYBRID" ? "DEF / RES" : input.domain === "MAGIC" ? "RES" : undefined;
  const scaling =
    input.domain === "PHYSICAL"
      ? `${Math.round(genomeV2.damage.legacyScale * 100)}% ATK`
      : input.domain === "MAGIC"
        ? `${Math.round(genomeV2.damage.legacyScale * 100)}% MAG`
        : input.domain === "HYBRID"
          ? "ATK + MAG"
          : undefined;

  const resourceNote = consume
    ? consume.condition?.resourceAtLeast != null && consume.condition.resourceAtLeast !== (consume.value ?? 1)
      ? `Mínimo ${consume.condition.resourceAtLeast} para jogar. Consome ${consume.value ?? 1} ${resourceLabel(consume.resource)}.`
      : `Consome ${consume.value ?? 1} ${resourceLabel(consume.resource)}.`
    : null;

  const faceSummary = [...faceLines, ...conditionLines].map((row) => row.label).join(" · ") || "Efeito utilitário";

  return {
    faceLines: faceLines.slice(0, 4),
    conditionLines: conditionLines.slice(0, 3).map((row) => {
      const cond = effects.find((effect) => {
        if (row.kind === "damage" && effect.op === "DAMAGE") return Boolean(effect.condition);
        if (row.kind === "shield" && effect.op === "SHIELD") return Boolean(effect.condition);
        if (row.kind === "status" && effect.op === "APPLY_STATUS") return Boolean(effect.condition);
        return false;
      });
      if (!cond?.condition) return row;
      const when = cond.condition.targetHas
        ? `Alvo em ${statusLabel(cond.condition.targetHas)}`
        : cond.condition.selfPosition
          ? `Em ${cond.condition.selfPosition}`
          : "Condição";
      return { ...row, label: `${when}: ${row.label}` };
    }),
    triggerLine,
    badges,
    keywords: [...keywords.values()],
    details: {
      scaling,
      defense,
      domain: domainBadge(input.domain)?.label,
      speed: speedBadge(input.speed)?.label,
      locus: input.locus ?? null,
      tags: metaTags.slice(0, 6),
      resourceNote,
      fantasyNote: fantasyNote(input.name, effects),
    },
    faceSummary,
  };
}

export function resourceGateCopy(input: {
  need: number;
  have: number;
  name: string;
  consumeAmount?: number;
}): string {
  if (input.consumeAmount != null && input.consumeAmount !== input.need) {
    return `Precisa de ${input.need}+ ${input.name} · consome ${input.consumeAmount} · atual ${input.have}`;
  }
  return `Precisa de ${input.need} ${input.name} · atual ${input.have}`;
}
