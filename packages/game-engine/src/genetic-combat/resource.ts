import {
  PERSONAL_RESOURCE_VERSION,
  elementResource,
  resourceVisuals,
  type PersonalResourceDefinition,
  type ResourceConsumptionRule,
  type ResourceDecay,
  type ResourceGenerationRule,
} from "@nexora/config";
import type { CreatureBlueprint } from "../genes/generate";
import { createSeededRandom } from "../random/random-service";
import { subSeed } from "./seeds";
import type { BirthRolls, GeneticExpression } from "./types";

export type ResourceVariant =
  | "MAGMA_CORE"
  | "PREDATORY_FURNACE"
  | "UNSTABLE_HEART"
  | "FRONT_FORGE"
  | "STONE_BASTION"
  | "SPARK_HUNT"
  | "SPORE_COLONY"
  | "TIDE_SETUP"
  | "VOID_MARK"
  | "ECHO_FOCUS"
  | "FROST_WALL"
  | "RAGE_BLOOD"
  | "MOMENTUM_FLOW"
  | "CHARGE_LINE";

const BLURB: Record<ResourceVariant, { pt: string; en: string }> = {
  MAGMA_CORE: {
    pt: "Converte defesa e queimaduras em Calor para alimentar habilidades vulcânicas.",
    en: "Turns defense and burns into Heat to feed volcanic abilities.",
  },
  PREDATORY_FURNACE: {
    pt: "Aquece ao ferir alvos feridos e ao cravar críticos.",
    en: "Heats up by striking wounded prey and landing crits.",
  },
  UNSTABLE_HEART: {
    pt: "Acumula Calor ao sofrer dano. No máximo, o núcleo superaquece.",
    en: "Builds Heat by taking hits. At max, the core overheats.",
  },
  FRONT_FORGE: {
    pt: "Na frente, cada golpe recebido vira Calor.",
    en: "On the front line, incoming hits become Heat.",
  },
  STONE_BASTION: {
    pt: "Escudo e impacto na linha de frente viram Rocha.",
    en: "Shield and frontline impact become Stone.",
  },
  SPARK_HUNT: {
    pt: "Críticos e choque alimentam Faísca para execute.",
    en: "Crits and shock feed Spark for execute.",
  },
  SPORE_COLONY: {
    pt: "Cura e veneno espalham Esporo pela colônia.",
    en: "Heals and poison spread Spore through the colony.",
  },
  TIDE_SETUP: {
    pt: "Umidade e cura enchem a Maré para controle.",
    en: "Wet and heal fill Tide for control.",
  },
  VOID_MARK: {
    pt: "Marcas e quedas alimentam o Vazio.",
    en: "Marks and knockouts feed the Void.",
  },
  ECHO_FOCUS: {
    pt: "Energia e foco ressoam como Eco.",
    en: "Energy and focus resonate as Echo.",
  },
  FROST_WALL: {
    pt: "Geada e escudo compactam a muralha.",
    en: "Frost and shield pack the wall.",
  },
  RAGE_BLOOD: {
    pt: "Dano recebido vira Fúria. Explode nas cartas finais.",
    en: "Incoming damage becomes Rage. It explodes on finishers.",
  },
  MOMENTUM_FLOW: {
    pt: "Movimento e golpes rápidos geram Impulso, que some no fim do turno.",
    en: "Movement and quick hits build Momentum, which fades at turn end.",
  },
  CHARGE_LINE: {
    pt: "Avançar da retaguarda e chifrar geram Carga.",
    en: "Advancing from the back and ramming generate Charge.",
  },
};

function visualOf(type: string) {
  return resourceVisuals[type] ?? { icon: "●", namePt: type, nameEn: type };
}

function consumeSignatureSupreme(g9 = 1, g10: number | "ALL" = 2, g10Require?: number): ResourceConsumptionRule[] {
  return [
    { trigger: "PLAY_CARD", cardGrade: "G9", amount: g9 },
    { trigger: "PLAY_CARD", cardGrade: "G10", amount: g10, require: g10Require ?? (g10 === "ALL" ? 3 : g10) },
  ];
}

