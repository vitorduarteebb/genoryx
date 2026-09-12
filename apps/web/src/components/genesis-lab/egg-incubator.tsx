"use client";

import { EggCard } from "./egg-card";
import type { GenesisEgg } from "./types";

export function EggIncubator({
  eggs,
  onHatch,
  busy,
}: {
  eggs: GenesisEgg[];
  onHatch: (id: string) => void;
  busy?: boolean;
}) {
  const active = eggs.filter((egg) => egg.status !== "HATCHED");
  return (
    <section>
      <h2 className="mb-3 font-display text-2xl text-gold">Genesis Incubator</h2>
      {active.length === 0 ? <p className="text-sm text-muted">Nenhum ovo em incubação.</p> : null}
      <div className="grid gap-3 md:grid-cols-3">
        {active.map((egg) => (
          <EggCard
            key={egg.eggId}
            egg={egg}
            startedAt={egg.incubationStartedAt}
            busy={busy}
            onHatch={() => onHatch(egg.eggId)}
          />
        ))}
      </div>
    </section>
  );
}
