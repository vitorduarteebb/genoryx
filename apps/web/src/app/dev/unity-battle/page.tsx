"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BattleCreature, type BattleCreatureView } from "../../../components/battle-creature";
import "../../../components/battle-arena.css";
import { CardFace } from "../../../components/card-face";
import { bindBattleIntents, loadUnityBattle, sendBattleState } from "../../../lib/unity-battle-bridge";
import type { BattlePresentationState } from "@nexora/game-engine";

type SpeciesRow = {
  speciesKey: string;
  name: string;
  hasWildVisual: boolean;
  visual: {
    renderMode: string;
    portraitUrl: string | null;
    modelUrl: string | null;
    source: string;
    forming?: boolean;
  };
};

type Report = {
  players: { total: number; openaiPortrait: number; mockOnly: number; with3d: number; withoutVisual: number };
  species: Array<{ key: string; name: string; withWildBattleVisual: boolean; renderMode: string; source: string }>;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function unitOf(
  id: string,
  name: string,
  speciesKey: string,
  slot: "FRONT" | "MIDDLE" | "BACK",
  catalog: SpeciesRow[],
  hp: number,
  maxHp: number,
): BattleCreatureView {
  const row = catalog.find((item) => item.speciesKey === speciesKey);
  const portraitUrl = row?.visual.portraitUrl ?? null;
  return {
    id,
    name,
    speciesKey,
    hp,
    maxHp,
    shield: 0,
    slot,
    statuses: [],
    visual: {
      renderMode: row?.visual.renderMode ?? "SILHOUETTE",
      portraitUrl,
      modelUrl: row?.visual.modelUrl ?? null,
      source: row?.visual.source ?? "silhouette",
      forming: row?.visual.forming,
      lifeStage: "BABY",
    },
  };
}

export default function UnityBattlePocPage() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [hostReady, setHostReady] = useState(false);
  const [intent, setIntent] = useState<string>("nenhuma — host JS local");
  const [catalog, setCatalog] = useState<SpeciesRow[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [shot, setShot] = useState<"wide" | "card" | "ultimate">("wide");
  const [selected, setSelected] = useState<string | null>(null);
  const [anims, setAnims] = useState<Record<string, "HIT" | "ATTACK" | "KO">>({});

  useEffect(() => {
    void fetch(`${API_URL}/battle-visuals/species`)
      .then((response) => response.json())
      .then((data: { species: SpeciesRow[] }) => setCatalog(data.species ?? []))
      .catch(() => setCatalog([]));
    void fetch(`${API_URL}/battle-visuals/report`)
      .then((response) => response.json())
      .then(setReport)
      .catch(() => setReport(null));
  }, []);

  const player = useMemo(
    () => [
      unitOf("p-front", "Terranox", "terranox", "FRONT", catalog, 110, 120),
      unitOf("p-mid", "Nympha", "nympha", "MIDDLE", catalog, 70, 70),
      unitOf("p-back", "Florune", "florune", "BACK", catalog, 80, 90),
    ],
    [catalog],
  );
  const enemy = useMemo(
    () => [
      unitOf("e-front", "Terranox", "terranox", "FRONT", catalog, 95, 120),
      unitOf("e-mid", "Florune", "florune", "MIDDLE", catalog, 60, 90),
      unitOf("e-back", "Nympha", "nympha", "BACK", catalog, 70, 70),
    ],
    [catalog],
  );

  const state = useMemo<BattlePresentationState>(
    () => ({
      battleId: "poc-verdantis",
      yourSide: 0,
      yourTurn: true,
      round: 1,
      status: "ACTIVE",
      shot,
      sides: [
        {
          displayName: "Você",
          energy: 3,
          momentum: 0,
          creatures: player.map((unit) => ({
            id: unit.id,
            name: unit.name,
            slot: (unit.slot ?? "FRONT") as "FRONT" | "MIDDLE" | "BACK",
            hp: unit.hp,
            maxHp: unit.maxHp,
            shield: 0,
            statuses: [],
            portraitUrl: unit.visual?.portraitUrl ?? null,
            modelUrl: unit.visual?.modelUrl ?? null,
          })),
        },
        {
          displayName: "Encontro selvagem",
          energy: 3,
          momentum: 0,
          creatures: enemy.map((unit) => ({
            id: unit.id,
            name: unit.name,
            slot: (unit.slot ?? "FRONT") as "FRONT" | "MIDDLE" | "BACK",
            hp: unit.hp,
            maxHp: unit.maxHp,
            shield: 0,
            statuses: [],
            portraitUrl: unit.visual?.portraitUrl ?? null,
            modelUrl: unit.visual?.modelUrl ?? null,
          })),
        },
      ],
      events: [],
    }),
    [enemy, player, shot],
  );

  useEffect(() => {
    const off = bindBattleIntents((next) => setIntent(JSON.stringify(next)));
    const node = canvas.current;
    if (!node) {
      return off;
    }
    void loadUnityBattle(node).then((host) => {
      setHostReady(Boolean(host));
      if (host) {
        sendBattleState(host, state);
      }
    });
    return off;
  }, [state]);

  function slot(units: BattleCreatureView[], key: "FRONT" | "MIDDLE" | "BACK", area: string, foe: boolean) {
    const unit = units.find((item) => item.slot === key);
    return (
      <div className="gx-arena__slot" data-area={area}>
        {unit ? (
          <BattleCreature
            unit={unit}
            foe={foe}
            target={selected && foe ? "valid" : selected && !foe ? "invalid" : null}
            anim={anims[unit.id]}
            onSelect={() => {
              if (!selected || !foe) {
                return;
              }
              setAnims({ [unit.id]: "HIT", [selected]: "ATTACK" });
              setIntent(JSON.stringify({ type: "PLAY_CARD", cardInstanceId: "vine_tap", targetId: unit.id }));
              setSelected(null);
              setShot("wide");
            }}
            onHover={() => undefined}
          />
        ) : null}
      </div>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 px-4 py-6">
      <p className="text-[11px] uppercase tracking-[0.22em] text-crystal">DEV · Unity Battle Arena</p>
      <h1 className="font-display text-3xl text-gold">Verdantis — prova de formação</h1>
      <p className="text-sm text-muted">
        Unity não calcula gameplay. Sem WebGL, o host React mostra os mesmos 6 slots e os retratos de espécie. Flag{" "}
        <code>BATTLE_RENDERER</code> continua <code>web</code> até aprovação.
      </p>
      <div className="flex flex-wrap gap-2 text-xs">
        {(["wide", "card", "ultimate"] as const).map((value) => (
          <button
            key={value}
            type="button"
            className={shot === value ? "text-gold" : "text-muted"}
            onClick={() => setShot(value)}
          >
            câmera {value}
          </button>
        ))}
      </div>
      <section className="gx-arena" data-shot={shot}>
        <div className="gx-arena__vs">
          <span>Terranox selvagem</span>
          <span>vs</span>
          <span>Você</span>
        </div>
        <div className="gx-arena__field" data-formation="linear">
          {slot(enemy, "BACK", "e-back", true)}
          {slot(enemy, "MIDDLE", "e-mid", true)}
          {slot(enemy, "FRONT", "e-front", true)}
          <div className="gx-arena__core" />
          {slot(player, "FRONT", "p-front", false)}
          {slot(player, "MIDDLE", "p-mid", false)}
          {slot(player, "BACK", "p-back", false)}
        </div>
      </section>
      <canvas ref={canvas} className="hidden h-0 w-0" />
      {hostReady ? <p className="text-crystal">Unity WebGL conectado.</p> : null}
      <div className="gx-arena__hand">
        <CardFace cardKey="vine_tap" state={selected === "p-right" ? "SELECTED" : "SELECTABLE"} onPlay={() => { setSelected("p-right"); setShot("card"); }} />
        <CardFace cardKey="bark_guard" />
        <CardFace cardKey="sunpetal" />
      </div>
      <p className="text-xs text-muted">Última intenção: {intent}</p>
      {report ? (
        <section className="rounded-2xl border border-[#2a2438] p-4 text-sm">
          <h2 className="font-display text-xl text-gold">Diagnóstico de assets</h2>
          <p className="mt-2 text-muted">
            Criaturas: {report.players.total} · OpenAI {report.players.openaiPortrait} · mock {report.players.mockOnly} · 3D{" "}
            {report.players.with3d} · sem visual {report.players.withoutVisual}
          </p>
          <ul className="mt-3 grid gap-1 text-xs text-muted sm:grid-cols-2">
            {report.species.map((row) => (
              <li key={row.key}>
                {row.name}: {row.withWildBattleVisual ? row.renderMode : "sem wild visual"}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
