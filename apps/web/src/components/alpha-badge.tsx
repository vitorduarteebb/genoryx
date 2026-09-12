import { brandConfig } from "@nexora/config";
import { buildId, isAlpha } from "../lib/release";

export function AlphaBadge() {
  if (!isAlpha) {
    return null;
  }

  return (
    <p
      className="pointer-events-none fixed bottom-4 right-4 z-50 rounded-full border border-gold/30 bg-black/70 px-3 py-1 font-display text-[10px] uppercase tracking-[0.28em] text-gold"
      title={`build ${buildId}`}
    >
      {brandConfig.alphaLabel}
    </p>
  );
}
