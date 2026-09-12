import type { CreatureRevealStatus, LifeStage, VisualAssetStatus, VisualImageProvider } from "@nexora/types";

export type VisualAssetHint = {
  lifeStage: LifeStage | string;
  status: VisualAssetStatus | string;
  publicUrl?: string | null;
  imageHash?: string | null;
  provider?: VisualImageProvider | string | null;
  model?: string | null;
};

export type ResolvedCreatureVisual = {
  status: "READY" | "PENDING" | "FAILED" | "FORMING";
  lifeStage: LifeStage | string;
  url: string | null;
  imageHash: string | null;
  source: "canonical" | "fallback" | "legacy" | "forming";
  provider: VisualImageProvider | null;
};

const STAGE_FALLBACK: Record<string, LifeStage[]> = {
  ADULT: ["ADULT", "YOUNG", "BABY"],
  YOUNG: ["YOUNG", "BABY"],
  BABY: ["BABY"],
  EGG: ["EGG", "BABY"],
};

export function versionedVisualUrl(publicUrl: string | null | undefined, imageHash?: string | null): string | null {
  if (!publicUrl) {
    return null;
  }
  if (!imageHash) {
    return publicUrl;
  }
  const sep = publicUrl.includes("?") ? "&" : "?";
  return `${publicUrl}${sep}v=${imageHash.slice(0, 16)}`;
}

export function isRevealHidden(revealStatus?: CreatureRevealStatus | string | null): boolean {
  return revealStatus === "PENDING_VISUAL" || revealStatus === "READY_TO_REVEAL";
}

export function visualProviderOf(asset: VisualAssetHint): VisualImageProvider {
  if (asset.provider === "OPENAI" || asset.provider === "MOCK") {
    return asset.provider;
  }
  return asset.model === "mock" ? "MOCK" : "OPENAI";
}

function readyAt(
  assets: readonly VisualAssetHint[],
  stage: string,
  provider?: VisualImageProvider,
): VisualAssetHint | undefined {
  return assets.find((asset) => {
    if (asset.lifeStage !== stage || asset.status !== "READY" || !asset.publicUrl) {
      return false;
    }
    if (!provider) {
      return true;
    }
    return visualProviderOf(asset) === provider;
  });
}

function toReady(asset: VisualAssetHint, source: ResolvedCreatureVisual["source"]): ResolvedCreatureVisual {
  return {
    status: "READY",
    lifeStage: asset.lifeStage,
    url: versionedVisualUrl(asset.publicUrl, asset.imageHash),
    imageHash: asset.imageHash ?? null,
    source,
    provider: visualProviderOf(asset),
  };
}

export function resolveCreatureVisual(input: {
  lifeStage: LifeStage | string;
  assets?: readonly VisualAssetHint[] | null;
  revealStatus?: CreatureRevealStatus | string | null;
  allowPriorStage?: boolean;
  preferredProvider?: VisualImageProvider | string | null;
  strictPreferred?: boolean;
}): ResolvedCreatureVisual {
  const lifeStage = input.lifeStage || "BABY";
  const assets = input.assets ?? [];
  const order = input.allowPriorStage === false ? [lifeStage] : (STAGE_FALLBACK[lifeStage] ?? [lifeStage]);
  const preferred =
    input.preferredProvider === "OPENAI" || input.preferredProvider === "MOCK" ? input.preferredProvider : undefined;
  const strict = Boolean(input.strictPreferred && preferred);

  if (preferred) {
    for (const stage of order) {
      const official = readyAt(assets, stage, preferred);
      if (official) {
        return toReady(official, "canonical");
      }
    }
  }

  if (!strict) {
    for (const stage of order) {
      const anyReady = readyAt(assets, stage);
      if (anyReady) {
        return toReady(anyReady, preferred && visualProviderOf(anyReady) !== preferred ? "fallback" : "canonical");
      }
    }
  }

  const current = assets.filter((asset) => asset.lifeStage === lifeStage);
  const watched = preferred ? current.filter((asset) => visualProviderOf(asset) === preferred) : current;
  const pool = watched.length > 0 ? watched : current;
  if (pool.some((asset) => asset.status === "FAILED" || asset.status === "FAILED_REVIEW") && !pool.some((asset) => asset.status === "READY")) {
    return { status: "FAILED", lifeStage, url: null, imageHash: null, source: "legacy", provider: preferred ?? null };
  }
  if (pool.some((asset) => asset.status !== "READY")) {
    return { status: "FORMING", lifeStage, url: null, imageHash: null, source: "forming", provider: preferred ?? null };
  }
  return { status: "PENDING", lifeStage, url: null, imageHash: null, source: "legacy", provider: preferred ?? null };
}
