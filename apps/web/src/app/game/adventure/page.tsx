"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { GameShell } from "../../../components/game-shell";
import { type CreaturePick } from "../../../components/creature-pick-card";
import { api } from "../../../lib/api";
import { emberBabyChassis } from "../../../lib/adventure-chassis";
import { readAdventureReturn, saveAdventureReturn } from "../../../lib/adventure-return";
import {
  createAdventureWorld,
  type AdventureHudState,
  type AdventureInteractable,
  type AdventureWorld,
} from "../../../lib/adventure-world";
import type { CreatureVisualInput } from "../../../lib/creature-visual-contract";
import { useGameSession } from "../../../lib/use-game-session";
import { WorldCompactHeader } from "../../../lib/world-art/world-compact-header";
import "./adventure.css";
import "../../../lib/world-art/world-art-hud.css";

function companionInput(row?: CreaturePick | null): CreatureVisualInput {
  return {
    chassis: row?.chassis ?? emberBabyChassis(),
    lifeStage: row?.lifeStage ?? "BABY",
    element: typeof row?.elementPrimary === "string" ? row.elementPrimary : "FIRE",
    temperament: row?.temperament,
    visualSeed: row?.visualSeed,
    creatureId: row?.id ?? "world-companion",
    bodyPlan: row?.bodyPlan,
    context: "WORLD",
  };
}

