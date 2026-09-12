import { visualGenerationConfig } from "@nexora/config";

export function generationConcurrency(): number {
  const raw = process.env.CREATURE_VISUAL_GENERATION_CONCURRENCY;
  const parsed = raw ? Number(raw) : visualGenerationConfig.generationConcurrency;
  if (!Number.isFinite(parsed)) {
    return visualGenerationConfig.generationConcurrency;
  }
  return Math.max(1, Math.min(8, Math.floor(parsed)));
}

export function staggerMs(): number {
  const raw = process.env.CREATURE_VISUAL_GENERATION_STAGGER_MS;
  const parsed = raw ? Number(raw) : 350;
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 350;
  }
  return Math.min(2_000, parsed);
}
