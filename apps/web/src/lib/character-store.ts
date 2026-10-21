import { create } from "zustand";
import type { CharacterAppearance } from "@nexora/config";

export type CharacterMe = {
  id: string;
  name: string;
  level: number;
  xp: number;
  class: string;
  mapKey: string;
  starterChosen: boolean;
  appearance?: CharacterAppearance;
  appearanceConfirmed?: boolean;
  wallets: Array<{ currency: string; balance: string }>;
};

type CharacterState = {
  character: CharacterMe | null;
  setCharacter: (character: CharacterMe | null) => void;
  applyWallets: (wallets: CharacterMe["wallets"]) => void;
};

export const useCharacterStore = create<CharacterState>((set) => ({
  character: null,
  setCharacter(character) {
    set({ character });
  },
  applyWallets(wallets) {
    set((state) => (state.character ? { character: { ...state.character, wallets } } : state));
  },
}));
