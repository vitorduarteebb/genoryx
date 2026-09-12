import { seedPowerForSpecies } from "@nexora/config";
import { createSeededRandom } from "../random/random-service";
import { generatePowerCards } from "./cards";
import { evaluateFusionAvailability } from "./fusion";
import { backfillGeneticPower } from "./generate-power";
import { inheritGeneticPower, seedForInheritanceRoll } from "./inherit";
import { deterministicUuid } from "./hash";

export function creaturePowerProof(speciesKey: "pyron" | "florune" | "terranox") {
  const seed = seedPowerForSpecies(speciesKey);
  if (!seed) {
    throw new Error(`seed power ausente: ${speciesKey}`);
  }
  const assigned = backfillGeneticPower({
    creatureId: `proof-${speciesKey}`,
    speciesKey,
    element: seed.element,
    geneticHash: speciesKey,
  });
  return {
    speciesKey,
    power: assigned.genome,
    powerId: assigned.powerId,
    lineageId: assigned.lineageId,
    originType: assigned.originType,
    cards: generatePowerCards({ power: assigned.genome, speciesKey, seed: 1 }),
  };
}

export function battleFusionProof() {
  const pyron = creaturePowerProof("pyron");
  const florune = creaturePowerProof("florune");
  const terranox = creaturePowerProof("terranox");
  const party = [pyron, florune, terranox];
  const typologies = party.map((row) => row.power.typology);
  const before = evaluateFusionAvailability({ typologies, round: 4, resonance: 8, momentum: 2 });
  const round5 = evaluateFusionAvailability({ typologies, round: 5, resonance: 8, momentum: 2 });
  const phoenix = evaluateFusionAvailability({
    typologies: ["BURN", "HEAL", "CONTROL"],
    round: 7,
    resonance: 12,
    momentum: 3,
  }).find((row) => row.familyKey === "PHOENIX_CYCLE");
  return {
    party: party.map((row) => ({ speciesKey: row.speciesKey, power: row.power.namePt, typology: row.power.typology })),
    round1to4: before.filter((row) => row.ready),
    round5: round5.filter((row) => !row.triple),
    livingFurnace: round5.find((row) => row.familyKey === "LIVING_FURNACE") ?? null,
    vitalAshes: round5.find((row) => row.familyKey === "VITAL_ASHES") ?? null,
    phoenix: phoenix ?? null,
  };
}

export function breedingPowerProof() {
  const father = creaturePowerProof("pyron");
  const mother = creaturePowerProof("florune");
  const parentA = {
    genome: father.power,
    lineageId: father.lineageId,
    creatureId: "father",
  };
  const parentB = {
    genome: mother.power,
    lineageId: mother.lineageId,
    creatureId: "mother",
  };
  const childId = deterministicUuid("child-proof");
  const runs = ([0, 1, 2] as const).map((wanted) => {
    const seed = seedForInheritanceRoll(wanted);
    const rng = createSeededRandom(seed);
    const assigned = inheritGeneticPower({
      rng,
      childId,
      childElement: "FIRE",
      parentA,
      parentB,
    });
    return {
      seed,
      originType: assigned.originType,
      powerKey: assigned.genome.key,
      powerName: assigned.genome.namePt,
      powerLineageId: assigned.lineageId,
      powerId: assigned.powerId,
      cards: generatePowerCards({ power: assigned.genome, speciesKey: "pyron", seed }).map((card) => ({
        locus: card.locus,
        name: card.namePt,
        catalogKey: card.catalogKey,
      })),
    };
  });
  return { father: father.power.namePt, mother: mother.power.namePt, runs };
}
