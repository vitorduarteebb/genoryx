"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ChassisView } from "@nexora/config";
import { CreatureGxrFigure } from "../../../components/creature-gxr-figure";
import { GameShell, Panel } from "../../../components/game-shell";
import { MaturationMeter, type MaturationView } from "../../../components/maturation-meter";
import "../../../components/evolution/evolution-reveal.css";
import { stageLabel } from "../../../lib/creature-lexicon";
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
  chassis?: ChassisView | null;
  bodyPlan?: string | null;
  elementPrimary?: string | null;
  temperament?: string | null;
  visualSeed?: string | null;
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
      title="Despertar"
      subtitle="O indivíduo cresce. O DNA não muda. Aqui se confirma a passagem para jovem ou para a forma adulta."
    >
      <div className="gx-chamber-grid">
        {items.map((row) => (
          <Panel key={row.creatureId}>
            <div className="gx-chamber-card">
              <div className="gx-chamber-card__art">
                {row.chassis ? (
                  <CreatureGxrFigure
                    chassis={row.chassis}
                    bodyPlan={row.bodyPlan}
                    creatureId={row.creatureId}
                    lifeStage={row.nextLifeStage ?? row.lifeStage}
                    temperament={row.temperament}
                    visualSeed={row.visualSeed}
                    element={row.elementPrimary}
                    size={280}
                    animationState="IDLE"
                    label={`${row.name} após o Despertar`}
                  />
                ) : null}
              </div>
              <div>
                <p className="gx-page__kicker">{row.speciesName}</p>
                <h2 className="gx-page__title !text-3xl">{row.name}</h2>
                <p className="mt-2 text-sm text-muted">
                  {stageLabel(row.lifeStage)} → {stageLabel(row.nextLifeStage)} · nível {row.level}
                </p>
                <MaturationMeter lifeStage={row.lifeStage} level={row.level} maturation={row.maturation} />
                <Link href={`/game/evolution/${row.creatureId}`} className="gx-cta mt-4">
                  {row.nextLifeStage === "ADULT" ? "Despertar forma adulta" : "Despertar"}
                </Link>
              </div>
            </div>
          </Panel>
        ))}
        {items.length === 0 ? (
          <div className="gx-empty">
            <p>Nenhuma criatura pronta. Leve o filhote à Arena até o círculo acender — jovem no 10, adulta no 20, com a maturação fechada.</p>
          </div>
        ) : null}
      </div>
    </GameShell>
  );
}
