import { combatMatrixConfig, fusionFamilies, type FusionFamilyDef } from "@nexora/config";
import type { Typology } from "@nexora/types";
import { familyFor, fusionIdentity, type FusionCandidate } from "../../powers/fusion";
import { contributedTypologies, playsOfTypology, type BattleUsageEntry } from "./usage";

export type FusionKind = "FUSION" | "CONVERGENCE";

export type MatrixFusionCandidate = FusionCandidate & {
  kind: FusionKind;
  presentation: "FUSION" | "CONVERGENCE";
};

export function livingTypologies(creatures: readonly { hp: number; typology?: string }[]): Typology[] {
  return [
    ...new Set(
      creatures
        .filter((row) => row.hp > 0 && row.typology)
        .map((row) => row.typology as Typology),
    ),
  ];
}

export function evaluateMatrixFusion(input: {
  livingTypologies: readonly Typology[];
  usage: readonly BattleUsageEntry[];
  side: 0 | 1;
  round: number;
  resonance: number;
  momentum: number;
  alreadyAwakened: readonly string[];
}): MatrixFusionCandidate[] {
  const unique = [...new Set(input.livingTypologies)];
  const used = contributedTypologies(input.usage, input.side);
  const doubles: MatrixFusionCandidate[] = [];
  for (let i = 0; i < unique.length; i += 1) {
    for (let j = i + 1; j < unique.length; j += 1) {
      const pair = [unique[i]!, unique[j]!];
      const family = familyFor(pair);
      if (!family || family.triple) {
        continue;
      }
      doubles.push(toMatrixCandidate(family, input, used, pair));
    }
  }
  doubles.sort((a, b) => a.familyKey.localeCompare(b.familyKey));
  const limited = doubles.slice(0, combatMatrixConfig.maxDoubleFusionCandidates);
  if (unique.length >= 3) {
    for (let i = 0; i < unique.length; i += 1) {
      for (let j = i + 1; j < unique.length; j += 1) {
        for (let k = j + 1; k < unique.length; k += 1) {
          const trio = [unique[i]!, unique[j]!, unique[k]!];
          const family = familyFor(trio);
          if (family?.triple) {
            limited.push(toMatrixCandidate(family, input, used, trio));
          }
        }
      }
    }
  }
  for (const key of input.alreadyAwakened) {
    const family = fusionFamilies.find((row) => row.key === key);
    if (family && !limited.some((row) => row.familyKey === key)) {
      limited.push({
        ...toMatrixCandidate(family, input, used, [...family.typologies]),
        ready: true,
        reason: "already-awakened",
      });
    }
  }
  return limited;
}

function toMatrixCandidate(
  family: FusionFamilyDef,
  input: { round: number; resonance: number; momentum: number; side: 0 | 1; usage: readonly BattleUsageEntry[] },
  used: readonly Typology[],
  required: readonly Typology[],
): MatrixFusionCandidate {
  const kind: FusionKind = family.triple ? "CONVERGENCE" : "FUSION";
  const minRound = family.triple ? combatMatrixConfig.convergenceMinRound : combatMatrixConfig.fusionUnlockRound;
  const needRound = input.round >= Math.max(minRound, family.condition.minRound);
  const needRes = input.resonance >= family.condition.minResonance;
  const needMom = (family.condition.minMomentum ?? 0) <= input.momentum;
  const needUsage = required.every((typology) => used.includes(typology) && playsOfTypology(input.usage, input.side, typology) > 0);
  const ready = needRound && needRes && needMom && needUsage;
  return {
    familyKey: family.key,
    name: family.name,
    namePt: family.namePt,
    typologies: [...family.typologies],
    triple: Boolean(family.triple),
    kind,
    presentation: kind,
    ready,
    reason: !needRound
      ? `round ${family.condition.minRound}`
      : !needUsage
        ? "usage"
        : !needRes
          ? "resonance"
          : !needMom
            ? "momentum"
            : "ready",
    textPt: family.textPt,
  };
}

export function fusionFamilyKey(typologies: readonly Typology[]): string {
  return familyFor(typologies)?.key ?? fusionIdentity(typologies);
}