function pickType(blueprint: CreatureBlueprint, expression: GeneticExpression, verbs: string[], rng: ReturnType<typeof createSeededRandom>): string {
  if (verbs.includes("CHARGE") && rng.chance(0.42)) return "CHARGE";
  if (verbs.some((row) => ["DODGE", "LEAP", "REPOSITION", "FLIGHT"].includes(row)) && rng.chance(0.38)) return "MOMENTUM";
  if ((expression.predator ?? 0) >= 70 && rng.chance(0.32)) return "RAGE";
  if (verbs.includes("ARCANE") && rng.chance(0.35)) return "FOCUS";
  return elementResource[blueprint.elementPrimary] ?? "ECHO";
}

function pickVariant(input: {
  type: string;
  archetype: string;
  quirks: string[];
  rolls: BirthRolls;
  starter: boolean;
  rng: ReturnType<typeof createSeededRandom>;
}): ResourceVariant {
  const { type, archetype, quirks, rolls, starter } = input;
  if (type === "HEAT") {
    if (!starter && (quirks.includes("UNSTABLE_CORE") || quirks.includes("NEGATIVE_MUTATION") || rolls.stability < 28)) {
      return "UNSTABLE_HEART";
    }
    if (archetype === "PREDATOR" || quirks.includes("PREDATORY")) return "PREDATORY_FURNACE";
    if (quirks.includes("STUBBORN") || rolls.coherence < 40) return "FRONT_FORGE";
    return "MAGMA_CORE";
  }
  if (type === "RAGE") return "RAGE_BLOOD";
  if (type === "MOMENTUM") return "MOMENTUM_FLOW";
  if (type === "CHARGE") return "CHARGE_LINE";
  if (type === "STONE" || type === "GUARD") return "STONE_BASTION";
  if (type === "SPARK") return "SPARK_HUNT";
  if (type === "SPORE" || type === "FEROCITY") return "SPORE_COLONY";
  if (type === "TIDE") return "TIDE_SETUP";
  if (type === "VOID") return "VOID_MARK";
  if (type === "FROST") return "FROST_WALL";
  if (type === "FOCUS" || type === "ECHO" || type === "ESSENCE") return "ECHO_FOCUS";
  return "MAGMA_CORE";
}

