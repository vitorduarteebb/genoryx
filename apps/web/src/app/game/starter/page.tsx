"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreatureCollectCard } from "../../../components/creature-collect-card";
import { GameShell } from "../../../components/game-shell";
import { api } from "../../../lib/api";
import { useGameSession } from "../../../lib/use-game-session";

const starters = [
  { key: "pyron", name: "Pyron", element: "Fogo", elementKey: "FIRE", body: "QUADRUPED", head: "DRACONIC" },
  { key: "nympha", name: "Nympha", element: "Água", elementKey: "WATER", body: "AMPHIBIAN", head: "SERPENT" },
  { key: "florune", name: "Florune", element: "Natureza", elementKey: "NATURE", body: "BIPED", head: "EXOTIC" },
] as const;

export default function StarterPage() {
  const router = useRouter();
  const { accessToken, character } = useGameSession();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(speciesKey: string) {
    if (!accessToken) return;
    setPending(speciesKey);
    setError(null);
    try {
      await api("/creatures/starter", { method: "POST", accessToken, body: { speciesKey } });
      await api("/quests/first-spark/complete", { method: "POST", accessToken }).catch(() => undefined);
      router.replace("/game/creatures");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar starter.");
    } finally {
      setPending(null);
    }
  }

  return (
    <GameShell
      kicker="Primeiro vínculo"
      title="Starter"
      subtitle="Uma escolha. O servidor entrega três criaturas — prontas para a Arena e para a Lyra."
    >
      {character?.starterChosen ? <p className="text-crystal">Starter já escolhido.</p> : null}
      <div className="grid gap-4 md:grid-cols-3">
        {starters.map((row) => (
          <div key={row.key} className="space-y-3">
            <CreatureCollectCard
              creature={{
                id: row.key,
                name: row.name,
                speciesName: row.name,
                gender: "MALE",
                fertility: 5,
                generation: 0,
                bodyPlan: row.body,
                head: row.head,
                elementPrimary: row.elementKey,
              }}
            />
            <button
              type="button"
              disabled={Boolean(pending) || Boolean(character?.starterChosen)}
              onClick={() => void choose(row.key)}
              className="w-full rounded-xl border border-gold/40 px-3 py-2 text-gold disabled:opacity-40"
            >
              {pending === row.key ? "Gerando…" : "Escolher"}
            </button>
          </div>
        ))}
      </div>
      {error ? <p className="text-ember">{error}</p> : null}
    </GameShell>
  );
}
