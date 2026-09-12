export type CardArtHint = {
  cardDefinitionId?: string;
  variantKey?: string;
  status?: string | null;
  provider?: string | null;
  publicUrl?: string | null;
  imageHash?: string | null;
  approvedAt?: Date | string | null;
};

export type ResolvedCardArt = {
  cardDefinitionId: string;
  variant: string;
  status: "READY" | "PENDING" | "PLACEHOLDER";
  source: "openai" | "fallback" | "placeholder";
  artUrl: string | null;
  imageHash: string | null;
};

export function versionedCardArtUrl(publicUrl: string | null | undefined, imageHash?: string | null): string | null {
  if (!publicUrl) {
    return null;
  }
  if (!imageHash) {
    return publicUrl;
  }
  const sep = publicUrl.includes("?") ? "&" : "?";
  return `${publicUrl}${sep}v=${imageHash}`;
}

function matchesCard(asset: CardArtHint, cardDefinitionId: string, variant: string): boolean {
  if (asset.cardDefinitionId && asset.cardDefinitionId !== cardDefinitionId) {
    return false;
  }
  if (asset.variantKey && asset.variantKey !== variant) {
    return false;
  }
  return true;
}

function isReady(asset: CardArtHint): boolean {
  return asset.status === "READY" && Boolean(asset.publicUrl);
}

function toReady(asset: CardArtHint, cardDefinitionId: string, variant: string, source: "openai" | "fallback"): ResolvedCardArt {
  return {
    cardDefinitionId,
    variant,
    status: "READY",
    source,
    artUrl: versionedCardArtUrl(asset.publicUrl, asset.imageHash),
    imageHash: asset.imageHash ?? null,
  };
}

/** OPENAI READY → fallback READY aprovado → qualquer READY → placeholder artístico. */
export function resolveCanonicalCardArt(
  cardDefinitionId: string,
  variant = "BASE",
  assets: readonly CardArtHint[] = [],
): ResolvedCardArt {
  const matching = assets.filter((asset) => matchesCard(asset, cardDefinitionId, variant));
  const openai = matching.find((asset) => isReady(asset) && asset.provider === "OPENAI");
  if (openai) {
    return toReady(openai, cardDefinitionId, variant, "openai");
  }
  const approved = matching.find((asset) => isReady(asset) && Boolean(asset.approvedAt));
  if (approved) {
    return toReady(approved, cardDefinitionId, variant, "fallback");
  }
  const anyReady = matching.find((asset) => isReady(asset));
  if (anyReady) {
    return toReady(anyReady, cardDefinitionId, variant, "fallback");
  }
  return {
    cardDefinitionId,
    variant,
    status: matching.some((asset) => asset.status && asset.status !== "READY") ? "PENDING" : "PLACEHOLDER",
    source: "placeholder",
    artUrl: null,
    imageHash: null,
  };
}