function rulesFor(variant: ResourceVariant): {
  generation: ResourceGenerationRule[];
  decay: ResourceDecay;
  max: number;
  passive: PersonalResourceDefinition["passiveEffects"];
  thresholds: PersonalResourceDefinition["thresholdEffects"];
  risk?: PersonalResourceDefinition["risk"];
} {
  switch (variant) {
    case "MAGMA_CORE":
      return {
        generation: [
          { trigger: "APPLY_STATUS", status: "BURN", amount: 1, oncePerEvent: true, scope: "SELF" },
          { trigger: "GAIN_SHIELD", amount: 1, minimumShield: 1, oncePerEvent: true, scope: "SELF" },
        ],
        decay: "NONE",
        max: 3,
        passive: [],
        thresholds: [
          { stacks: 2, key: "MAGMA_READY", textPt: "Cartas de magma podem ativar o efeito secundário.", textEn: "Magma cards can unlock their secondary effect." },
          { stacks: 3, key: "MOLTEN", textPt: "Permite ativar Molten na Suprema.", textEn: "Allows Molten on the Supreme." },
        ],
      };
    case "PREDATORY_FURNACE":
      return {
        generation: [
          { trigger: "DEAL_DAMAGE", amount: 1, targetHpBelow: 0.5, oncePerEvent: true, scope: "SELF" },
          { trigger: "CRITICAL_HIT", amount: 1, oncePerEvent: true, scope: "SELF" },
        ],
        decay: "NONE",
        max: 3,
        passive: [{ key: "CRIT_MARK", textPt: "+ precisão de execute contra alvo marcado.", textEn: "+ execute accuracy vs marked targets." }],
        thresholds: [{ stacks: 2, key: "EXECUTE", textPt: "Execute ganha o bônus predador.", textEn: "Execute gains the predator bonus." }],
      };
    case "UNSTABLE_HEART":
      return {
        generation: [{ trigger: "RECEIVE_DAMAGE", amount: 1, oncePerEvent: true, scope: "SELF" }],
        decay: "NONE",
        max: 4,
        passive: [{ key: "MAG_UP", textPt: "Cada stack aumenta um pouco o dano mágico.", textEn: "Each stack slightly raises magic damage." }],
        thresholds: [],
        risk: { key: "OVERHEAT", textPt: "Ao atingir 4 Calor, sofre 8 de dano (Overheat).", textEn: "At 4 Heat, take 8 damage (Overheat)." },
      };
    case "FRONT_FORGE":
      return {
        generation: [
          { trigger: "RECEIVE_DAMAGE", amount: 1, oncePerEvent: true, scope: "SELF", condition: { selfPosition: "FRONT" } },
          { trigger: "APPLY_STATUS", status: "BURN", amount: 1, oncePerEvent: true, scope: "SELF" },
        ],
        decay: "NONE",
        max: 3,
        passive: [],
        thresholds: [{ stacks: 2, key: "FRONT_BONUS", textPt: "Em FRONT, o próximo golpe de Calor queima mais.", textEn: "In FRONT, the next Heat strike burns harder." }],
      };
    case "STONE_BASTION":
      return {
        generation: [
          { trigger: "GAIN_SHIELD", amount: 1, oncePerEvent: true, scope: "SELF" },
          { trigger: "RECEIVE_DAMAGE", amount: 1, oncePerEvent: true, scope: "SELF", condition: { selfPosition: "FRONT" } },
        ],
        decay: "NONE",
        max: 3,
        passive: [{ key: "SHIELD_IN", textPt: "Cada Rocha aumenta um pouco o escudo recebido.", textEn: "Each Stone slightly increases incoming Shield." }],
        thresholds: [{ stacks: 3, key: "COUNTER", textPt: "Réplica fica pronta.", textEn: "Counter becomes ready." }],
      };
    case "SPARK_HUNT":
      return {
        generation: [
          { trigger: "CRITICAL_HIT", amount: 1, oncePerEvent: true, scope: "SELF" },
          { trigger: "APPLY_STATUS", status: "SHOCK", amount: 1, oncePerEvent: true, scope: "SELF" },
        ],
        decay: "END_OF_TURN",
        max: 3,
        passive: [],
        thresholds: [{ stacks: 2, key: "CONDUCT", textPt: "Choque pode virar Condutivo.", textEn: "Shock can become Conductive." }],
      };
    case "SPORE_COLONY":
      return {
        generation: [
          { trigger: "APPLY_STATUS", status: "POISON", amount: 1, oncePerEvent: true, scope: "SELF" },
          { trigger: "HEAL", amount: 1, oncePerEvent: true, scope: "SELF" },
        ],
        decay: "NONE",
        max: 3,
        passive: [],
        thresholds: [{ stacks: 3, key: "SPREAD", textPt: "A Suprema pode espalhar veneno.", textEn: "Supreme can spread poison." }],
      };
    case "TIDE_SETUP":
      return {
        generation: [
          { trigger: "APPLY_STATUS", status: "WET", amount: 1, oncePerEvent: true, scope: "SELF" },
          { trigger: "HEAL", amount: 1, oncePerEvent: true, scope: "SELF" },
        ],
        decay: "NONE",
        max: 3,
        passive: [],
        thresholds: [{ stacks: 2, key: "CONTROL", textPt: "Controle fica mais barato de montar.", textEn: "Control setups get cheaper." }],
      };
    case "VOID_MARK":
      return {
        generation: [{ trigger: "APPLY_STATUS", status: "MARKED", amount: 1, oncePerEvent: true, scope: "SELF" }],
        decay: "NONE",
        max: 3,
        passive: [],
        thresholds: [{ stacks: 3, key: "EXECUTE", textPt: "A Suprema consome a marca.", textEn: "Supreme consumes the mark." }],
      };
    case "ECHO_FOCUS":
      return {
        generation: [
          { trigger: "HEAL", amount: 1, oncePerEvent: true, scope: "SELF" },
          { trigger: "GAIN_SHIELD", amount: 1, oncePerEvent: true, scope: "SELF" },
        ],
        decay: "END_OF_TURN",
        max: 3,
        passive: [{ key: "FOCUS", textPt: "Cada Eco ajuda a próxima carta de apoio.", textEn: "Each Echo helps the next support card." }],
        thresholds: [{ stacks: 2, key: "SIG", textPt: "A Assinatura fica disponível com 2 Eco.", textEn: "Signature unlocks at 2 Echo." }],
      };
    case "FROST_WALL":
      return {
        generation: [
          { trigger: "APPLY_STATUS", status: "FROST", amount: 1, oncePerEvent: true, scope: "SELF" },
          { trigger: "GAIN_SHIELD", amount: 1, oncePerEvent: true, scope: "SELF" },
        ],
        decay: "NONE",
        max: 3,
        passive: [],
        thresholds: [{ stacks: 3, key: "SHATTER", textPt: "Pode estilhaçar armadura rachada.", textEn: "Can shatter cracked armor." }],
      };
    case "RAGE_BLOOD":
      return {
        generation: [{ trigger: "RECEIVE_DAMAGE", amount: 1, oncePerEvent: true, scope: "SELF" }],
        decay: "AFTER_ATTACK",
        max: 3,
        passive: [{ key: "ATK", textPt: "Cada Fúria aumenta o próximo golpe.", textEn: "Each Rage boosts the next strike." }],
        thresholds: [{ stacks: 3, key: "FRENZY", textPt: "A Suprema entra em frenesi.", textEn: "Supreme enters frenzy." }],
      };
    case "MOMENTUM_FLOW":
      return {
        generation: [
          { trigger: "DEAL_DAMAGE", amount: 1, oncePerEvent: true, scope: "SELF" },
          { trigger: "CRITICAL_HIT", amount: 1, oncePerEvent: true, scope: "SELF" },
        ],
        decay: "END_OF_TURN",
        max: 3,
        passive: [],
        thresholds: [{ stacks: 2, key: "DASH", textPt: "Mobilidade ganha um passo extra.", textEn: "Mobility gains an extra step." }],
      };
    case "CHARGE_LINE":
      return {
        generation: [
          { trigger: "DEAL_DAMAGE", amount: 1, oncePerEvent: true, scope: "SELF", condition: { selfPosition: "FRONT" } },
          { trigger: "PLAY_CARD", amount: 1, oncePerEvent: true, scope: "SELF" },
        ],
        decay: "NONE",
        max: 3,
        passive: [],
        thresholds: [{ stacks: 2, key: "RAM", textPt: "A investida quebra guarda.", textEn: "The ram breaks guard." }],
      };
  }
}

