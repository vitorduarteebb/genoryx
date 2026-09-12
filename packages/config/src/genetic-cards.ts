import { GENETIC_CARD_LOCI } from "@nexora/types";

export const geneticCardConfig = {
  lociPerCreature: GENETIC_CARD_LOCI.length,
  allelesPerLocus: ["expressed", "recessive"] as const,
  partyCreatures: 3,
  geneticCardsInParty: GENETIC_CARD_LOCI.length * 3,
  competitiveDeckSize: 30,
} as const;

export { GENETIC_CARD_LOCI };
