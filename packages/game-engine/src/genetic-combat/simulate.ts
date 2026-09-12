import { generateCreatureBlueprint } from "../genes/generate";
import { assembleGeneticCombat } from "./assemble";
import { fingerprintTokens, similarityScore } from "./fingerprint";
import type { GeneticCombatManifest } from "./types";

export type CombatSimStats = {
  count: number;
  averageSimilarity: number;
  similarityOver90: number;
  averageCost: number;
  identityCounts: Record<string, number>;
  lowCoherence: number;
  highCoherence: number;
  quirkRate: number;
  anomalyRate: number;
  mutationRate: number;
  unusedVerbs: string[];
};

const SPECIES = ["pyron", "terranox", "florune", "sparkyn", "nympha", "voltaris"] as const;

export function simulateCombatPopulation(count: number): { stats: CombatSimStats; manifests: GeneticCombatManifest[] } {
  const manifests: GeneticCombatManifest[] = [];
  const tokens: string[][] = [];
  for (let i = 0; i < count; i += 1) {
    const species = SPECIES[i % SPECIES.length]!;
    const origin = i % 11 === 0 ? "STARTER" : i % 5 === 0 ? "BRED" : "WILD";
    const blueprint = generateCreatureBlueprint({ seed: 10_000 + i * 17, speciesKey: species, origin: origin === "BRED" ? "WILD" : origin });
    const manifest = blueprint.combatManifest ?? assembleGeneticCombat({ creatureId: `sim:${i}`, blueprint });
    manifests.push(manifest);
    tokens.push(fingerprintTokens(manifest.identity, manifest.cards));
  }
  let simSum = 0;
  let simHigh = 0;
  let pairs = 0;
  const sample = Math.min(tokens.length, 400);
  for (let i = 0; i < sample; i += 1) {
    for (let j = i + 1; j < sample; j += 1) {
      const score = similarityScore(tokens[i]!, tokens[j]!);
      simSum += score;
      pairs += 1;
      if (score > 0.9) simHigh += 1;
    }
  }
  const identityCounts: Record<string, number> = {};
  const verbs = new Set<string>();
  let costSum = 0;
  let cards = 0;
  let low = 0;
  let high = 0;
  let quirks = 0;
  let anomalies = 0;
  let mutations = 0;
  for (const row of manifests) {
    identityCounts[row.identity.archetype] = (identityCounts[row.identity.archetype] ?? 0) + 1;
    for (const verb of row.identity.verbs) verbs.add(verb);
    for (const card of row.cards) {
      costSum += card.cost;
      cards += 1;
    }
    if (row.rolls.coherence < 40) low += 1;
    if (row.rolls.coherence >= 80) high += 1;
    if (row.identity.quirks.length) quirks += 1;
    if (row.identity.anomaly) anomalies += 1;
    if (row.rolls.mutation >= 85) mutations += 1;
  }
  return {
    manifests,
    stats: {
      count,
      averageSimilarity: pairs ? simSum / pairs : 0,
      similarityOver90: pairs ? simHigh / pairs : 0,
      averageCost: cards ? costSum / cards : 0,
      identityCounts,
      lowCoherence: low / count,
      highCoherence: high / count,
      quirkRate: quirks / count,
      anomalyRate: anomalies / count,
      mutationRate: mutations / count,
      unusedVerbs: [],
    },
  };
}
