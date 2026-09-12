"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type Proof = {
  enabled: boolean;
  creatures: Array<{
    speciesKey: string;
    power: { namePt: string; typology: string; element: string };
    cards: Array<{ locus: string; namePt: string; text: string }>;
  }>;
  battle: {
    round1to4: unknown[];
    livingFurnace: { namePt: string; ready: boolean } | null;
    vitalAshes: { namePt: string; ready: boolean } | null;
    phoenix: { namePt: string; ready: boolean } | null;
  };
  breeding: {
    father: string;
    mother: string;
    runs: Array<{ seed: number; originType: string; powerName: string; powerLineageId: string }>;
  };
};

export default function GeneticPowersProofPage() {
  const [payload, setPayload] = useState<Proof | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch(`${API_URL}/genetic-powers/proof`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Falha ao carregar a prova.");
        }
        return response.json();
      })
      .then(setPayload)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Falha."));
  }, []);

  if (error) {
    return <main className="p-6 text-ember">{error}</main>;
  }
  if (!payload) {
    return <main className="p-6 text-muted">Carregando prova…</main>;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-6">
      <p className="text-[11px] uppercase tracking-[0.2em] text-crystal">DEV · Genetic Power V1</p>
      <h1 className="font-display text-3xl text-gold">Poder hereditário + fusão</h1>
      <p className="text-sm text-muted">Flag GENETIC_POWER_V1 = {payload.enabled ? "ligada" : "desligada (prova local da engine)"}.</p>
      {payload.creatures.map((row) => (
        <section key={row.speciesKey} className="rounded-2xl border border-[#2a2438] p-4">
          <h2 className="font-display text-2xl text-gold">
            {row.speciesKey} · {row.power.namePt}
          </h2>
          <p className="text-sm text-muted">
            {row.power.element} · {row.power.typology}
          </p>
          <ol className="mt-3 grid gap-1 text-sm">
            {row.cards.map((card) => (
              <li key={card.locus}>
                <span className="text-crystal">{card.locus}</span> {card.namePt} — {card.text}
              </li>
            ))}
          </ol>
        </section>
      ))}
      <section className="rounded-2xl border border-[#2a2438] p-4">
        <h2 className="font-display text-2xl text-gold">Batalha · Round 5</h2>
        <p className="text-sm text-muted">Round 1–4: {payload.battle.round1to4.length} fusões prontas.</p>
        <p>Pyron + Terranox → {payload.battle.livingFurnace?.namePt} {payload.battle.livingFurnace?.ready ? "pronta" : ""}</p>
        <p>Pyron + Florune → {payload.battle.vitalAshes?.namePt} {payload.battle.vitalAshes?.ready ? "pronta" : ""}</p>
        <p>Triplo → {payload.battle.phoenix?.namePt ?? "bloqueado"}</p>
      </section>
      <section className="rounded-2xl border border-[#2a2438] p-4">
        <h2 className="font-display text-2xl text-gold">Breeding</h2>
        <p className="text-sm text-muted">
          {payload.breeding.father} × {payload.breeding.mother}
        </p>
        <ul className="mt-2 text-sm">
          {payload.breeding.runs.map((run) => (
            <li key={run.seed}>
              seed {run.seed}: {run.originType} · {run.powerName} · linhagem {run.powerLineageId.slice(0, 8)}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
