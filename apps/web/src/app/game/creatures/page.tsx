"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CreatureCollectCard } from "../../../components/creature-collect-card";
import "../../../components/creature-collect-card.css";
import { CreatureGxrFigure } from "../../../components/creature-gxr-figure";
import { type CreaturePick } from "../../../components/creature-pick-card";
import { MaturationMeter, type MaturationView } from "../../../components/maturation-meter";
import { GameShell } from "../../../components/game-shell";
import { api } from "../../../lib/api";
import { useGameSession } from "../../../lib/use-game-session";

type CreatureCard = CreaturePick & {
  level: number;
  mutation: string | null;
  canEvolve?: boolean;
  maturation?: MaturationView | null;
  evolutionStatus?: string;
  nextLifeStage?: string | null;
  loci: Array<{ key: string; expressed: string }>;
};

export default function CreaturesPage() {
  const { accessToken } = useGameSession();
  const [rows, setRows] = useState<CreatureCard[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    void api<CreatureCard[]>("/creatures", { accessToken })
      .then((next) => {
        setRows(next);
        setSelectedId((current) => current ?? next[0]?.id ?? null);
      })
      .catch(() => setRows([]));
  }, [accessToken]);

  const selected = rows.find((row) => row.id === selectedId) ?? rows[0];

  return (
    <GameShell
      kicker="Santuário da linhagem"
      title="Coleção"
      subtitle="Cada criatura é um fenótipo único. Toque para ver o chassi despertar."
    >
      {selected ? (
        <div className="gx-collect mb-4 overflow-hidden">
          <div className="gx-collect__stage min-h-[320px]" data-element={String(selected.elementPrimary)}>
            <CreatureGxrFigure
              chassis={selected.chassis}
              element={String(selected.elementPrimary)}
              lifeStage={selected.lifeStage}
              temperament={selected.temperament}
              visualSeed={selected.visualSeed}
              creatureId={selected.id}
              context="PROFILE"
              label={selected.name}
              size={320}
            />
          </div>
          <div className="gx-collect__foot pb-4">
            <p className="gx-collect__name text-2xl">{selected.name}</p>
            <p className="text-sm text-muted">
              {selected.speciesName} · Nv {selected.level} · Gen {selected.generation}
              {selected.mutation ? ` · ${selected.mutation}` : ""}
            </p>
            <MaturationMeter lifeStage={selected.lifeStage} level={selected.level} maturation={selected.maturation} compact />
            <Link
              href={
                selected.revealStatus === "PENDING_VISUAL" || selected.revealStatus === "READY_TO_REVEAL"
                  ? `/game/genesis/${selected.id}`
                  : `/game/creatures/${selected.id}`
              }
              className="mt-3 inline-block text-xs uppercase tracking-[0.16em] text-crystal"
            >
              Abrir ficha
            </Link>
          </div>
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <CreatureCollectCard
            key={row.id}
            creature={row}
            level={row.level}
            selected={row.id === selected?.id}
            onSelect={() => setSelectedId(row.id)}
          />
        ))}
        {rows.length === 0 ? (
          <div className="gx-empty">
            <p>O círculo ainda está vazio. Escolha um starter e a primeira linhagem nasce aqui.</p>
          </div>
        ) : null}
      </div>
    </GameShell>
  );
}
