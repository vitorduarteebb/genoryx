export type BattleRenderMode = "MODEL_3D" | "PORTRAIT" | "SPECIES_MASTER" | "SILHOUETTE";

export type BattleCreatureVisual = {
  renderMode: BattleRenderMode;
  modelUrl: string | null;
  portraitUrl: string | null;
  imageHash: string | null;
  lifeStage: string;
  temperament: string | null;
  bodyPlan: string | null;
  mutation: string | null;
  aura: string | null;
  visualSeed: string | null;
  chassis?: unknown;
  source: "creature-3d" | "creature-portrait" | "species-master" | "silhouette";
  provider: string | null;
  /** true só enquanto o asset oficial ainda está gerando. Silhueta sem forming = ausência, não quadrado. */
  forming: boolean;
};

export type BattleVisualHints = {
  lifeStage?: string | null;
  temperament?: string | null;
  bodyPlan?: string | null;
  mutation?: string | null;
  aura?: string | null;
  visualSeed?: string | null;
  modelUrl?: string | null;
  portrait?: { url?: string | null; imageHash?: string | null; provider?: string | null; status?: string | null } | null;
  speciesMaster?: {
    portraitUrl?: string | null;
    modelUrl?: string | null;
    imageHash?: string | null;
    provider?: string | null;
    lifeStage?: string | null;
  } | null;
  chassis?: unknown;
};

const PENDING = new Set(["PENDING", "GENERATING", "VALIDATING", "FORMING"]);

function identity(input: BattleVisualHints) {
  return {
    lifeStage: input.lifeStage ?? "BABY",
    temperament: input.temperament ?? null,
    bodyPlan: input.bodyPlan ?? null,
    mutation: input.mutation ?? null,
    aura: input.aura ?? null,
    visualSeed: input.visualSeed ?? null,
    chassis: input.chassis ?? null,
  };
}

/** 3D READY → retrato OPENAI/READY → master da espécie → silhueta. Nunca quadrado de cor. */
export function resolveBattleCreatureVisual(input: BattleVisualHints): BattleCreatureVisual {
  const base = identity(input);
  if (input.modelUrl) {
    return {
      ...base,
      renderMode: "MODEL_3D",
      modelUrl: input.modelUrl,
      portraitUrl: input.portrait?.url ?? input.speciesMaster?.portraitUrl ?? null,
      imageHash: input.portrait?.imageHash ?? input.speciesMaster?.imageHash ?? null,
      source: "creature-3d",
      provider: input.portrait?.provider ?? input.speciesMaster?.provider ?? null,
      forming: false,
    };
  }
  if (input.portrait?.url) {
    return {
      ...base,
      renderMode: "PORTRAIT",
      modelUrl: null,
      portraitUrl: input.portrait.url,
      imageHash: input.portrait.imageHash ?? null,
      source: "creature-portrait",
      provider: input.portrait.provider ?? null,
      forming: false,
    };
  }
  if (input.speciesMaster?.portraitUrl || input.speciesMaster?.modelUrl) {
    return {
      ...base,
      renderMode: input.speciesMaster.modelUrl ? "MODEL_3D" : "SPECIES_MASTER",
      modelUrl: input.speciesMaster.modelUrl ?? null,
      portraitUrl: input.speciesMaster.portraitUrl ?? null,
      imageHash: input.speciesMaster.imageHash ?? null,
      source: "species-master",
      provider: input.speciesMaster.provider ?? null,
      forming: false,
    };
  }
  return {
    ...base,
    renderMode: "SILHOUETTE",
    modelUrl: null,
    portraitUrl: null,
    imageHash: null,
    source: "silhouette",
    provider: null,
    forming: Boolean(input.portrait?.status && PENDING.has(input.portrait.status.toUpperCase())),
  };
}
