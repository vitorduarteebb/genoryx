"use client";

import { bandLabel, type CrossPotential } from "./types";

export function CrossPotentialPanel({ potential }: { potential: CrossPotential }) {
  return (
    <section className="rounded-2xl border border-gold/20 bg-void/40 p-4">
      <p className="text-[10px] uppercase tracking-[0.28em] text-gold">Cross Potential</p>
      <p className="mt-1 font-display text-3xl text-gold">{potential.score}%</p>
      <p className="mt-1 text-xs text-muted">Previsão dos pais. Não promete o grade do ovo.</p>
      <dl className="mt-4 grid gap-2 text-sm">
        {potential.categories.map((row) => (
          <div key={row.key} className="flex items-center justify-between">
            <dt className="text-muted">{row.label}</dt>
            <dd className="uppercase tracking-[0.14em] text-crystal">{bandLabel(row.band)}</dd>
          </div>
        ))}
      </dl>
      {potential.closeLineage ? (
        <p className="mt-3 text-xs uppercase tracking-[0.18em] text-ember">Close lineage</p>
      ) : null}
    </section>
  );
}