export function buildPersonalResource(input: {
  blueprint: CreatureBlueprint;
  expression: GeneticExpression;
  rolls: BirthRolls;
  birthSeed: number;
  verbs: string[];
  archetype: string;
  quirks: string[];
  retryIndex?: number;
  forceVariant?: ResourceVariant;
}): PersonalResourceDefinition {
  const rng = createSeededRandom(subSeed(input.birthSeed, `resource:${input.retryIndex ?? 0}`));
  const type = input.forceVariant
    ? input.forceVariant === "RAGE_BLOOD"
      ? "RAGE"
      : input.forceVariant === "MOMENTUM_FLOW"
        ? "MOMENTUM"
        : input.forceVariant === "CHARGE_LINE"
          ? "CHARGE"
          : input.forceVariant.startsWith("SPARK")
            ? "SPARK"
            : input.forceVariant.startsWith("STONE")
              ? "STONE"
              : input.forceVariant.includes("TIDE")
                ? "TIDE"
                : input.forceVariant.includes("SPORE")
                  ? "SPORE"
                  : input.forceVariant.includes("VOID")
                    ? "VOID"
                    : input.forceVariant.includes("ECHO")
                      ? "ECHO"
                      : input.forceVariant.includes("FROST")
                        ? "FROST"
                        : "HEAT"
    : pickType(input.blueprint, input.expression, input.verbs, rng);
  const variant = input.forceVariant ?? pickVariant({
    type,
    archetype: input.archetype,
    quirks: input.quirks,
    rolls: input.rolls,
    starter: input.blueprint.origin === "STARTER",
    rng,
  });
  const pack = rulesFor(variant);
  const visual = visualOf(type);
  const copy = BLURB[variant];
  const sourceGenes = [
    { key: input.blueprint.elementPrimary, expression: input.expression.primaryElement ?? 50 },
    ...(input.blueprint.elementSecondary
      ? [{ key: input.blueprint.elementSecondary, expression: input.expression.secondaryElement ?? 30 }]
      : []),
    { key: "head", expression: input.expression.head ?? 40 },
    { key: "body", expression: input.expression.body ?? 40 },
    ...(input.expression.predator ? [{ key: "predator", expression: input.expression.predator }] : []),
    ...(input.expression.tank ? [{ key: "tank", expression: input.expression.tank }] : []),
  ];
  return {
    id: type,
    resourceType: type,
    displayName: visual.namePt,
    displayNameEn: visual.nameEn,
    shortDescription: copy.pt,
    shortDescriptionEn: copy.en,
    icon: visual.icon,
    maxStacks: pack.max,
    generationRules: pack.generation,
    consumptionRules:
      variant === "MAGMA_CORE"
        ? [
            { trigger: "PLAY_CARD", cardGrade: "G5", amount: 2, upTo: true },
            ...consumeSignatureSupreme(1, "ALL", 3),
          ]
        : consumeSignatureSupreme(1, variant === "UNSTABLE_HEART" ? "ALL" : 2, variant === "UNSTABLE_HEART" ? pack.max : undefined),
    passiveEffects: pack.passive,
    thresholdEffects: pack.thresholds,
    decayRule: pack.decay,
    resetRule: { battleStart: 0, battleEnd: "clear", persistBetweenRounds: true },
    sourceGenes,
    relatedCardIds: ["G9", "G10"],
    generatorVersion: PERSONAL_RESOURCE_VERSION,
    variant,
    risk: pack.risk,
    generateTriggers: pack.generation.map((row) => row.trigger),
    consumeTriggers: ["SIGNATURE", "SUPREME"],
  };
}

