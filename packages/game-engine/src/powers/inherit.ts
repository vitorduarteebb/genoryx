import type { GeneticPowerGenome } from "@nexora/config";
import type { Element, Typology } from "@nexora/types";
import { createSeededRandom, type RandomService } from "../random/random-service";
import { generateNewPower, type PowerAssignment } from "./generate-power";
import { deterministicUuid, powerHash } from "./hash";

/** roll ∈ {0,1,2} via nextInt — 1/3 exato, sem float 0.33. */
export function rollPowerInheritance(rng: RandomService): 0 | 1 | 2 {
  return rng.nextInt(0, 2) as 0 | 1 | 2;
}

export function seedForInheritanceRoll(wanted: 0 | 1 | 2, max = 4000): number {
  for (let seed = 1; seed <= max; seed += 1) {
    if (createSeededRandom(seed).nextInt(0, 2) === wanted) {
      return seed;
    }
  }
  throw new Error(`seed para roll ${wanted} não encontrado`);
}

export function inheritGeneticPower(input: {
  rng: RandomService;
  childId: string;
  childElement: Element;
  childTypology?: Typology;
  parentA: { genome: GeneticPowerGenome; lineageId: string; creatureId: string };
  parentB: { genome: GeneticPowerGenome; lineageId: string; creatureId: string };
}): PowerAssignment {
  const roll = rollPowerInheritance(input.rng);
  if (roll === 0) {
    return keep(input.parentA.genome, input.parentA.lineageId, "INHERITED_FATHER", input.parentA.creatureId);
  }
  if (roll === 1) {
    return keep(input.parentB.genome, input.parentB.lineageId, "INHERITED_MOTHER", input.parentB.creatureId);
  }
  return generateNewPower({
    rng: input.rng,
    childId: input.childId,
    childElement: input.childElement,
    childTypology: input.childTypology,
    parentA: input.parentA.genome,
    parentB: input.parentB.genome,
  });
}

function keep(
  genome: GeneticPowerGenome,
  lineageId: string,
  originType: PowerAssignment["originType"],
  originCreatureId: string,
): PowerAssignment {
  return {
    powerId: deterministicUuid(`power:${powerHash(genome)}`),
    lineageId,
    originType,
    originCreatureId,
    genome,
  };
}
