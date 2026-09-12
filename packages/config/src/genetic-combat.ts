/** Combat Ability Grammar — peças data-driven. Sem if FIRE&&DRACONIC por carta. */

export const GENETIC_ENGINE_VERSION = "gxr-gce-v1" as const;

export const geneticCombatConfig = {
  version: GENETIC_ENGINE_VERSION,
  maxReactionDepth: 3,
  maxNoveltyRetries: 3,
  similarityReroll: 0.92,
  starterMinCoherence: 55,
  starterMinEfficiency: 52,
  damageByTier: {
    FOUNDATION: [10, 16],
    SPECIALIZATION: [12, 20],
    SYNERGY: [8, 16],
    ADVANCED: [14, 22],
    SIGNATURE: [18, 28],
    SUPREME: [22, 32],
  } as const,
  shieldByTier: {
    FOUNDATION: [10, 16],
    SPECIALIZATION: [14, 22],
    SYNERGY: [10, 16],
    ADVANCED: [12, 20],
    SIGNATURE: [16, 24],
    SUPREME: [18, 26],
  } as const,
  healByTier: {
    FOUNDATION: [6, 12],
    SPECIALIZATION: [8, 14],
    SYNERGY: [8, 14],
    ADVANCED: [10, 16],
    SIGNATURE: [12, 18],
    SUPREME: [14, 20],
  } as const,
} as const;

export const universalStatuses = [
  "BURN",
  "WET",
  "SHOCK",
  "FROST",
  "CRACKED",
  "MARKED",
  "POISON",
  "ROOTED",
  "EXPOSED",
  "REGEN",
  "FOCUS",
  "BLEED",
  "BLIND",
  "CONDUCTIVE",
  "MAGMA",
] as const;

export type UniversalStatus = (typeof universalStatuses)[number];

export const personalResourceCatalog = [
  { id: "HEAT", namePt: "Calor", generate: ["APPLY_BURN", "GAIN_SHIELD"], consume: ["SIGNATURE", "SUPREME"] },
  { id: "STONE", namePt: "Rocha", generate: ["GAIN_SHIELD", "ON_HIT"], consume: ["SIGNATURE", "COUNTER"] },
  { id: "SPORE", namePt: "Esporo", generate: ["APPLY_POISON", "HEAL"], consume: ["SUPREME", "SPREAD"] },
  { id: "TIDE", namePt: "Maré", generate: ["APPLY_WET", "HEAL"], consume: ["CONTROL", "SIGNATURE"] },
  { id: "SPARK", namePt: "Faísca", generate: ["CRITICAL_HIT", "APPLY_SHOCK"], consume: ["EXECUTE", "DASH"] },
  { id: "VOID", namePt: "Vazio", generate: ["APPLY_MARK", "ON_KO"], consume: ["SUPREME"] },
  { id: "ECHO", namePt: "Eco", generate: ["GAIN_ENERGY", "APPLY_FOCUS"], consume: ["SIGNATURE"] },
  { id: "FROST", namePt: "Geada", generate: ["APPLY_FROST", "GAIN_SHIELD"], consume: ["SHATTER", "SIGNATURE"] },
] as const;

export const elementResource: Record<string, (typeof personalResourceCatalog)[number]["id"]> = {
  FIRE: "HEAT",
  EARTH: "STONE",
  NATURE: "SPORE",
  WATER: "TIDE",
  ELECTRIC: "SPARK",
  DARK: "VOID",
  ARCANE: "ECHO",
  ICE: "FROST",
  LIGHT: "ECHO",
};

export const elementStatus: Record<string, UniversalStatus> = {
  FIRE: "BURN",
  WATER: "WET",
  NATURE: "POISON",
  EARTH: "CRACKED",
  ELECTRIC: "SHOCK",
  ICE: "FROST",
  DARK: "MARKED",
  ARCANE: "FOCUS",
  LIGHT: "EXPOSED",
};

export const anatomyVocabulary: Record<string, readonly string[]> = {
  horns: ["CHARGE", "PIERCE", "BREAK", "RAM"],
  wings: ["DODGE", "FLIGHT", "REPOSITION", "INITIATIVE"],
  tail: ["SWEEP", "CONTROL", "PULL", "POISON"],
  eyes: ["TARGETING", "CRIT", "ARCANE", "DETECTION"],
  head: ["BITE", "BREATH", "PSYCHIC", "ROAR"],
  body: ["TANK", "SUSTAIN", "ARMOR", "MOMENTUM"],
  limbs: ["SLASH", "GRAPPLE", "CHARGE", "LEAP"],
  aura: ["BUFF", "DEBUFF", "RESOURCE", "WARD"],
  pattern: ["AFFINITY", "RARE", "DISSONANT"],
};

