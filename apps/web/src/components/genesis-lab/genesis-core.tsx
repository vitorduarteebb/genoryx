"use client";

import type { BreedingPreview } from "./types";

export function GenesisCore({
  ready,
  merging,
  preview,
}: {
  ready: boolean;
  merging?: boolean;
  preview: BreedingPreview | null;
}) {
  return (
    <div className={`genesis-core ${ready ? "active" : ""} ${merging ? "merging" : ""}`}>
      <div className="dna-stream left" />
      <div className="dna-stream right" />
      <div className="genesis-core-ring" />
      <div className="genesis-core-heart" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-[10px] uppercase tracking-[0.28em] text-crystal">Genesis Core</p>
        {preview ? (
          <>
            <p className="mt-2 font-display text-4xl text-gold">{preview.crossPotential.score}</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted">Cross Potential</p>
          </>
        ) : (
          <p className="mt-3 max-w-[9rem] text-xs text-muted">Escolha os dois pais para ativar o núcleo.</p>
        )}
      </div>
    </div>
  );
}
