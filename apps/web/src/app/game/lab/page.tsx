"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GameShell } from "../../../components/game-shell";
import { api } from "../../../lib/api";
import { useGameSession } from "../../../lib/use-game-session";
import { LabCreatureCard, type LabCreature } from "./lab-creature";
import "./lab.css";

export default function LabRosterPage() {
  const router = useRouter();
  const { accessToken } = useGameSession();
  const [rows, setRows] = useState<LabCreature[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    void api<{ creatures: LabCreature[]; activeDraftId?: string | null; activeBattleId?: string | null }>(
      "/battles/lab/catalog",
      { accessToken },
    )
      .then((payload) => {
        setRows(payload.creatures);
        setDraftId(payload.activeDraftId ?? payload.activeBattleId ?? null);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Falha no catálogo."));
  }, [accessToken]);

  function toggle(id: string) {
    const row = rows.find((item) => item.creatureId === id);
    if (row?.locked) return;
    setPicked((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }
      if (current.length >= 5) {
        return current;
      }
      return [...current, id];
    });
  }

  async function lock() {
    if (!accessToken || picked.length !== 5) return;
    setBusy(true);
    setError(null);
    try {
      const session = await api<{ battleId: string }>("/battles/lab", {
        method: "POST",
        accessToken,
        body: { creatureIds: picked },
      });
      router.push(`/game/lab/${session.battleId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não trancou o roster.");
    } finally {
      setBusy(false);
    }
  }

  const usable = rows.filter((row) => !row.locked);

  return (
    <GameShell title="Laboratório" subtitle="Cinco criaturas suas. Depois ban, pick e formação." wide>
      <p className="gx-lab__count">
        Escolha 5 · {picked.length}/5
        {usable.length < rows.length ? ` · ${usable.length} livres` : ""}
      </p>
      {draftId ? (
        <button type="button" className="text-crystal" onClick={() => router.push(`/game/lab/${draftId}`)}>
          Retomar prova em andamento
        </button>
      ) : null}
      {error ? <p className="text-ember">{error}</p> : null}
      <div className="gx-lab__grid" data-cols="5">
        {rows.map((row) => {
          const on = picked.includes(row.creatureId);
          return (
            <LabCreatureCard
              key={row.creatureId}
              row={row}
              on={on}
              size={150}
              onClick={row.locked ? undefined : () => toggle(row.creatureId)}
            />
          );
        })}
      </div>
      {rows.length === 0 ? (
        <p className="mt-4 text-muted">Nenhuma criatura na linhagem. Escolha um starter primeiro.</p>
      ) : usable.length < 5 ? (
        <p className="mt-4 text-muted">
          Precisa de 5 livres. As apagadas estão em combate, à venda ou na Lyra.
        </p>
      ) : null}
      <div className="gx-lab__actions">
        <button type="button" disabled={busy || picked.length !== 5} className="gx-lab__ready" onClick={() => void lock()}>
          Trancar roster
        </button>
      </div>
    </GameShell>
  );
}
