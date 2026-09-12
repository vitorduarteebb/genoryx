import { isRevealHidden } from "@nexora/config";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type PresentedVisual = {
  status?: "READY" | "PENDING" | "FAILED" | "FORMING" | string;
  lifeStage?: string;
  url?: string | null;
  imageHash?: string | null;
  source?: "canonical" | "fallback" | "legacy" | "forming" | string;
};

export type VisualMode = "canonical" | "legacy" | "forming" | "secret" | "pending";

export function officialPortraitSrc(portraitUrl?: string | null): string | null {
  if (!portraitUrl) {
    return null;
  }
  if (portraitUrl.startsWith("http://") || portraitUrl.startsWith("https://")) {
    return portraitUrl;
  }
  return `${API_URL}${portraitUrl}`;
}

export function resolveCreatureVisual(input: {
  visual?: PresentedVisual | null;
  portraitUrl?: string | null;
  revealStatus?: string | null;
  visualJob?: boolean;
  visualStatus?: string | null;
}): { mode: VisualMode; url: string | null } {
  if (isRevealHidden(input.revealStatus)) {
    if (input.revealStatus === "READY_TO_REVEAL") {
      return { mode: "secret", url: null };
    }
    return { mode: "forming", url: null };
  }
  const url = officialPortraitSrc(input.visual?.url ?? input.portraitUrl);
  if (url) {
    return { mode: "canonical", url };
  }
  if (input.visual?.source === "forming" || input.visual?.status === "FORMING" || input.visual?.status === "PENDING") {
    return { mode: "forming", url: null };
  }
  if (input.visual?.status === "FAILED" || input.visualStatus === "FAILED") {
    return { mode: "pending", url: null };
  }
  if (input.visualJob) {
    return { mode: "forming", url: null };
  }
  return { mode: "legacy", url: null };
}
