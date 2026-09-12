import { createHash } from "crypto";
import type { GeneticPowerGenome } from "@nexora/config";

export function powerSignature(genome: Pick<GeneticPowerGenome, "primaryMechanic" | "secondaryMechanic" | "triggerPattern" | "targetPattern" | "resourceInteraction" | "typology">) {
  return [
    genome.primaryMechanic,
    genome.secondaryMechanic,
    genome.triggerPattern,
    genome.targetPattern,
    genome.resourceInteraction,
    genome.typology,
  ].join("|");
}

export function powerHash(genome: Parameters<typeof powerSignature>[0]): string {
  return createHash("sha256").update(powerSignature(genome)).digest("hex").slice(0, 16);
}

export function powerSimilarity(a: Parameters<typeof powerSignature>[0], b: Parameters<typeof powerSignature>[0]): number {
  const left = powerSignature(a).split("|");
  const right = powerSignature(b).split("|");
  const hits = left.filter((part, index) => part === right[index]).length;
  return hits / left.length;
}

export function deterministicUuid(label: string): string {
  const hex = createHash("sha256").update(label).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}
