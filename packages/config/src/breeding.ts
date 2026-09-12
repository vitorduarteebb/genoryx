export const breedingConfig = {
  maxFertility: 5,
  unlockCharacterLevel: 10,
  questKey: "the-genesis-code",
  captureQuestKey: "first-hunt",
  costsGoldByPriorBreeds: [2000, 5000, 12000, 25000, 50000],
  incubationMinutes: {
    COMMON: 30,
    RARE: 120,
    EPIC: 360,
    ANCESTRAL: 720,
  },
  recessiveRevealChance: 0.2,
  mutationChance: 0.03,
  geneticSurgeMutationBonus: 0.05,
  parentGeneWeight: 0.5,
  rankDriftChance: 0.08,
} as const;
