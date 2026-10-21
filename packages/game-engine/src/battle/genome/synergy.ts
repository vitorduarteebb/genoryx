import { rankIndex, rankOf } from "./ranks";
import type { GenomeProfile } from "./profile";

export type SynergyNote = {
  key: string;
  label: string;
  level: "Baixa" | "Média" | "Alta" | "Muito alta";
  reason: string;
};

export function analyzeCardSynergy(genes: Record<string, string>, profiles: GenomeProfile[]): SynergyNote[] {
  const physical = profiles.filter((row) => row.domain === "PHYSICAL").length;
  const magic = profiles.filter((row) => row.domain === "MAGIC").length;
  const statusCards = profiles.filter((row) => row.tags.some((tag) => ["BURN", "POISON", "SHOCK", "MARK", "STUN"].includes(tag)) || row.conditions.some((row) => row.startsWith("IF_TARGET_"))).length;
  const fast = profiles.filter((row) => row.speed === "FAST" || row.speed === "VERY_FAST").length;
  const heavy = profiles.filter((row) => row.speed === "HEAVY").length;
  const guard = profiles.filter((row) => row.tags.includes("GUARD") || row.tags.includes("SHIELD") || row.domain === "UTILITY").length;
  const critCards = profiles.filter((row) => row.tags.includes("CRIT") || row.hooks.includes("ON_CRIT")).length;
  const notes: SynergyNote[] = [
    band("status", "Status", statusCards, rankIndex(rankOf(genes, "STATUS")), `STA ${rankOf(genes, "STATUS")} altera ${statusCards} carta(s) de efeito.`),
    band("physical", "Físico", physical, rankIndex(rankOf(genes, "ATK")), `ATK ${rankOf(genes, "ATK")} escala ${physical} carta(s) físicas.`),
    band("magic", "Mágico", magic, rankIndex(rankOf(genes, "MAG")), `MAG ${rankOf(genes, "MAG")} escala ${magic} carta(s) mágicas.`),
    band("tempo", "Tempo", fast + heavy, rankIndex(rankOf(genes, "SPD")), `SPD ${rankOf(genes, "SPD")}: ${fast} rápida(s), ${heavy} pesada(s).`),
    band("guard", "Guarda", guard, rankIndex(rankOf(genes, "DEF")), `DEF ${rankOf(genes, "DEF")} conversa com ${guard} carta(s) de proteção.`),
    band("crit", "Crítico", Math.max(critCards, rankIndex(rankOf(genes, "CRIT")) >= 5 ? 2 : 0), rankIndex(rankOf(genes, "CRIT")), `CRIT ${rankOf(genes, "CRIT")} · CDMG ${rankOf(genes, "CRIT_DAMAGE")}. Chance e multiplicador são genes diferentes.`),
  ];
  return notes;
}

function band(key: string, label: string, cards: number, rankScore: number, reason: string): SynergyNote {
  const score = cards * 2 + rankScore;
  const level = score >= 14 ? "Muito alta" : score >= 9 ? "Alta" : score >= 5 ? "Média" : "Baixa";
  return { key, label, level, reason };
}

export type TimelineMark = {
  id: string;
  name: string;
  cardName: string;
  speed: string;
  initiative: number;
  ghost: boolean;
  side: 0 | 1;
};

export function orderTimeline(marks: TimelineMark[]) {
  return [...marks].sort((a, b) => b.initiative - a.initiative || a.side - b.side);
}
