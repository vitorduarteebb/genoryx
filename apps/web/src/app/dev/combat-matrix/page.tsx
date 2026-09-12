"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type Proof = {
  flags: Record<string, boolean>;
  draft: {
    phase: string;
    banned: string | null;
    selected: string[];
    benched: string | null;
    formation: { FRONT?: string; MIDDLE?: string; BACK?: string };
    bannedPickRejected: boolean;
  };
  battle: {
    party: Array<{ name: string; speciesKey: string; slot: string; typology?: string }>;
    windows: Array<{ round: number; middleOpen: boolean; front: string[]; middle: string[]; back: string[] }>;
    fusionRound4: unknown[];
    fusionRound5: Array<{ familyKey: string; namePt: string; ready: boolean; reason: string }>;
    vitalAshes: { namePt: string; ready: boolean } | null;
    livingFurnace: { namePt: string; ready: boolean } | null;
    healControlWithoutBurnUsage: { ready: boolean; reason: string } | null;
    phoenix: { namePt: string; ready: boolean; presentation: string } | null;
  };
};

export default function CombatMatrixProofPage() {
  const [payload, setPayload] = useState<Proof | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch(`${API_URL}/combat-matrix/proof`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Falha ao carregar a prova da matriz.");
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

  const r1 = payload.battle.windows.find((row) => row.round === 1);
  const r2 = payload.battle.windows.find((row) => row.round === 2);

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-6">
      <p className="text-[11px] uppercase tracking-[0.2em] text-crystal">DEV · Combat Matrix V2</p>
      <h1 className="font-display text-3xl text-gold">Draft · Formação F/M/B · Fusão · Convergência</h1>
      <p className="text-sm text-muted">
        Flags off no Alpha. Prova local da engine. Draft {payload.flags.COMBAT_DRAFT_V2 ? "on" : "off"} · Formação{" "}
        {payload.flags.FORMATION_LINEAR_V2 ? "on" : "off"} · Fusão {payload.flags.FUSION_V2 ? "on" : "off"} · Convergência{" "}
        {payload.flags.CONVERGENCE_V1 ? "on" : "off"}.
      </p>

      <section className="rounded-2xl border border-[#2a2438] p-4">
        <h2 className="font-display text-2xl text-gold">Roster 5 → Ban → Pick 3</h2>
        <p>Adversário bane Terranox · {payload.draft.banned}</p>
        <p>Pick: {payload.draft.selected.join(" · ")}</p>
        <p>Banco: {payload.draft.benched} (não entra na luta)</p>
        <p>Pick da banida recusado: {payload.draft.bannedPickRejected ? "sim" : "não"}</p>
        <p>
          Formação FRONT {payload.draft.formation.FRONT} · MIDDLE {payload.draft.formation.MIDDLE} · BACK{" "}
          {payload.draft.formation.BACK}
        </p>
        <p className="text-sm text-muted">Fase: {payload.draft.phase}</p>
      </section>

      <section className="rounded-2xl border border-[#2a2438] p-4">
        <h2 className="font-display text-2xl text-gold">Party ativa</h2>
        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
          {(["BACK", "MIDDLE", "FRONT"] as const).map((slot) => {
            const unit = payload.battle.party.find((row) => row.slot === slot);
            return (
              <div key={slot} className="rounded-xl border border-[#2a2438] p-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-crystal">{slot}</p>
                <p className="font-display text-xl text-gold">{unit?.name ?? "—"}</p>
                <p className="text-sm text-muted">{unit?.typology}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-[#2a2438] p-4">
        <h2 className="font-display text-2xl text-gold">Janela do MIDDLE</h2>
        <p>Round 1 · {r1?.middleOpen ? "OPEN" : "CLOSED"} · FRONT alvo {r1?.front.length ? "sim" : "não"} · MIDDLE {r1?.middle.length ? "sim" : "não"}</p>
        <p>Round 2 · {r2?.middleOpen ? "OPEN" : "CLOSED"}</p>
        <p className="text-sm text-muted">BACK só com carta BACKLINE. Impares fechados, pares abertos.</p>
      </section>

      <section className="rounded-2xl border border-[#2a2438] p-4">
        <h2 className="font-display text-2xl text-gold">Round 5 · Sinergia</h2>
        <p>Round 4 prontas: {payload.battle.fusionRound4.length}</p>
        <p>Pyron + Florune → {payload.battle.vitalAshes?.namePt} {payload.battle.vitalAshes?.ready ? "pronta" : ""}</p>
        <p>Heal+Control sem usage de Heal: {payload.battle.healControlWithoutBurnUsage?.reason ?? "n/a"}</p>
        <ul className="mt-2 text-sm">
          {payload.battle.fusionRound5.map((row) => (
            <li key={row.familyKey}>
              {row.namePt} · {row.ready ? "pronta" : row.reason}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-[#2a2438] p-4">
        <h2 className="font-display text-2xl text-gold">Round 7 · Convergência</h2>
        <p>
          GENETIC CONVERGENCE DETECTED · {payload.battle.phoenix?.namePt ?? "Ciclo da Fênix"} ·{" "}
          {payload.battle.phoenix?.ready ? "pronta" : "bloqueada"}
        </p>
        <p className="text-sm text-muted">Apresentação: {payload.battle.phoenix?.presentation ?? "CONVERGENCE"}</p>
      </section>
    </main>
  );
}