export function hydratePersonalResource(raw: unknown): PersonalResourceDefinition | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<PersonalResourceDefinition> & { displayName?: string; maxStacks?: number; id?: string };
  if (Array.isArray(row.generationRules) && row.generationRules.length > 0 && row.displayName && row.id) {
    return row as PersonalResourceDefinition;
  }
  if (!row.id || !row.displayName) return null;
  const visual = visualOf(row.id);
  const triggers = row.generateTriggers ?? [];
  const generation: ResourceGenerationRule[] = triggers.map((trigger) => {
    if (trigger.includes("BURN") || trigger === "APPLY_BURN") return { trigger: "APPLY_STATUS", status: "BURN", amount: 1, oncePerEvent: true, scope: "SELF" };
    if (trigger.includes("SHIELD") || trigger === "GAIN_SHIELD") return { trigger: "GAIN_SHIELD", amount: 1, oncePerEvent: true, scope: "SELF" };
    if (trigger.includes("SHOCK")) return { trigger: "APPLY_STATUS", status: "SHOCK", amount: 1, oncePerEvent: true, scope: "SELF" };
    if (trigger.includes("POISON")) return { trigger: "APPLY_STATUS", status: "POISON", amount: 1, oncePerEvent: true, scope: "SELF" };
    if (trigger.includes("WET")) return { trigger: "APPLY_STATUS", status: "WET", amount: 1, oncePerEvent: true, scope: "SELF" };
    if (trigger.includes("CRITICAL")) return { trigger: "CRITICAL_HIT", amount: 1, oncePerEvent: true, scope: "SELF" };
    if (trigger.includes("HEAL")) return { trigger: "HEAL", amount: 1, oncePerEvent: true, scope: "SELF" };
    return { trigger: "DEAL_DAMAGE", amount: 1, oncePerEvent: true, scope: "SELF" };
  });
  return {
    id: row.id,
    resourceType: row.id,
    displayName: row.displayName,
    displayNameEn: visual.nameEn,
    shortDescription: row.shortDescription ?? `Recurso pessoal ${row.displayName}.`,
    shortDescriptionEn: row.shortDescriptionEn ?? `Personal resource ${visual.nameEn}.`,
    icon: row.icon ?? visual.icon,
    maxStacks: row.maxStacks ?? 3,
    generationRules: generation.length ? generation : [{ trigger: "DEAL_DAMAGE", amount: 1, oncePerEvent: true, scope: "SELF" }],
    consumptionRules: row.consumptionRules ?? consumeSignatureSupreme(),
    passiveEffects: row.passiveEffects ?? [],
    thresholdEffects: row.thresholdEffects ?? [],
    decayRule: row.decayRule ?? "NONE",
    resetRule: row.resetRule ?? { battleStart: 0, battleEnd: "clear", persistBetweenRounds: true },
    sourceGenes: row.sourceGenes ?? [],
    relatedCardIds: row.relatedCardIds ?? ["G9", "G10"],
    generatorVersion: row.generatorVersion ?? PERSONAL_RESOURCE_VERSION,
    variant: row.variant ?? "LEGACY",
    risk: row.risk,
    generateTriggers: triggers,
    consumeTriggers: row.consumeTriggers ?? ["SIGNATURE", "SUPREME"],
  };
}
