export type GenesisSoundHooks = {
  onPulse?: () => void;
  onCrack?: () => void;
  onBurst?: () => void;
  onSilhouette?: () => void;
  onReveal?: () => void;
  onMutation?: () => void;
};

export const silentGenesisHooks: GenesisSoundHooks = {};
