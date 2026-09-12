"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EvolutionReveal, type EvolutionPayload } from "../../../../components/evolution/evolution-reveal";
import { GameShell } from "../../../../components/game-shell";
import { api } from "../../../../lib/api";
import { useGameSession } from "../../../../lib/use-game-session";

export default function EvolutionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { accessToken } = useGameSession();
  const [payload, setPayload] = useState<EvolutionPayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !id) {
      return;
    }
    void api<EvolutionPayload>(`/creatures/${id}/evolution`, { accessToken }).then(setPayload);
  }, [accessToken, id]);

  async function evolve() {
    if (!accessToken || !id) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const next = await api<EvolutionPayload>(`/creatures/${id}/evolve`, { method: "POST", accessToken, body: {} });
      setPayload(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível evoluir.");
    } finally {
      setBusy(false);
    }
  }

  if (!payload) {
    return <GameShell title="Evolução">Carregando…</GameShell>;
  }

  return (
    <GameShell title="Evolução" wide>
      <EvolutionReveal payload={payload} onEvolve={evolve} busy={busy} error={error} />
      <div className="mt-6 flex gap-3 text-sm">
        <Link href={`/game/creatures/${id}`} className="text-crystal">
          Voltar à ficha
        </Link>
        <button type="button" className="text-gold" onClick={() => router.push("/game/creatures")}>
          Coleção
        </button>
      </div>
    </GameShell>
  );
}
