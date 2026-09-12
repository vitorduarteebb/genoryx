"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { GameShell, Panel } from "../../../components/game-shell";
import "../../../components/battle-arena.css";
import { api } from "../../../lib/api";
import { useGameSession } from "../../../lib/use-game-session";

type QueueRow = { status: string; battleId?: string };
type ArenaMode = "ranked" | "casual" | "adventure";

function ArenaLobby() {
  const router = useRouter();
  const params = useSearchParams();
  const { accessToken, character } = useGameSession();
  const requested = params.get("mode");
  const [mode, setMode] = useState<ArenaMode>(
    requested === "ranked" || requested === "adventure" || requested === "casual" ? requested : "casual",
  );
  const [status, setStatus] = useState("IDLE");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [roster, setRoster] = useState<string[]>([]);
  const [owned, setOwned] = useState<Array<{ id: string; name?: string; speciesKey?: string }>>([]);

  useEffect(() => {
    if (requested === "ranked" || requested === "casual" || requested === "adventure") {
      setMode(requested);
    }
  }, [requested]);

  async function apply(row: QueueRow, redirect = true) {
    setStatus(row.status);
    if (redirect && row.status === "MATCHED" && row.battleId) {
      router.push(`/game/battle/${row.battleId}`);
    }
  }

  async function refresh() {
    if (!accessToken) return;
    try {
      await apply(await api<QueueRow>("/pvp/status", { accessToken }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao ler a fila.");
    }
  }

  useEffect(() => {
    void refresh();
    if (!accessToken) return;
    void api<{ creatures?: Array<{ id: string; name?: string; speciesKey?: string }> } | Array<{ id: string; name?: string }>>("/creatures", { accessToken })
      .then((row) => setOwned(Array.isArray(row) ? row : row.creatures ?? []))
      .catch(() => undefined);
  }, [accessToken]);

  useEffect(() => {
    if (status !== "QUEUED") return;
    const timer = setInterval(() => void refresh(), 2000);
    return () => clearInterval(timer);
  }, [status, accessToken]);

  async function queue() {
    if (!accessToken) return;
    setBusy(true);
    setError(null);
    try {
      await apply(await api<QueueRow>("/pvp/queue", { method: "POST", accessToken, body: mode === "ranked" ? { mode: "RANKED", creatureIds: roster } : { mode: "CASUAL" } }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não entrou na fila.");
    } finally {
      setBusy(false);
    }
  }

  async function leave() {
    if (!accessToken) return;
    setBusy(true);
    setError(null);
    try {
      await apply(await api<QueueRow>("/pvp/leave", { method: "POST", accessToken }), false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não saiu da fila.");
    } finally {
      setBusy(false);
    }
  }

  async function hunt() {
    if (!accessToken) return;
    setBusy(true);
    setError(null);
    try {
      const row = await api<{ battleId: string }>("/battles/wild", { method: "POST", accessToken });
      router.push(`/game/battle/${row.battleId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não abriu o encontro.");
    } finally {
      setBusy(false);
    }
  }

  const label =
    status === "QUEUED" ? "Procurando oponente…" : status === "MATCHED" ? "Partida encontrada." : "Fila casual 1v1. Sem MMR.";

  return (
    <GameShell
      kicker="Prova de sangue"
      title="Arena"
      subtitle="Três caminhos. Ranked testa a linhagem. Casual joga sem pressão. Adventure é o mapa."
      wide
    >
      <div className="gx-lobby">
        <div className="gx-lobby__modes">
          <button type="button" className="gx-lobby__tab" data-active={mode === "ranked"} onClick={() => setMode("ranked")}>
            Ranked
            <small>Climb the ranks</small>
          </button>
          <button type="button" className="gx-lobby__tab" data-active={mode === "casual"} onClick={() => setMode("casual")}>
            Casual
            <small>Play for fun</small>
          </button>
          <button type="button" className="gx-lobby__tab" data-active={mode === "adventure"} onClick={() => setMode("adventure")}>
            Adventure / Career
            <small>Explore GENORYX</small>
          </button>
        </div>

        {mode === "ranked" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Panel>
              <div className="gx-season">
                <div>
                  <p className="gx-page__kicker">Season 1 · S1.V1</p>
                  <h2 className="gx-page__title !text-3xl">Ranked Draft</h2>
                  <p className="mt-2 text-sm text-muted">Squad de 5, ban simultâneo, pick 3. Mesmo Combat Engine do Casual.</p>
                </div>
                <p className="text-gold">{character?.name ?? "Treinador"}</p>
              </div>
              <p className="mt-4 text-muted">Selecione 5 criaturas. Cosméticos de season, sem criatura mais forte por elo.</p>
              <div className="mt-3 grid gap-2">
                {owned.slice(0, 12).map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    className="gx-draft-card"
                    data-on={roster.includes(row.id)}
                    onClick={() =>
                      setRoster((cur) => (cur.includes(row.id) ? cur.filter((id) => id !== row.id) : [...cur, row.id].slice(0, 5)))
                    }
                  >
                    {row.name ?? row.id} {roster.includes(row.id) ? "●" : "○"}
                  </button>
                ))}
              </div>
              {error ? <p className="mt-2 text-ember">{error}</p> : null}
              <div className="mt-5 flex flex-wrap gap-2">
                {status === "QUEUED" ? (
                  <button type="button" disabled={busy} className="gx-cta gx-cta--danger" onClick={() => void leave()}>
                    Sair da fila
                  </button>
                ) : (
                  <button type="button" disabled={busy || roster.length !== 5} className="gx-cta" onClick={() => void queue()}>
                    Entrar no Ranked ({roster.length}/5)
                  </button>
                )}
                <Link href="/game/lab" className="gx-cta gx-cta--ghost">
                  Lab (treino)
                </Link>
              </div>
            </Panel>
            <Panel>
              <p className="gx-page__kicker">Season rewards</p>
              <h2 className="gx-page__title !text-3xl">Cosméticos</h2>
              <p className="mt-3 text-muted">Title, frame, banner e badge. NEX não compra elo nem genes.</p>
            </Panel>
          </div>
        ) : null}

        {mode === "casual" ? (
          <Panel>
            <p className="gx-page__kicker">Casual</p>
            <h2 className="gx-page__title !text-3xl">Duelo</h2>
            <p className="mt-3 text-muted">{label}</p>
            <p className="mt-2 text-sm text-muted">Formação clássica. Sem draft. Sem fusão de tipologia.</p>
            {error ? <p className="mt-2 text-ember">{error}</p> : null}
            <div className="mt-5 flex flex-wrap gap-2">
              {status === "QUEUED" ? (
                <button type="button" disabled={busy} className="gx-cta gx-cta--danger" onClick={() => void leave()}>
                  Sair da fila
                </button>
              ) : status === "MATCHED" ? (
                <button type="button" disabled={busy} className="gx-cta gx-cta--danger" onClick={() => void leave()}>
                  Desistir
                </button>
              ) : (
                <button type="button" disabled={busy || !accessToken} className="gx-cta" onClick={() => void queue()}>
                  Entrar no círculo
                </button>
              )}
            </div>
          </Panel>
        ) : null}

        {mode === "adventure" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Panel>
              <p className="gx-page__kicker">Adventure / Career</p>
              <h2 className="gx-page__title !text-3xl">Explorar GENORYX</h2>
              <p className="mt-3 text-muted">PvE de progresso: encontro selvagem agora, mapa vivo a seguir. A arena já reconhece esse modo.</p>
              {error ? <p className="mt-2 text-ember">{error}</p> : null}
              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" disabled={busy || !accessToken} className="gx-cta" onClick={() => void hunt()}>
                  Caçar no mundo
                </button>
                <Link href="/game-unity" className="gx-cta gx-cta--ghost">
                  Abrir o mapa
                </Link>
              </div>
            </Panel>
            <Panel>
              <p className="gx-page__kicker">Jornada</p>
              <h2 className="gx-page__title !text-3xl">Regiões</h2>
              <p className="mt-3 text-muted">Haven, Verdantis e as provas de sangue. Captura, maturação e carreira no mesmo indivíduo.</p>
            </Panel>
          </div>
        ) : null}
      </div>
    </GameShell>
  );
}

export default function ArenaPage() {
  return (
    <Suspense fallback={<GameShell title="Arena">Abrindo o círculo…</GameShell>}>
      <ArenaLobby />
    </Suspense>
  );
}
