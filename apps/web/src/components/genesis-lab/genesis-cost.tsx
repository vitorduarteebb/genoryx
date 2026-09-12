"use client";

import { FertilityPips } from "../creature-pick-card";
import type { BreedingPreview } from "./types";

export function GenesisCost({
  preview,
  nameA,
  nameB,
}: {
  preview: BreedingPreview;
  nameA: string;
  nameB: string;
}) {
  return (
    <div className="rounded-2xl border border-gold/25 bg-void/50 px-4 py-3 text-center">
      <p className="text-[10px] uppercase tracking-[0.24em] text-muted">Genesis Cost</p>
      <p className="font-display text-2xl text-gold">{preview.costGold} GOLD</p>
      <p className="mt-1 text-xs text-crystal">
        1 Genome Catalyst · você tem {preview.catalystOwned ?? 0}
      </p>
      <div className="mt-2 flex justify-center gap-6 text-xs text-muted">
        <p>
          {nameA} {preview.fertilityA}/5 → {preview.fertilityAfterA}/5
        </p>
        <p>
          {nameB} {preview.fertilityB}/5 → {preview.fertilityAfterB}/5
        </p>
      </div>
      <div className="mt-2 flex justify-center gap-6">
        <FertilityPips value={preview.fertilityAfterA} />
        <FertilityPips value={preview.fertilityAfterB} />
      </div>
    </div>
  );
}
