import { cardElementLabel, seedPowerForSpecies } from "@nexora/config";
import type { CrossPotential } from "@nexora/game-engine";
import type { Element } from "@nexora/types";
import type { CreatureRecord } from "../../common/creature-io";
import { presentCollectionVisual } from "../../common/creature-visual-present";

export type GeneticIdentity = {
  name: string;
  typology: string;
  element: string;
  lineageId: string | null;
  lineageLabel: string | null;
};

export function presentGeneticIdentity(row: CreatureRecord): GeneticIdentity | null {
  const stored = (row as CreatureRecord & {
    geneticPower?: { lineageId: string; power: { namePt: string; typology: string; element: string } } | null;
  }).geneticPower;
  if (stored?.power) {
    return {
      name: stored.power.namePt,
      typology: stored.power.typology,
      element: stored.power.element,
      lineageId: stored.lineageId,
      lineageLabel: lineageLabel(stored.lineageId),
    };
  }
  const seed = seedPowerForSpecies(row.species.key);
  if (!seed) {
    return null;
  }
  return {
    name: seed.namePt,
    typology: seed.typology,
    element: seed.element,
    lineageId: null,
    lineageLabel: null,
  };
}

export function lineageLabel(id: string): string {
  return `Lineage #${id.replace(/-/g, "").slice(-4).toUpperCase()}`;
}

export function presentParentSummary(row: CreatureRecord) {
  const visual = presentCollectionVisual(row);
  const identity = presentGeneticIdentity(row);
  return {
    id: row.id,
    name: row.name ?? row.species.name,
    speciesKey: row.species.key,
    speciesName: row.species.name,
    gender: row.gender,
    generation: row.generation,
    lifeStage: row.lifeStage,
    fertility: row.fertility,
    element: row.elementPrimary,
    elementLabel: cardElementLabel(row.elementPrimary as Element),
    typology: identity?.typology ?? null,
    geneticPower: identity,
    mutation: row.mutation?.key ?? null,
    bodyPlan: row.bodyPlanExpressed,
    head: row.headExpressed,
    temperament: row.temperament,
    portraitUrl: visual.url,
    visual,
    closeParentIds: [row.fatherId, row.motherId].filter(Boolean),
  };
}

export function presentCrossPotential(row: CrossPotential) {
  return {
    score: row.score,
    categories: row.categories,
    possibleElements: row.possibleElements,
    possibleTypologies: row.possibleTypologies,
    powerInheritance: {
      parentA: row.powerInheritance.parentA,
      parentB: row.powerInheritance.parentB,
      novel: row.powerInheritance.novel,
    },
    closeLineage: row.closeLineage,
  };
}