export const reactionRegistry = [
  { key: "CONDUCTIVE", inputs: ["WET", "SHOCK"], output: "CONDUCTIVE", textPt: "Umidade conduz o choque." },
  { key: "MAGMA", inputs: ["BURN", "CRACKED"], output: "MAGMA", textPt: "Brasa + pedra rachada viram magma." },
  { key: "SHATTER", inputs: ["FROST", "CRACKED"], output: "EXPOSED", textPt: "Gelo sobre armadura quebrada estilhaça." },
  { key: "HUNT", inputs: ["MARKED", "EXPOSED"], output: "BLEED", textPt: "Marca + exposição viram caçada." },
  { key: "RETALIATION", inputs: ["FOCUS"], shield: true, output: "MARKED", textPt: "Escudo com foco devolve a marca." },
] as const;

export const quirkCatalog = [
  { key: "OVERCHARGED", namePt: "Sobrecarregado", bias: "power", textPt: "Gera recurso mais rápido, mas a Supreme custa caro." },
  { key: "SLOW_STARTER", namePt: "Começo lento", bias: "setup", textPt: "Foundation fraca; Signature e Supreme compensam." },
  { key: "FRAGILE_WINGS", namePt: "Asas frágeis", bias: "risk", textPt: "Mobilidade forte, mas perde escudo ao reposicionar." },
  { key: "STUBBORN", namePt: "Teimoso", bias: "front", textPt: "Brilha em FRONT; cartas de retaguarda ficam situacionais." },
  { key: "PREDATORY", namePt: "Predatório", bias: "execute", textPt: "Execute e crit; setup de sustain quase inexistente." },
  { key: "UNSTABLE_CORE", namePt: "Núcleo instável", bias: "volatile", textPt: "No máximo de recurso, recebe um pouco de dano." },
  { key: "SYMBIOTIC", namePt: "Simbiótico", bias: "ally", textPt: "Cura e escudo em aliados; dano próprio mediano." },
  { key: "COLD_BLOODED", namePt: "Sangue frio", bias: "patience", textPt: "Cartas exigem condição; recompensa acima da média." },
  { key: "VOLATILE", namePt: "Volátil", bias: "volatile", textPt: "Combo explosivo, coerência baixa." },
  { key: "PATIENT_HUNTER", namePt: "Caçador paciente", bias: "mark", textPt: "Marca agora, executa depois." },
] as const;

export const identityLexicon: Record<string, { names: readonly string[]; styles: readonly string[] }> = {
  HEAT: { names: ["Núcleo Magmático", "Fornalha Predatória", "Coração Instável", "Cinzas Vivas"], styles: ["Tank / Counter", "Burn / Pressure"] },
  STONE: { names: ["Bastião Mineral", "Casca Sísmica", "Guardião de Rocha"], styles: ["Frontline / Sustain"] },
  SPORE: { names: ["Colônia Simbiótica", "Bosque Parasita", "Raiz Venenosa"], styles: ["Spread / Sustain"] },
  TIDE: { names: ["Maré Astral", "Concha Simbiótica", "Corrente Predatória"], styles: ["Control / Setup"] },
  SPARK: { names: ["Caçador da Tempestade", "Limiar Condutivo", "Gume Elétrico"], styles: ["Predator / Tempo"] },
  VOID: { names: ["Fome do Vazio", "Eco Sombrio", "Marca Abissal"], styles: ["Mark / Execute"] },
  ECHO: { names: ["Ressonância de Cristal", "Eco Arcano", "Foco Prismático"], styles: ["Support / Resource"] },
  FROST: { names: ["Bastião Congelado", "Estilhaço Glacial", "Muralha de Geada"], styles: ["Control / Armor"] },
  RAGE: { names: ["Sangue em Fúria", "Núcleo Irado"], styles: ["Brawler / Counter"] },
  MOMENTUM: { names: ["Corrente de Impulso", "Dança da Maré"], styles: ["Skirmisher / Tempo"] },
  CHARGE: { names: ["Linha de Investida", "Chifre de Guerra"], styles: ["Frontline / Break"] },
  FOCUS: { names: ["Olho Prismático", "Calma de Caça"], styles: ["Precision / Setup"] },
  GUARD: { names: ["Guarda Ancestral", "Muralha Viva"], styles: ["Tank / Ward"] },
  ESSENCE: { names: ["Essência Latente", "Núcleo Etéreo"], styles: ["Support / Arcane"] },
  FEROCITY: { names: ["Instinto Predatório", "Fome Selvagem"], styles: ["Predator / Execute"] },
};

export const expressionTraits = [
  "primaryElement",
  "secondaryElement",
  "head",
  "body",
  "eyes",
  "horns",
  "limbs",
  "tail",
  "back",
  "aura",
  "pattern",
  "predator",
  "tank",
] as const;

export type ExpressionTrait = (typeof expressionTraits)[number];