function AdventureStage() {
  const router = useRouter();
  const params = useSearchParams();
  const { accessToken, character } = useGameSession();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mapRef = useRef<HTMLCanvasElement | null>(null);
  const worldRef = useRef<AdventureWorld | null>(null);
  const [hud, setHud] = useState<AdventureHudState | null>(null);
  const [sheet, setSheet] = useState<AdventureInteractable | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !accessToken || !character) return;
    let dead = false;
    const returned = params.get("return") === "1" ? readAdventureReturn() : null;

    void Promise.all([
      api<{ creatures: CreaturePick[] }>("/party", { accessToken }).catch(() => ({ creatures: [] as CreaturePick[] })),
      api<CreaturePick[]>("/creatures", { accessToken }).catch(() => [] as CreaturePick[]),
    ]).then(([party, owned]) => {
      if (dead || !canvasRef.current) return;
      const lead = party.creatures[0] ?? owned[0] ?? null;
      const world = createAdventureWorld(canvasRef.current, {
        companion: companionInput(lead),
        appearance: character.appearance,
        startArea: returned?.area,
        startAt: returned ? { x: returned.x, z: returned.z } : undefined,
        wildGone: Boolean(returned?.wildGone),
        onHud: setHud,
        onToast: setToast,
        minimap: mapRef.current,
      });
      worldRef.current = world;
      if (returned?.toast) setToast(returned.toast);
    });

    return () => {
      dead = true;
      worldRef.current?.dispose();
      worldRef.current = null;
    };
  }, [accessToken, params, character?.id, JSON.stringify(character?.appearance)]);

  function open(item: AdventureInteractable | null) {
    if (!item) return;
    if (item.kind === "exit" && item.payload) {
      worldRef.current?.travel(item.payload === "verdantis" ? "verdantis" : "haven");
      setSheet(null);
      setPendingId(null);
      return;
    }
    setSheet(item);
    setPendingId(null);
  }

  useEffect(() => {
    if (!pendingId || !hud?.nearby || hud.nearby.id !== pendingId) return;
    if (hud.nearby.kind === "poi") return;
    open(hud.nearby);
  }, [hud?.nearby, pendingId]);

  function enterPlace(x: number, z: number) {
    worldRef.current?.enterAt(x, z);
    setSheet(null);
    setPendingId(null);
    setMapOpen(false);
  }

  function onPointer(event: React.PointerEvent<HTMLCanvasElement>) {
    if (sheet) return;
    const tapped = worldRef.current?.tap(event.clientX, event.clientY) ?? null;
    setPendingId(tapped?.id ?? null);
    if (tapped && hud?.nearby?.id === tapped.id) open(tapped);
  }

  async function fight() {
    if (!accessToken || !worldRef.current) return;
    setBusy(true);
    setError(null);
    const snap = worldRef.current.snapshot();
    saveAdventureReturn({
      area: snap.area,
      x: snap.x,
      z: snap.z,
      wildGone: sheet?.kind === "wild",
      toast: "O encontro terminou. A trilha continua.",
    });
    try {
      const row = await api<{ battleId: string }>("/battles/wild", { method: "POST", accessToken, body: {zoneId:sheet?.zoneId} });
      router.push(`/game/battle/${row.battleId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não abriu o encontro.");
      setBusy(false);
    }
  }

  const nearby = hud?.nearby ?? null;
  const [regionKicker, regionName] = (hud?.region ?? "Haven · Genesis Plaza").split(" · ");

  return (
    <GameShell title="Mundo" world>
      <div className="gx-adv">
        <WorldCompactHeader onMenu={() => setMenuOpen((value) => !value)} />
        <canvas ref={canvasRef} className="gx-adv__stage" onPointerDown={onPointer} />
        <button
          type="button"
          className="gx-adv__region"
          data-region={regionKicker?.toUpperCase() ?? "HAVEN"}
          onClick={() => {
            const place = worldRef.current?.places().find((row) => row.id === "haven.plaza" || row.id === "verdantis.road");
            if (place) enterPlace(place.x, place.z);
          }}
        >
          {regionName ?? hud?.region ?? "Genesis Plaza"}
        </button>
        <div className="gx-adv__mapdock">
          <button
            type="button"
            className={`gx-adv__map${mapOpen ? " is-open" : ""}`}
            onClick={() => setMapOpen((value) => !value)}
            aria-label="Mapa"
            aria-expanded={mapOpen}
          >
            <span>Mapa</span>
            <canvas
              ref={mapRef}
              width={200}
              height={200}
              onClick={(event) => {
                if (!mapOpen) return;
                event.stopPropagation();
                const point = worldRef.current?.pointFromMinimap(event.clientX, event.clientY);
                if (point) enterPlace(point.x, point.z);
              }}
            />
          </button>
          {mapOpen ? (
            <div className="gx-adv__places">
              {(worldRef.current?.places() ?? []).map((place) => (
                <button key={place.id} type="button" onClick={() => enterPlace(place.x, place.z)}>
                  {place.name}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="gx-adv__fps" hidden={!hud?.metrics}>
          {hud?.metrics ? `${hud.metrics.fps} fps · ${hud.metrics.avatar}` : ""}
        </div>
        {!hud ? <div className="gx-adv__boot">Abrindo Haven…</div> : null}
        {toast ? <div className="gx-adv__toast">{toast}</div> : null}
        {nearby && !sheet ? (
          <div className="gx-adv__prompt">
            <strong>{nearby.name}</strong>
            {nearby.prompt}
          </div>
        ) : null}
        {sheet ? (
          <div className="gx-adv__sheet" data-kind={sheet.kind}>
            <h2>{(sheet.kind === "wild" || sheet.kind === "captureZone") && !sheet.name ? "Criatura desconhecida" : sheet.name}</h2>
            {(sheet.kind === "wild" || sheet.kind === "captureZone") ? (
              <div className="gx-adv__meta">
                <span>Perigo {sheet.danger ?? "médio"}</span>
                <span>{sheet.temperament ?? sheet.payload ?? "selvagem"}</span>
                <span>{sheet.element ?? "elemento oculto"}</span>
              </div>
            ) : null}
            <p>{sheet.body}</p>
            <div className="gx-adv__actions">
              {(sheet.kind === "wild" || sheet.kind === "captureZone") ? (
                <>
                  <button type="button" onClick={() => setSheet({ ...sheet, body: "Ela observa você de volta. Ainda não foge." })}>
                    Observar
                  </button>
                  <button type="button" disabled={busy} onClick={() => void fight()}>
                    {sheet.kind === "captureZone" ? "Buscar encontro" : "Enfrentar"}
                  </button>
                  <button type="button" onClick={() => setSheet(null)}>
                    Deixar
                  </button>
                </>
              ) : (
                <>
                  {sheet.kind === "exit" ? (
                    <button type="button" onClick={() => open(sheet)}>
                      Atravessar
                    </button>
                  ) : null}
                  {sheet.kind === "poi" ? (
                    <button type="button" onClick={() => enterPlace(sheet.x, sheet.z)}>
                      Entrar
                    </button>
                  ) : null}
                  <button type="button" onClick={() => setSheet(null)}>
                    Fechar
                  </button>
                </>
              )}
            </div>
            {error ? <p>{error}</p> : null}
          </div>
        ) : null}
        {menuOpen ? (
          <div className="gx-adv__menu">
            <Link href="/game/party">Party</Link>
            <Link href="/game/inventory">Bag</Link>
          <Link href="/game/appearance">Aparência</Link>
            <Link href="/game/creatures">Codex</Link>
            <Link href="/game" onClick={() => setMenuOpen(false)}>
              Sair do mundo
            </Link>
          </div>
        ) : null}
        <nav className="gx-adv__dock">
          <Link href="/game/party">Party</Link>
          <Link href="/game/inventory">Bag</Link>
          <Link href="/game/appearance">Aparência</Link>
          <Link href="/game/creatures">Codex</Link>
          <Link href="/game/arena?mode=adventure">Map</Link>
        </nav>
      </div>
    </GameShell>
  );
}

export default function AdventurePage() {
  return (
    <Suspense fallback={<GameShell title="Mundo" world>Abrindo o mundo…</GameShell>}>
      <AdventureStage />
    </Suspense>
  );
}
