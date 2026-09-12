import type { CreaturePick } from "../creature-pick-card";

export type CrossPotential = {
  score: number;
  categories: Array<{ key: string; label: string; band: string }>;
  possibleElements: string[];
  possibleTypologies: string[];
  powerInheritance: { parentA: number; parentB: number; novel: number };
  closeLineage: boolean;
};

export type BreedingPreview = {
  costGold: string;
  catalystRequired?: number;
  catalystOwned?: number;
  compatible: boolean;
  fertilityA: number;
  fertilityB: number;
  fertilityAfterA: number;
  fertilityAfterB: number;
  generation: number;
  crossPotential: CrossPotential;
};

export type GenesisEgg = {
  eggId: string;
  id?: string;
  status: string;
  genesisGrade: string;
  hatchAt: string;
  incubationStartedAt: string;
  generation: number;
  eggVisualStatus: string;
  visualUrl: string | null;
  imageHash: string | null;
  parentA: { name: string; speciesName: string; speciesKey: string } | null;
  parentB: { name: string; speciesName: string; speciesKey: string } | null;
};

export type BreedingHistoryRow = {
  id: string;
  createdAt: string;
  costGold: string;
  parentA: { name?: string; speciesName?: string };
  parentB: { name?: string; speciesName?: string };
  egg: GenesisEgg | null;
  child: { id: string; name?: string | null; speciesName?: string } | null;
};

export type LabTab = "analysis" | "eggs" | "history";

export type ParentSlot = "A" | "B";

export type EnrichedCreature = CreaturePick & {
  mutation?: string | null;
  geneticPower?: { name: string; typology: string; lineageId?: string | null; element?: string } | null;
  typology?: string | null;
};

export function gradeLabel(grade: string) {
  const map: Record<string, string> = {
    COMMON: "Common Genesis",
    REFINED: "Refined Genesis",
    RARE: "Rare Genesis",
    EXCEPTIONAL: "Exceptional Genesis",
    GENESIS: "Genesis",
  };
  return map[grade] ?? grade;
}

export function bandLabel(band: string) {
  const map: Record<string, string> = {
    LOW: "Baixa",
    GOOD: "Boa",
    HIGH: "Alta",
    EXCELLENT: "Excelente",
    UNSTABLE: "Instável",
    UNKNOWN: "Desconhecido",
  };
  return map[band] ?? band;
}
