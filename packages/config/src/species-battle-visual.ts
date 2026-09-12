import { presentationConfig } from "./presentation";

/** Visual de batalha da ESPÉCIE. Wild não gera OpenAI/Meshy por spawn. */
export const speciesBattleVisuals: Record<
  string,
  {
    masterCreatureId?: string;
    displayName: string;
  }
> = {
  florune: { masterCreatureId: "84ae443c-a1e8-41eb-afe1-aff5763eaf01", displayName: "Florune" },
  nympha: { displayName: "Nympha" },
  pyron: { displayName: "Pyron" },
  terranox: { displayName: "Terranox" },
  drakor: { displayName: "Drakor" },
  aqualis: { displayName: "Aqualis" },
  voltaris: { displayName: "Voltaris" },
  sparkyn: { displayName: "Sparkyn" },
  grumak: { displayName: "Grumak" },
  cryon: { displayName: "Cryon" },
  noctyr: { displayName: "Noctyr" },
  lumera: { displayName: "Lumera" },
};

export const battlePresentationConfig = {
  /** web = arena React (fallback). unity = host Unity Battle. */
  renderer: presentationConfig.battleRenderer,
  cardWidthPx: { min: 170, max: 220 },
} as const;
