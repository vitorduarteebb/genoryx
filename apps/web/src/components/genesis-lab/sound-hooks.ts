export type GenesisLabSoundHooks = {
  onParentSelected?: () => void;
  onGenesisReady?: () => void;
  onGenesisStarted?: () => void;
  onGenomeCombined?: () => void;
  onEggCreated?: () => void;
  onEggReady?: () => void;
  onReveal?: () => void;
};

export const silentLabHooks: GenesisLabSoundHooks = {};
