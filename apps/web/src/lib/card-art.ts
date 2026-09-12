import { resolveCanonicalCardArt as pickCanonicalCardArt, versionedCardArtUrl } from "@nexora/config";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function officialCardArtSrc(publicUrl?: string | null): string | null {
  if (!publicUrl) {
    return null;
  }
  if (publicUrl.startsWith("http://") || publicUrl.startsWith("https://") || publicUrl.startsWith("/dev-proof/")) {
    return publicUrl;
  }
  return `${API_URL}${publicUrl}`;
}

export function resolveCanonicalCardArt(
  cardDefinitionId: string,
  variant = "BASE",
  presented?: { artUrl?: string | null; imageHash?: string | null; status?: string | null; provider?: string | null },
): { artUrl: string | null; imageHash: string | null; source: "openai" | "fallback" | "placeholder" } {
  if (presented?.artUrl) {
    const absolute = officialCardArtSrc(presented.artUrl);
    const alreadyVersioned = Boolean(absolute && (absolute.includes("?v=") || absolute.includes("&v=")));
    return {
      artUrl: alreadyVersioned ? absolute : (versionedCardArtUrl(absolute, presented.imageHash) ?? absolute),
      imageHash: presented.imageHash ?? null,
      source: presented.provider === "OPENAI" ? "openai" : "fallback",
    };
  }
  const picked = pickCanonicalCardArt(cardDefinitionId, variant, presented ? [presented] : []);
  if (picked.artUrl) {
    return { artUrl: officialCardArtSrc(picked.artUrl), imageHash: picked.imageHash, source: picked.source };
  }
  return {
    artUrl: `${API_URL}/card-art/${encodeURIComponent(cardDefinitionId)}/image?variant=${encodeURIComponent(variant)}`,
    imageHash: null,
    source: "placeholder",
  };
}

export function cardArtSrc(cardKey: string, variant = "BASE", publicUrl?: string | null, imageHash?: string | null): string {
  const resolved = resolveCanonicalCardArt(cardKey, variant, { artUrl: publicUrl, imageHash });
  return resolved.artUrl ?? `${API_URL}/card-art/${encodeURIComponent(cardKey)}/image?variant=${encodeURIComponent(variant)}`;
}
