import type { GeneRank } from "@nexora/types";
import { rankIndex, rankOf } from "./ranks";

const ELEMENT_PT: Record<string, string> = {
  FIRE: "Ígnea",
  WATER: "Aquática",
  NATURE: "Natural",
  EARTH: "Terrestre",
  ELECTRIC: "Elétrica",
  ICE: "Gélida",
  LIGHT: "Luminosa",
  DARK: "Sombria",
  ARCANE: "Arcana",
};

const ARCHETYPES = [
  { id: "bruiser", name: "Bruiser", score: (g: GeneMap) => ix(g, "ATK") * 1.4 + ix(g, "HP") * 0.8 + ix(g, "STATUS") * 0.6 },
  { id: "mage", name: "Mago", score: (g: GeneMap) => ix(g, "MAG") * 1.5 + ix(g, "STATUS") * 0.7 + ix(g, "RES") * 0.3 },
  { id: "hunter", name: "Caçador", score: (g: GeneMap) => ix(g, "PRECISION") * 1.2 + ix(g, "SPD") * 1 + ix(g, "ATK") * 0.5 },
  { id: "tank", name: "Tanque", score: (g: GeneMap) => ix(g, "HP") * 1.2 + ix(g, "DEF") * 1 + ix(g, "RES") * 0.8 },
  { id: "critical", name: "Crítico", score: (g: GeneMap) => ix(g, "CRIT") * 1.3 + ix(g, "CRIT_DAMAGE") * 1.2 + ix(g, "PRECISION") * 0.4 },
  { id: "evasive", name: "Evasivo", score: (g: GeneMap) => ix(g, "EVASION") * 1.3 + ix(g, "SPD") * 0.8 },
  { id: "controller", name: "Controlador", score: (g: GeneMap) => ix(g, "STATUS") * 1.2 + ix(g, "MAG") * 0.5 + ix(g, "SPD") * 0.3 },
] as const;

type GeneMap = Record<string, string>;

function ix(genes: GeneMap, key: string) {
  return rankIndex(rankOf(genes, key));
}

const TYPOLOGY_GENE: Record<string, string> = {
  CRITICAL: "CRIT",
  SPEED: "SPD",
  TANK: "DEF",
  BURN: "STATUS",
  POISON: "STATUS",
  BLEED: "STATUS",
  CONTROL: "STATUS",
  SHIELD: "DEF",
  HEAL: "MAG",
  SUSTAIN: "MAG",
};

export type DetectedBuild = {
  identityTypology: string | null;
  archetypeId: string;
  archetype: string;
  secondary: string;
  line: string;
  strengths: string[];
  limitation: string | null;
};

export function detectCombatArchetype(genes: GeneMap, typology?: string | null, element?: string | null): DetectedBuild {
  const ranked = ARCHETYPES.map((row) => ({ ...row, value: row.score(genes) })).sort((a, b) => b.value - a.value);
  const prefer = typology === "CRITICAL" ? "critical" : typology === "TANK" ? "tank" : typology === "SPEED" ? "hunter" : null;
  const top = ranked[0]!;
  const tied = ranked.filter((row) => row.value === top.value);
  const chosen = (prefer && tied.find((row) => row.id === prefer)) || top;
  const secondary = ranked.find((row) => row.id !== chosen.id) ?? chosen;
  const strengths = topGenes(genes);
  const expected = typology ? TYPOLOGY_GENE[typology] : undefined;
  const expectedRank = expected ? rankOf(genes, expected) : null;
  const limitation = expected && expectedRank && rankIndex(expectedRank) <= rankIndex("D")
    ? `Fraqueza genética para ${labelGene(expected)}: ${expected} ${expectedRank}.`
    : null;
  const adjective = element ? ELEMENT_PT[element] ?? "" : "";
  const archetype = adjective ? `${chosen.name} ${adjective}` : chosen.name;
  return {
    identityTypology: typology ?? null,
    archetypeId: chosen.id,
    archetype,
    secondary: secondary.name,
    line: strengths.map((row) => `${row.key} ${row.rank}`).join(" · "),
    strengths: strengths.map((row) => `${row.key} ${row.rank}`),
    limitation,
  };
}

function topGenes(genes: GeneMap) {
  const keys = ["HP", "ATK", "DEF", "MAG", "RES", "SPD", "CRIT", "CRIT_DAMAGE", "PRECISION", "EVASION", "STATUS"];
  return keys
    .map((key) => ({ key: shortKey(key), rank: rankOf(genes, key) as GeneRank, score: rankIndex(rankOf(genes, key)) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function shortKey(key: string) {
  if (key === "CRIT_DAMAGE") return "CDMG";
  if (key === "PRECISION") return "PREC";
  if (key === "EVASION") return "EVA";
  if (key === "STATUS") return "STA";
  return key;
}

function labelGene(key: string) {
  if (key === "CRIT") return "Crítico";
  if (key === "SPD") return "Velocidade";
  if (key === "DEF") return "Defesa";
  if (key === "STATUS") return "Efeitos";
  if (key === "MAG") return "Magia";
  return key;
}
