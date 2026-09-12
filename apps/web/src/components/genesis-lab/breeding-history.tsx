"use client";

import { gradeLabel, type BreedingHistoryRow } from "./types";

export function BreedingHistory({ rows }: { rows: BreedingHistoryRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted">Ainda não há gêneses nesta conta.</p>;
  }
  return (
    <div className="grid gap-3">
      {rows.map((row) => (
        <article key={row.id} className="rounded-2xl border border-[#2a2438] bg-void/40 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-crystal">
            {new Date(row.createdAt).toLocaleString()} · {row.costGold === "0" ? "Livre" : `${row.costGold} GOLD`}
          </p>
          <p className="mt-1 font-display text-lg text-gold">
            {row.parentA.speciesName ?? "Pai"} × {row.parentB.speciesName ?? "Mãe"}
          </p>
          <p className="text-xs text-muted">
            {row.egg ? gradeLabel(row.egg.genesisGrade) : "—"}
            {row.child ? ` · ${row.child.speciesName ?? row.child.name}` : " · ovo em curso"}
          </p>
        </article>
      ))}
    </div>
  );
}
