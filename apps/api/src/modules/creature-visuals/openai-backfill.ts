import type { VisualAssetStatus, VisualImageProvider } from "@nexora/types";

export const OPENAI_PROOF_SPECIES = ["pyron", "nympha", "florune"] as const;

export type ProofCreatureHint = {
  id: string;
  lifeStage: string;
  temperament: string;
  name: string | null;
  geneticHash: string;
  species: { key: string };
  visualAssets?: Array<{
    lifeStage: string;
    status: VisualAssetStatus | string;
    provider?: VisualImageProvider | string | null;
  }>;
};

export function hasReadyProvider(
  assets: ProofCreatureHint["visualAssets"],
  lifeStage: string,
  provider: VisualImageProvider,
): boolean {
  return (assets ?? []).some(
    (asset) => asset.lifeStage === lifeStage && asset.status === "READY" && asset.provider === provider,
  );
}

export function needsOpenAiVisual(row: ProofCreatureHint): boolean {
  return !hasReadyProvider(row.visualAssets, row.lifeStage, "OPENAI");
}

export function proofScore(row: ProofCreatureHint, speciesKey: string): number {
  let score = 0;
  if (row.lifeStage === "BABY") {
    score += 100;
  }
  if (speciesKey === "florune" && row.temperament === "FERAL") {
    score += 50;
  }
  if (row.geneticHash.toLowerCase().startsWith("e85b6a94")) {
    score += 80;
  }
  if ((row.name ?? "").toLowerCase() === "florune") {
    score += 10;
  }
  return score;
}

export function pickProofCreature<T extends ProofCreatureHint>(rows: T[], speciesKey: string): T | undefined {
  const pool = rows.filter((row) => row.species.key === speciesKey && needsOpenAiVisual(row));
  const fallback = rows.filter((row) => row.species.key === speciesKey);
  const candidates = pool.length > 0 ? pool : fallback;
  return candidates.slice().sort((a, b) => proofScore(b, speciesKey) - proofScore(a, speciesKey))[0];
}

export function pickProofCreatures<T extends ProofCreatureHint>(rows: T[]): T[] {
  return OPENAI_PROOF_SPECIES.map((key) => pickProofCreature(rows, key)).filter((row): row is T => Boolean(row));
}
