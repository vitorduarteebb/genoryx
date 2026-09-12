import { fusionFamilies, geneticPowerConfig, type FusionFamilyDef } from "@nexora/config";
import type { Typology } from "@nexora/types";

export type FusionCandidate = {
  familyKey: string;
  name: string;
  namePt: string;
  typologies: Typology[];
  triple: boolean;
  ready: boolean;
  reason: string;
  textPt: string;
};

export function fusionIdentity(typologies: readonly Typology[]): string {
  return [...new Set(typologies)].sort().join("+");
}

export function familyFor(typologies: readonly Typology[]): FusionFamilyDef | null {
  const id = fusionIdentity(typologies);
  return (
    fusionFamilies.find((row) => fusionIdentity(row.typologies) === id && Boolean(row.triple) === (new Set(typologies).size > 2)) ??
    null
  );
}

export function evaluateFusionAvailability(input: {
  typologies: readonly Typology[];
  round: number;
  resonance: number;
  momentum: number;
}): FusionCandidate[] {
  const unique = [...new Set(input.typologies)];
  const doubles: FusionCandidate[] = [];
  for (let i = 0; i < unique.length; i += 1) {
    for (let j = i + 1; j < unique.length; j += 1) {
      const family = familyFor([unique[i]!, unique[j]!]);
      if (!family || family.triple) {
        continue;
      }
      doubles.push(toCandidate(family, input));
    }
  }
  doubles.sort((a, b) => a.familyKey.localeCompare(b.familyKey));
  const limited = doubles.slice(0, geneticPowerConfig.maxDoubleFusionCandidates);
  const triple = unique.length >= 3 ? familyFor(unique.slice(0, 3)) : null;
  if (triple?.triple) {
    limited.push(toCandidate(triple, input));
  }
  return limited;
}

function toCandidate(
  family: FusionFamilyDef,
  input: { round: number; resonance: number; momentum: number },
): FusionCandidate {
  const minRound = family.triple ? geneticPowerConfig.tripleFusionMinRound : geneticPowerConfig.fusionUnlockRound;
  const needRound = input.round >= Math.max(minRound, family.condition.minRound);
  const needRes = input.resonance >= family.condition.minResonance;
  const needMom = (family.condition.minMomentum ?? 0) <= input.momentum;
  const ready = needRound && needRes && needMom;
  return {
    familyKey: family.key,
    name: family.name,
    namePt: family.namePt,
    typologies: [...family.typologies],
    triple: Boolean(family.triple),
    ready,
    reason: !needRound ? `round ${family.condition.minRound}` : !needRes ? "resonance" : !needMom ? "momentum" : "ready",
    textPt: family.textPt,
  };
}
