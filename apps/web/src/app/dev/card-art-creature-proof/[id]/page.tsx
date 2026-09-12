"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { GeneticCard } from "../../../../components/genetic-card";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type ProofCard = {
  cardKey: string | null;
  name: string;
  locus: string | null;
  status: string;
  imageUrl: string | null;
  imageHash: string | null;
  failureReason: string | null;
  usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number; images?: number } | null;
};

type ProofPayload = {
  title: string;
  species: string;
  creatureId: string;
  lifeStage: string;
  geneticPower: string | null;
  cards: ProofCard[];
};

export default function CreatureCardArtProofPage() {
  const { id } = useParams<{ id: string }>();
  const [payload, setPayload] = useState<ProofPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"FULL" | "ART">("FULL");

  useEffect(() => {
    if (!id) return;
    void fetch(`${API_URL}/card-art/creature-proof/${encodeURIComponent(id)}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("api");
        }
        return (await response.json()) as ProofPayload;
      })
      .catch(async () => {
        const local = await fetch(`/dev-proof/${encodeURIComponent(id)}/manifest.json`);
        if (!local.ok) {
          throw new Error("Falha ao carregar a prova creature-specific.");
        }
        return (await local.json()) as ProofPayload;
      })
      .then(setPayload)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Falha."));
  }, [id]);

  return (
    <main className="min-h-screen bg-void px-4 py-8 text-gold">
      <div className="mx-auto max-w-6xl">
        <p className="text-[10px] uppercase tracking-[0.22em] text-crystal">GENORYX · prova creature-specific</p>
        <h1 className="font-display mt-2 text-4xl">{payload?.title ?? "Terranox G1–G10"}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          {payload?.geneticPower ?? "Núcleo Pétreo"} · {payload?.lifeStage ?? "BABY"} · a mesma criatura canônica em
          todas as 10 manifestações. Sem Florune, Nympha ou outras Terranox.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.16em] ${
              mode === "FULL" ? "border-gold text-gold" : "border-[#2a2438] text-muted"
            }`}
            onClick={() => setMode("FULL")}
          >
            Full card
          </button>
          <button
            type="button"
            className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.16em] ${
              mode === "ART" ? "border-gold text-gold" : "border-[#2a2438] text-muted"
            }`}
            onClick={() => setMode("ART")}
          >
            Art only
          </button>
        </div>
        {error ? <p className="mt-4 text-ember">{error}</p> : null}
        <section className="gx-card-grid mt-8">
          {(payload?.cards ?? []).map((card) =>
            mode === "FULL" ? (
              <div key={card.locus ?? card.cardKey} className="flex flex-col items-center gap-2">
                {card.cardKey ? (
                  <GeneticCard
                    cardKey={card.cardKey}
                    locus={card.locus}
                    artUrl={card.imageUrl}
                    imageHash={card.imageHash}
                    size="proof"
                    openDetail
                  />
                ) : null}
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted">
                  {card.locus} · {card.status}
                  {card.imageHash ? ` · ${card.imageHash.slice(0, 10)}` : ""}
                </p>
              </div>
            ) : (
              <figure key={`${card.locus}-art`} className="w-full max-w-[300px]">
                <div className="aspect-square overflow-hidden rounded-2xl border border-[#2a2438] bg-panel">
                  {card.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={card.imageUrl.startsWith("http") ? card.imageUrl : `${API_URL}${card.imageUrl}`}
                      alt={card.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-xs text-muted">{card.status}</div>
                  )}
                </div>
                <figcaption className="mt-2 text-center text-xs text-muted">
                  {card.locus} · {card.name}
                </figcaption>
              </figure>
            ),
          )}
        </section>
      </div>
    </main>
  );
}
