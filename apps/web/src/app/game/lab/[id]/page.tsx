"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CreatureGxrFigure } from "../../../../components/creature-gxr-figure";
import { GameShell } from "../../../../components/game-shell";
import { api } from "../../../../lib/api";
import { useGameSession } from "../../../../lib/use-game-session";
import { LabCreatureCard, type LabCreature } from "../lab-creature";
import "../lab.css";

type LabView = {
  kind?: string;
  battleId: string;
  phase: string;
  ruleset?: string;
  foeRoster: LabCreature[];
  yourRoster: LabCreature[];
  bannedByYou?: string | null;
  bannedByFoe?: string | null;
  selected: string[];
  benched: string | null;
  formation: { FRONT?: string; MIDDLE?: string; BACK?: string };
  state?: { rulesVersion?: string; status?: string };
};

const SLOTS = [
  { key: "FRONT", label: "Frente", hint: "Leva o primeiro golpe" },
  { key: "MIDDLE", label: "Meio", hint: "Segura o centro" },
  { key: "BACK", label: "Retaguarda", hint: "Fica protegido" },
] as const;

function seatOf(selected: string[], current: LabView["formation"]): LabView["formation"] {
  if (current.FRONT && current.MIDDLE && current.BACK) {
    return current;
  }
  if (selected.length !== 3) {
    return current;
  }
  return {
    FRONT: current.FRONT ?? selected[0],
    MIDDLE: current.MIDDLE ?? selected[1],
    BACK: current.BACK ?? selected[2],
  };
}

