"use client";

import { officialPortraitSrc } from "../../lib/creature-art";
import { useReducedMotion } from "../genesis/use-reduced-motion";
import "../genesis/genesis-reveal.css";

export type EvolutionPayload = {
  creatureId: string;
  name: string;
  speciesName: string;
  fromStage: string;
  toStage: string;
  evolutionStatus: string;
  canEvolve: boolean;
  fromVisual: { status: string; lifeStage: string; url: string | null; imageHash: string | null };
  toVisual: { status: string; lifeStage: string; url: string | null; imageHash: string | null };
};

export function EvolutionReveal({
  payload,
  onEvolve,
  busy,
  error,
}: {
  payload: EvolutionPayload;
  onEvolve: () => Promise<void>;
  busy?: boolean;
  error?: string | null;
}) {
  const reduced = useReducedMotion();
  const from = officialPortraitSrc(payload.fromVisual.url);
  const to = officialPortraitSrc(payload.toVisual.url);
  const ready = payload.canEvolve;
  const showingResult = payload.fromStage !== payload.toStage;

  return (
    <section className="genesis-reveal" data-reduced={reduced}>
      <p className="text-[11px] uppercase tracking-[0.22em] text-crystal">Evolução · Genesis</p>
      <h1 className="font-display text-4xl text-gold">{payload.name}</h1>
      <p className="text-muted">
        {payload.speciesName} · {payload.fromStage}
        {showingResult ? ` → ${payload.toStage}` : payload.canEvolve ? ` → ${payload.toStage}` : ""}
      </p>
      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <figure className="overflow-hidden rounded-3xl border border-[#2a2438] bg-black/30">
          {from ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={from} alt="" className="aspect-square w-full object-cover" />
          ) : (
            <div className="grid aspect-square place-items-center text-gold">{payload.fromStage}</div>
          )}
        </figure>
        <p className="text-center text-gold">{showingResult ? "↓" : "→"}</p>
        <figure className="overflow-hidden rounded-3xl border border-gold/30 bg-black/30">
          {to ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={to} alt="" className="aspect-square w-full object-cover" />
          ) : (
            <div className="grid aspect-square place-items-center text-crystal">
              {payload.toVisual.status === "FORMING" || payload.toVisual.status === "PENDING" ? "Energia Genesis…" : payload.toStage}
            </div>
          )}
        </figure>
      </div>
      {error ? <p className="mt-4 text-ember">{error}</p> : null}
      {ready && !showingResult ? (
        <button
          type="button"
          disabled={busy}
          className="mt-6 rounded-xl border border-gold/50 px-5 py-2 text-gold disabled:opacity-40"
          onClick={() => void onEvolve()}
        >
          Evoluir
        </button>
      ) : (
        <p className="mt-6 text-sm text-muted">O mesmo indivíduo amadurece. DNA, loci e linhagem permanecem intactos.</p>
      )}
    </section>
  );
}
