import { cardElementLabel } from "@nexora/config";
import type { Element } from "@nexora/types";

export const STAT_KEYS = ["HP", "ATK", "DEF", "MAG", "RES", "SPD", "CRIT", "EVA", "STATUS"] as const;
export type StatKey = (typeof STAT_KEYS)[number];
export const RANK_ORDER = ["F", "E", "D", "C", "B", "A", "S", "SS"] as const;

export const STAT_META: Record<StatKey, { name: string; hint: string }> = {
  HP: { name: "Vitalidade", hint: "Quanto dano a criatura aguenta antes de cair." },
  ATK: { name: "Ataque", hint: "Força dos golpes físicos." },
  DEF: { name: "Defesa", hint: "Resistência contra dano físico." },
  MAG: { name: "Magia", hint: "Poder das habilidades elementais e mágicas." },
  RES: { name: "Resistência", hint: "Proteção contra dano especial e efeitos." },
  SPD: { name: "Velocidade", hint: "Quão rápido a criatura age e se posiciona." },
  CRIT: { name: "Crítico", hint: "Chance de acertos devastadores." },
  EVA: { name: "Evasão", hint: "Chance de evitar golpes inimigos." },
  STATUS: { name: "Efeitos", hint: "Força para aplicar queimadura, veneno, choque e similares." },
};

export const STAT_GROUPS = [
  { id: "offense", title: "Ofensivo", keys: ["ATK", "MAG", "CRIT"] as const },
  { id: "defense", title: "Defensivo", keys: ["HP", "DEF", "RES"] as const },
  { id: "utility", title: "Mobilidade e efeitos", keys: ["SPD", "EVA", "STATUS"] as const },
];

const BODY_PLAN_PT: Record<string, string> = {
  QUADRUPED: "Quadrúpede",
  BIPED: "Bípede",
  SERPENT_WYRM: "Serpente / wyrm",
  FLOATING: "Flutuante",
  HUMANOID_BEAST: "Fera humanóide",
  AVIAN: "Alada",
  ARACHNID: "Aracnídea",
  GOLEM: "Golem",
  AMPHIBIAN: "Anfíbia",
  ABYSSAL: "Abissal",
  CENTAUROID: "Centauroide",
  INSECTOID_BIPED: "Insetoide bípede",
};

const HEAD_PT: Record<string, string> = {
  DRACONIC: "Dracônica",
  BEAST: "Fera",
  SERPENT: "Serpente",
  EXOTIC: "Exótica",
};

const STAGE_PT: Record<string, string> = {
  EGG: "Ovo",
  BABY: "Filhote",
  YOUNG: "Jovem",
  ADULT: "Adulta",
};

const TEMPER_PT: Record<string, string> = {
  FRIENDLY: "Amigável",
  NOBLE: "Nobre",
  WILD: "Selvagem",
  FERAL: "Feroz",
  MENACING: "Ameaçadora",
  ABYSSAL: "Abissal",
};

const ORIGIN_PT: Record<string, string> = {
  STARTER: "Inicial",
  WILD: "Capturada",
  BRED: "Nascida",
  MARKET: "Mercado",
  EVENT: "Evento",
  ADMIN: "Admin",
};

const TYPOLOGY_PT: Record<string, { role: string; style: string; hint: string }> = {
  BURN: { role: "Queimadura", style: "ofensivo persistente", hint: "Aplica dano contínuo de fogo ou calor." },
  TANK: { role: "Defensora", style: "resistente", hint: "Aguenta o combate na frente e protege o time." },
  HEAL: { role: "Suporte", style: "cura e sustentação", hint: "Recupera aliados e prolonga a batalha." },
  CONTROL: { role: "Controle", style: "precisa e tática", hint: "Lentidão, travas e domínio do ritmo." },
  CRITICAL: { role: "Crítico", style: "precisão letal", hint: "Busca acertos devastadores em janelas curtas." },
};

