import { expressionTraits, type ExpressionTrait } from "@nexora/config";
import { GENE_RANKS, type GeneRank } from "@nexora/types";
import type { CreatureBlueprint } from "../genes/generate";
import { createSeededRandom } from "../random/random-service";
import { subSeed } from "./seeds";
import type { GeneticExpression } from "./types";

function rank01(rank: GeneRank | undefined): number {
  return Math.round((Math.max(0, GENE_RANKS.indexOf(rank ?? "C")) / Math.max(1, GENE_RANKS.length - 1)) * 100);
}

function slotPresent(value: string | undefined | null): boolean {
  return Boolean(value && value !== "HORNS_NONE" && value !== "NONE");
}

export function expressGenome(blueprint: CreatureBlueprint, birthSeed: number): GeneticExpression {
  const rng = createSeededRandom(subSeed(birthSeed, "phenotype"));
  const chassis = blueprint.chassis;
  const present: Record<ExpressionTrait, boolean> = {
    primaryElement: true,
    secondaryElement: Boolean(blueprint.elementSecondary),
    head: true,
    body: true,
    eyes: slotPresent(chassis?.eyes.d),
    horns: slotPresent(chassis?.horns.d),
    limbs: slotPresent(chassis?.limbs.d),
    tail: slotPresent(chassis?.tail.d),
    back: slotPresent(chassis?.back.d),
    aura: slotPresent(chassis?.aura.d),
    pattern: slotPresent(chassis?.pattern.d),
    predator: blueprint.headExpressed === "DRACONIC" || (blueprint.genes.CRIT !== "D" && blueprint.genes.ATK !== "F"),
    tank: String(chassis?.limbs.d ?? "").includes("ARMORED") || String(chassis?.back.d ?? "").includes("PLATE") || blueprint.genes.DEF !== "F",
  };
  const out: GeneticExpression = {};
  for (const trait of expressionTraits) {
    const base = 28 + Math.round(rng.next() * 54);
    const geneBias =
      trait === "predator"
        ? rank01(blueprint.genes.CRIT)
        : trait === "tank"
          ? rank01(blueprint.genes.DEF)
          : trait === "primaryElement"
            ? rank01(blueprint.genes.MAG)
            : 50;
    const shown = present[trait] ? base : Math.round(base * 0.35);
    out[trait] = Math.max(8, Math.min(99, Math.round(shown * 0.65 + geneBias * 0.35)));
  }
  return out;
}