export default function LabDraftPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { accessToken } = useGameSession();
  const [view, setView] = useState<LabView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [formation, setFormation] = useState<LabView["formation"]>({});
  const [placing, setPlacing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    if (!accessToken || !id) return;
    const payload = await api<LabView>(`/battles/lab/${id}`, { accessToken });
    if (!payload.kind && payload.state?.status === "ACTIVE") {
      router.replace(`/game/battle/${id}`);
      return;
    }
    setView(payload);
    setFormation(seatOf(payload.selected ?? [], payload.formation ?? {}));
    if (payload.selected?.length) {
      setPicked(payload.selected);
    }
  }

  useEffect(() => {
    void refresh().catch((err: unknown) => setError(err instanceof Error ? err.message : "Falha."));
  }, [accessToken, id]);

  async function act(body: Record<string, unknown>) {
    if (!accessToken || !id || busy) return;
    setError(null);
    setBusy(true);
    try {
      const payload = await api<LabView>(`/battles/lab/${id}/draft`, { method: "POST", accessToken, body });
      if (payload.state?.status === "ACTIVE" || (!payload.kind && payload.battleId)) {
        router.replace(`/game/battle/${id}`);
        return;
      }
      setView(payload);
      setFormation(seatOf(payload.selected ?? [], payload.formation ?? {}));
      if (payload.selected?.length) {
        setPicked(payload.selected);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ação recusada.");
    } finally {
      setBusy(false);
    }
  }

  if (!view) {
    return <GameShell title="Laboratório">Preparando o draft…</GameShell>;
  }

  const leftovers = view.yourRoster.filter((row) => !row.banned);
  const ready = Boolean(formation.FRONT && formation.MIDDLE && formation.BACK);

  function place(slot: "FRONT" | "MIDDLE" | "BACK") {
    if (!placing) {
      if (formation[slot]) {
        setFormation((prev) => ({ ...prev, [slot]: undefined }));
      }
      return;
    }
    setFormation((prev) => {
      const next = { ...prev };
      for (const key of SLOTS) {
        if (next[key.key] === placing) {
          next[key.key] = undefined;
        }
      }
      next[slot] = placing;
      return next;
    });
    setPlacing(null);
  }

  return (
    <GameShell title="Laboratório" subtitle="Banir · escolher 3 · formar" wide>
      {error ? <p className="text-ember">{error}</p> : null}

      {view.phase === "BAN_PHASE" ? (
        <div className="space-y-10">
          <section className="gx-lab__section">
            <p className="gx-lab__kicker">Seu roster</p>
            <h2 className="gx-lab__title">Elas já estão no recinto</h2>
            <p className="gx-lab__lead">
              {view.bannedByFoe ? "O rival já baniu uma das suas." : "O rival ainda escolhe quem tira do seu lado."}
            </p>
            <div className="gx-lab__grid" data-cols="5">
              {view.yourRoster.map((row) => (
                <LabCreatureCard key={row.creatureId} row={row} banned={row.banned} />
              ))}
            </div>
          </section>
          <section className="gx-lab__section">
            <p className="gx-lab__kicker">Rival</p>
            <h2 className="gx-lab__title">Toque para banir uma</h2>
            <p className="gx-lab__lead">Ela não entra no pick. Uma só.</p>
            <div className="gx-lab__grid" data-cols="5">
              {view.foeRoster.map((row) => (
                <LabCreatureCard
                  key={row.creatureId}
                  row={row}
                  banned={row.banned}
                  onClick={row.banned || busy ? undefined : () => void act({ type: "BAN_CREATURE", creatureId: row.creatureId })}
                />
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {view.phase === "PICK_PHASE" ? (
        <section className="gx-lab__section">
          <p className="gx-lab__kicker">Pick</p>
          <h2 className="gx-lab__title">Escolha três</h2>
          <p className="gx-lab__lead">A quarta fica de fora. Toque para marcar.</p>
          <p className="gx-lab__count">{picked.length}/3</p>
          <div className="gx-lab__grid">
            {leftovers.map((row) => {
              const on = picked.includes(row.creatureId);
              return (
                <LabCreatureCard
                  key={row.creatureId}
                  row={row}
                  on={on}
                  onClick={() =>
                    setPicked((current) =>
                      on ? current.filter((id) => id !== row.creatureId) : current.length < 3 ? [...current, row.creatureId] : current,
                    )
                  }
                />
              );
            })}
          </div>
          <div className="gx-lab__actions">
            <button
              type="button"
              disabled={picked.length !== 3 || busy}
              className="gx-lab__ready"
              onClick={() => void act({ type: "SELECT_ACTIVE_CREATURES", creatureIds: picked })}
            >
              Confirmar três
            </button>
          </div>
        </section>
      ) : null}

      {view.phase === "FORMATION_PHASE" ? (
        <section className="gx-lab__section">
          <p className="gx-lab__kicker">Formação</p>
          <h2 className="gx-lab__title">Ponha as três no campo</h2>
          <p className="gx-lab__lead">Toque numa criatura e depois no lugar. Ou só aperte Pronto — já sentamos as três.</p>
          <div className="gx-lab__field">
            <div className="gx-lab__lane" data-row="front">
              <LabSlot
                slot={SLOTS[0]}
                creature={view.yourRoster.find((row) => row.creatureId === formation.FRONT)}
                focused={placing !== null}
                onTap={() => place("FRONT")}
              />
            </div>
            <div className="gx-lab__lane">
              <LabSlot
                slot={SLOTS[1]}
                creature={view.yourRoster.find((row) => row.creatureId === formation.MIDDLE)}
                focused={placing !== null}
                onTap={() => place("MIDDLE")}
              />
              <LabSlot
                slot={SLOTS[2]}
                creature={view.yourRoster.find((row) => row.creatureId === formation.BACK)}
                focused={placing !== null}
                onTap={() => place("BACK")}
              />
            </div>
          </div>
          <div className="gx-lab__grid">
            {view.yourRoster
              .filter((row) => row.selected)
              .map((row) => (
                <LabCreatureCard
                  key={row.creatureId}
                  row={row}
                  on={placing === row.creatureId || Object.values(formation).includes(row.creatureId)}
                  mark={placing === row.creatureId ? "entra" : undefined}
                  onClick={() => setPlacing((current) => (current === row.creatureId ? null : row.creatureId))}
                />
              ))}
          </div>
          <div className="gx-lab__actions">
            <button
              type="button"
              disabled={!ready || busy}
              className="gx-lab__ready"
              onClick={() => void act({ type: "SET_FORMATION", formation })}
            >
              {busy ? "Abrindo…" : "Pronto"}
            </button>
          </div>
        </section>
      ) : null}

      {view.phase === "READY" ? <p>Abrindo o campo…</p> : null}
    </GameShell>
  );
}

function LabSlot({
  slot,
  creature,
  focused,
  onTap,
}: {
  slot: (typeof SLOTS)[number];
  creature?: LabCreature;
  focused: boolean;
  onTap: () => void;
}) {
  return (
    <button type="button" className="gx-lab__slot" data-filled={creature ? "true" : "false"} data-focus={focused ? "true" : "false"} onClick={onTap}>
      <p className="gx-lab__meta">
        {slot.label} · {slot.hint}
      </p>
      {creature ? (
        <CreatureGxrFigure
          chassis={creature.chassis}
          element={creature.element}
          lifeStage={creature.lifeStage}
          temperament={creature.temperament}
          visualSeed={creature.visualSeed}
          creatureId={creature.creatureId}
          context="BATTLE"
          animationState="BATTLE_IDLE"
          label={creature.name}
          size={slot.key === "FRONT" ? 168 : 132}
        />
      ) : (
        <span className="gx-lab__meta">{focused ? "entra aqui" : "vazio"}</span>
      )}
    </button>
  );
}
