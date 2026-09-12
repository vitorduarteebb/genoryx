"use client";

import { cardElementLabel, geneticCardConfig } from "@nexora/config";
import type { Element } from "@nexora/types";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CreatureGxrFigure } from "../../../components/creature-gxr-figure";
import "../../../components/creature-collect-card.css";
import { type CreaturePick } from "../../../components/creature-pick-card";
import { GameShell } from "../../../components/game-shell";
import { api } from "../../../lib/api";
import { useGameSession } from "../../../lib/use-game-session";
import "./party.css";

const SLOTS = [
  { key: "FRONT", label: "Frente", hint: "Leva o primeiro golpe" },
  { key: "MIDDLE", label: "Meio", hint: "Segura o centro" },
  { key: "BACK", label: "Retaguarda", hint: "Fica protegido" },
] as const;

const LOCK_REASON: Record<string, string> = {
  MARKET: "à venda",
  BATTLE: "em combate",
  BREEDING: "na Lyra",
};

type Status = "idle" | "saving" | "saved" | "error";

function lockReason(row: CreaturePick) {
  if (row.lock && row.lock !== "NONE") {
    return LOCK_REASON[row.lock] ?? "ocupada";
  }
  return null;
}

export default function PartyPage() {
  const { accessToken } = useGameSession();
  const [all, setAll] = useState<CreaturePick[]>([]);
  const [formation, setFormation] = useState<(string | null)[]>([null, null, null]);
  const [focus, setFocus] = useState<number | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [synergies, setSynergies] = useState<Array<{ namePt: string; connections: number }>>([]);
  const [error, setError] = useState<string | null>(null);
  const savedKey = useRef("");

  useEffect(() => {
    if (!accessToken) return;
    void Promise.all([
      api<CreaturePick[]>("/creatures", { accessToken }),
      api<{ creatures: CreaturePick[]; synergies?: Array<{ namePt: string; connections: number }> }>("/party", { accessToken }),
    ]).then(([creatures, party]) => {
      setAll(creatures);
      const next: (string | null)[] = [null, null, null];
      party.creatures.forEach((item, index) => {
        next[index] = item.id;
      });
      setFormation(next);
      savedKey.current = next.filter(Boolean).join(",");
      setStatus(party.creatures.length > 0 ? "saved" : "idle");
      setSynergies(party.synergies ?? []);
    });
  }, [accessToken]);

  const filled = formation.filter(Boolean).length;
  const bench = useMemo(() => {
    const seated = new Set(formation.filter((id): id is string => Boolean(id)));
    return [...all].sort((a, b) => {
      const rank = (row: CreaturePick) => {
        if (seated.has(row.id)) return 2;
        if (lockReason(row)) return 1;
        return 0;
      };
      return rank(a) - rank(b);
    });
  }, [all, formation]);

  function assign(slotIndex: number, creatureId: string) {
    setFormation((current) => {
      const next = [...current] as (string | null)[];
      for (let i = 0; i < next.length; i += 1) {
        if (next[i] === creatureId) {
          next[i] = null;
        }
      }
      next[slotIndex] = creatureId;
      return next;
    });
    setFocus(null);
    setPending(null);
  }

  function clearSlot(slotIndex: number) {
    setFormation((current) => {
      const next = [...current] as (string | null)[];
      next[slotIndex] = null;
      return next;
    });
    setFocus(null);
  }

  function tapSlot(slotIndex: number) {
    if (pending) {
      assign(slotIndex, pending);
      return;
    }
    if (formation[slotIndex]) {
      clearSlot(slotIndex);
      return;
    }
    setFocus((current) => (current === slotIndex ? null : slotIndex));
  }

  function tapBench(row: CreaturePick) {
    if (lockReason(row)) return;
    if (formation.includes(row.id)) {
      const index = formation.findIndex((id) => id === row.id);
      if (index >= 0) clearSlot(index);
      setPending(null);
      return;
    }
    const target = focus ?? formation.findIndex((id) => !id);
    if (target >= 0) {
      assign(target, row.id);
      return;
    }
    setPending(row.id);
  }

  useEffect(() => {
    if (!accessToken) return;
    const ids = formation.filter((id): id is string => Boolean(id));
    const key = ids.join(",");
    if (key === savedKey.current) return;
    if (ids.length === 0) {
      setStatus("idle");
      return;
    }
    const timer = window.setTimeout(() => {
      setStatus("saving");
      setError(null);
      void api<{ creatures: CreaturePick[] }>("/party", {
        method: "PUT",
        accessToken,
        body: { creatureIds: ids },
      })
        .then(() => api<{ creatures: CreaturePick[]; synergies?: Array<{ namePt: string; connections: number }> }>("/party", { accessToken }))
        .then((party) => {
          savedKey.current = key;
          setStatus("saved");
          setSynergies(party.synergies ?? []);
        })
        .catch((err: Error) => {
          setStatus("error");
          setError(err.message);
        });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [accessToken, formation]);

  const statusLabel =
    status === "saving"
      ? "Selando…"
      : status === "saved"
        ? `${filled}/${geneticCardConfig.partyCreatures} no campo`
        : status === "error"
          ? "Não selou"
          : pending
            ? "Toque quem sai"
            : filled === 0
              ? "Vazio"
              : "Toque para completar";

  return (
    <GameShell
      title="Formação"
      header={
        <header className="gx-form__head">
          <div>
            <p className="gx-page__kicker">Quem entra na luta</p>
            <h1 className="gx-form__title">Formação</h1>
            <p className="gx-form__lead">Toque uma criatura para entrar. Toque no palco para tirar.</p>
          </div>
          <p className="gx-form__status" data-state={status}>
            {statusLabel}
          </p>
        </header>
      }
    >
      <section className="gx-form__arena">
        <p className="gx-form__foe">Arena</p>
        <div className="gx-form__line gx-form__line--front">
          <Slot
            slot={SLOTS[0]}
            creature={all.find((row) => row.id === formation[0])}
            focused={focus === 0 || Boolean(pending)}
            onTap={() => tapSlot(0)}
          />
        </div>
        <div className="gx-form__line gx-form__line--rear">
          <Slot
            slot={SLOTS[1]}
            creature={all.find((row) => row.id === formation[1])}
            focused={focus === 1 || Boolean(pending)}
            onTap={() => tapSlot(1)}
          />
          <Slot
            slot={SLOTS[2]}
            creature={all.find((row) => row.id === formation[2])}
            focused={focus === 2 || Boolean(pending)}
            onTap={() => tapSlot(2)}
          />
        </div>
      </section>

      {synergies.length > 0 ? (
        <section className="gx-form__synergy">
          <p className="gx-form__bench-label">Sinergias descobertas</p>
          {synergies.map((row) => (
            <p key={row.namePt}>
              {row.namePt} · {row.connections} {row.connections === 1 ? "ligação" : "ligações"}
            </p>
          ))}
        </section>
      ) : null}

      <p className="gx-form__bench-label">Sua linhagem</p>
      {bench.length === 0 ? (
        <div className="gx-empty">
          <p>Ainda não há criaturas. A linhagem nasce no santuário.</p>
          <Link href="/game/creatures" className="gx-cta mt-3">
            Ir à coleção
          </Link>
        </div>
      ) : (
        <div className="gx-form__bench">
          {bench.map((row) => {
            const locked = lockReason(row);
            const seated = formation.includes(row.id);
            return (
              <button
                key={row.id}
                type="button"
                className="gx-form__unit"
                data-in={seated ? "true" : "false"}
                data-pending={pending === row.id ? "true" : "false"}
                data-locked={locked ? "true" : "false"}
                disabled={Boolean(locked)}
                onClick={() => tapBench(row)}
              >
                <CreatureGxrFigure
                  chassis={row.chassis}
                  element={String(row.elementPrimary)}
                  lifeStage={row.lifeStage}
                  temperament={row.temperament}
                  visualSeed={row.visualSeed}
                  creatureId={row.id}
                  context="MARKET"
                  label={row.name}
                  size={96}
                />
                <p className="gx-form__unit-name">{row.name}</p>
                <p className="gx-form__unit-meta">
                  {locked ?? (seated ? "no campo" : cardElementLabel(String(row.elementPrimary) as Element))}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {error ? <p className="gx-form__error">{error}</p> : null}

      <div className="gx-form__actions">
        <Link href="/game/arena" className="gx-cta" data-disabled={filled === 0 ? "true" : "false"}>
          Ir à arena
        </Link>
        <Link href="/game/deck" className="gx-cta gx-cta--ghost">
          Ver grimório
        </Link>
      </div>
    </GameShell>
  );
}

function Slot({
  slot,
  creature,
  focused,
  onTap,
}: {
  slot: (typeof SLOTS)[number];
  creature?: CreaturePick;
  focused: boolean;
  onTap: () => void;
}) {
  return (
    <button
      type="button"
      className="gx-form__slot"
      data-filled={creature ? "true" : "false"}
      data-focus={focused ? "true" : "false"}
      onClick={onTap}
    >
      <p className="gx-form__role">{slot.label}</p>
      <p className="gx-form__hint">{slot.hint}</p>
      {creature ? (
        <>
          <CreatureGxrFigure
            chassis={creature.chassis}
            element={String(creature.elementPrimary)}
            lifeStage={creature.lifeStage}
            temperament={creature.temperament}
            visualSeed={creature.visualSeed}
            creatureId={creature.id}
            context="BATTLE"
            animationState="BATTLE_IDLE"
            label={creature.name}
            size={slot.key === "FRONT" ? 176 : 132}
          />
          <p className="gx-form__name">{creature.name}</p>
          <span className="gx-form__remove">tirar</span>
        </>
      ) : (
        <span className="gx-form__empty">{focused ? "entra aqui" : "vazio"}</span>
      )}
    </button>
  );
}
