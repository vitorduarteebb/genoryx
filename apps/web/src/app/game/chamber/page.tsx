"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GameShell, Panel } from "../../../components/game-shell";
import { MaturationMeter, type MaturationView } from "../../../components/maturation-meter";
import { api } from "../../../lib/api";
import { useGameSession } from "../../../lib/use-game-session";

type QueueItem = {
  creatureId: string;
  name: string;
  speciesName: string;
  lifeStage: string;
  nextLifeStage: string | null;
  level: number;
  maturation?: MaturationView | null;
};

export default function GenesisChamberPage() {
  const { accessToken } = useGameSession();
  const [items, setItems] = useState<QueueItem[]>([]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    void api<{ items: QueueItem[] }>("/creatures/evolution-queue", { accessToken })
      .then((next) => setItems(next.items ?? []))
      .catch(() => setItems([]));
  }, [accessToken]);

  return (
    <GameShell
      kicker="Círculo Genesis"
      title="Câmara"
      subtitle="O indivíduo cresce. O DNA não muda. Aqui só se confirma o que a prova já despertou."
    >
      <div className="grid gap-3">
        {items.map((row) => (
          <Panel key={row.creatureId}>
            <p className="gx-page__kicker">{row.speciesName}</p>
            <h2 className="gx-page__title !text-3xl">{row.name}</h2>
            <p className="mt-2 text-sm text-muted">
              {row.lifeStage} → {row.nextLifeStage} · nível {row.level}
            </p>
            <MaturationMeter lifeStage={row.lifeStage} level={row.level} maturation={row.maturation} />
            <Link href={`/game/evolution/${row.creatureId}`} className="gx-cta mt-4">
              Despertar
            </Link>
          </Panel>
        ))}
        {items.length === 0 ? (
          <div className="gx-empty">
            <p>Nenhuma criatura pronta. Leve o filhote à Arena até o círculo acender.</p>
          </div>
        ) : null}
      </div>
    </GameShell>
  );
}
