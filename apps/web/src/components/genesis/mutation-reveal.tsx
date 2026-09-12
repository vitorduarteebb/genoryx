"use client";

export function MutationReveal({ mutation }: { mutation: string }) {
  return (
    <div className="px-6 py-8 text-center">
      <p className="text-[10px] uppercase tracking-[0.32em] text-ember">GENETIC ANOMALY DETECTED</p>
      <p className="mt-2 font-display text-4xl text-gold">⚡ {mutation}</p>
    </div>
  );
}
