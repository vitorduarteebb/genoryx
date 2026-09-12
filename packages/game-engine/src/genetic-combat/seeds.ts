import { GENETIC_ENGINE_VERSION } from "@nexora/config";
import { seedFromParts } from "../genes/hash";
import { createSeededRandom } from "../random/random-service";
import type { BirthRolls } from "./types";

export function birthSeedOf(input: { creatureId: string; geneticHash: string; genesisSeed: number }): number {
  return seedFromParts([input.genesisSeed, input.creatureId, input.geneticHash, GENETIC_ENGINE_VERSION, "birth"]);
}

export function subSeed(birthSeed: number, lane: string): number {
  return seedFromParts([birthSeed, lane, GENETIC_ENGINE_VERSION]);
}

export function roll01(birthSeed: number, lane: string): number {
  return Math.round(createSeededRandom(subSeed(birthSeed, lane)).next() * 100);
}

export function rollBirth(birthSeed: number, starter: boolean): BirthRolls {
  const clamp = (value: number, min: number) => (starter ? Math.max(min, value) : value);
  return {
    potency: roll01(birthSeed, "potency"),
    efficiency: clamp(roll01(birthSeed, "efficiency"), starter ? 52 : 0),
    expression: roll01(birthSeed, "expression"),
    coherence: clamp(roll01(birthSeed, "coherence"), starter ? 55 : 0),
    stability: roll01(birthSeed, "stability"),
    mutation: roll01(birthSeed, "mutation"),
    quirk: roll01(birthSeed, "quirk"),
    novelty: roll01(birthSeed, "novelty"),
    adaptability: roll01(birthSeed, "adaptability"),
  };
}
