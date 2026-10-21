import { GENE_RANKS, type GeneRank } from "@nexora/types";
import { genomeV2 } from "@nexora/config";

const RANK_INDEX = new Map(GENE_RANKS.map((rank, index) => [rank, index]));

export function rankOf(genes: Record<string, string> | undefined, key: string): GeneRank {
  const raw = genes?.[key] ?? alias(genes, key) ?? "C";
  return RANK_INDEX.has(raw as GeneRank) ? (raw as GeneRank) : "C";
}

function alias(genes: Record<string, string> | undefined, key: string) {
  if (!genes) return undefined;
  if (key === "EVASION") return genes.EVA ?? genes.EVASION;
  if (key === "EVA") return genes.EVASION ?? genes.EVA;
  if (key === "STATUS" || key === "STA") return genes.STATUS ?? genes.STA;
  if (key === "CRIT_DAMAGE" || key === "CDMG") return genes.CRIT_DAMAGE ?? genes.CDMG;
  if (key === "PRECISION" || key === "PREC") return genes.PRECISION ?? genes.PREC;
  return genes[key];
}

export function rankIndex(rank: GeneRank) {
  return RANK_INDEX.get(rank) ?? 3;
}

export function precisionPoints(rank: GeneRank) {
  return rankIndex(rank) * genomeV2.hit.pointsPerRank;
}