export const HELP = {
  generation: "Geração 0 é a primeira da linhagem (inicial ou capturada). Filhotes de cruzamento sobem a geração.",
  fertility: "Quantas vezes esta criatura ainda pode cruzar. O máximo é 5.",
  purity: "Quanto o DNA permanece fiel à linhagem. 100% significa sem mistura aparente.",
  mutation: "Traço raro extra. Nenhuma mutação é o caso mais comum — e não é um defeito.",
  geneticPower: "Identidade especial desta criatura. Define o tema das 10 cartas genéticas.",
  manifestations: "As 10 cartas G1–G10 desta criatura. Elas entram no combate pela aba Cartas.",
  bodyPlan: "Formato do corpo. Não muda o dano direto; muda a silhueta e o enquadramento.",
  temperament: "Personalidade visual e de postura. Não vende poder de combate.",
  genesisGrade: "Grau do ovo de origem. É coleção e apresentação — não aumenta dano.",
  status: "Capacidade de aplicar efeitos como queimadura, veneno ou choque.",
  nft: "Registro de propriedade. No Alpha a blockchain ainda não está ligada a esta ficha.",
} as const;

export function elementLabel(element?: string | null) {
  if (!element) return "—";
  try {
    return cardElementLabel(element as Element);
  } catch {
    return element;
  }
}

export function bodyPlanLabel(value?: string | null) {
  if (!value) return "—";
  return BODY_PLAN_PT[value] ?? prettyToken(value);
}

export function headLabel(value?: string | null) {
  if (!value) return "—";
  return HEAD_PT[value] ?? prettyToken(value);
}

export function stageLabel(value?: string | null) {
  if (!value) return "Filhote";
  return STAGE_PT[value] ?? prettyToken(value);
}

export function temperamentLabel(value?: string | null) {
  if (!value) return "—";
  return TEMPER_PT[value] ?? prettyToken(value);
}

export function originLabel(value?: string | null) {
  if (!value) return "—";
  return ORIGIN_PT[value] ?? prettyToken(value);
}

export function typologyProfile(value?: string | null) {
  if (!value) return { role: "Versátil", style: "equilibrada", hint: "Perfil ainda sem especialidade marcada." };
  return TYPOLOGY_PT[value] ?? { role: prettyToken(value), style: "especializada", hint: "Identidade genética desta linhagem." };
}

export function mutationLabel(value?: string | null) {
  if (!value || value === "NONE") return "Nenhuma";
  return prettyToken(value);
}

export function prettyToken(value: string) {
  return value
    .replace(/^[A-Z]+_\d+_/, "")
    .split(/[_\s]+/)
    .filter((part) => part.length > 0 && !/^\d+$/.test(part))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function rankIndex(rank?: string | null) {
  const i = RANK_ORDER.indexOf((rank ?? "C") as (typeof RANK_ORDER)[number]);
  return i < 0 ? 2 : i;
}

export function combatReadout(genes: Record<string, string>, typology?: string | null) {
  const ranked = STAT_KEYS.map((key) => ({ key, rank: genes[key] ?? "C", score: rankIndex(genes[key]) })).sort(
    (a, b) => b.score - a.score,
  );
  const strengths = ranked.filter((row) => row.score >= 4).slice(0, 2);
  const weaknesses = ranked.filter((row) => row.score <= 3).slice(-2).reverse();
  const profile = typologyProfile(typology);
  return {
    profile,
    strengths: strengths.length ? strengths : ranked.slice(0, 2),
    weaknesses: weaknesses.length ? weaknesses : ranked.slice(-2).reverse(),
  };
}

export function creatureBlurb(input: {
  name: string;
  speciesName: string;
  element?: string | null;
  lifeStage?: string | null;
  level: number;
  typology?: string | null;
  genes: Record<string, string>;
}) {
  const readout = combatReadout(input.genes, input.typology);
  const stage = stageLabel(input.lifeStage).toLowerCase();
  const element = elementLabel(input.element).toLowerCase();
  const strong = readout.strengths.map((row) => STAT_META[row.key].name.toLowerCase()).join(" e ");
  return `${input.name} é um exemplar de ${input.speciesName}, criatura de ${element} com função de ${readout.profile.role.toLowerCase()} (${readout.profile.style}). No estágio ${stage}, nível ${input.level}, já se destaca em ${strong}.`;
}
