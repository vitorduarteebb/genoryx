"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { resourcePlayGate } from "@nexora/config";
import { BattleCreature, type BattleCreatureView } from "../../../../components/battle-creature";
import "../../../../components/battle-arena.css";
import { CardFace } from "../../../../components/card-face";
import { GameShell } from "../../../../components/game-shell";
import type { GeneticCardState } from "../../../../lib/card-chrome";
import type { CreatureVisualState } from "../../../../lib/creature-visual-contract";
import { api } from "../../../../lib/api";
import { useGameSession } from "../../../../lib/use-game-session";

type HandCard = {
  instanceId: string;
  definitionKey: string;
  name?: string;
  cost: number;
  locus?: string | null;
  type?: string;
  typeLabel?: string;
  element?: string;
  text?: string;
  description?: string;
  tags?: string[];
  targetType?: "SELF" | "ALLY" | "ENEMY" | "ALL_ENEMIES" | "ALL_ALLIES";
  artUrl?: string | null;
  imageHash?: string | null;
  sourceCreature?: string;
  sourceCreatureId?: string;
  sourceTypology?: string;
  effects?: Array<{
    op: string;
    value?: number;
    resource?: string;
    condition?: { resourceAtLeast?: number; targetHas?: string; selfPosition?: string };
  }>;
};

type SideView = {
  displayName: string;
  energy: number;
  momentum?: number;
  handCount?: number;
  deckCount?: number;
  discardCount?: number;
  hand: HandCard[];
  creatures: BattleCreatureView[];
  reservedEnergy?: number;
  actionQueue?: Array<{ id: string; cardInstanceId: string; targetId?: string; reservedEnergy: number; card?: { definitionKey?: string } }>;
  teamResonance?: { value: number; max: number; ready: boolean };
  geneticChain?: { links: Array<{ creatureName: string }>; maxLength: number };
  reactionSlot?: { card?: { definitionKey?: string } } | null;
  reactionArmedVisible?: boolean;
};

type DraftView = {
  kind: "RANKED_DRAFT";
  battleId: string;
  phase: string;
  yourRoster: Array<{
    creatureId: string;
    name: string;
    combatIdentity: string;
    role: string;
    primaryElement: string;
    personalResource: string;
    produces: string[];
    consumes: string[];
    keySynergies: string[];
    signatureSummary: string;
    supremeSummary: string;
  }>;
  foeRoster: Array<{ creatureId: string; name: string; combatIdentity: string; role: string; primaryElement: string; personalResource: string; produces: string[]; keySynergies: string[] }>;
  yourBanLocked?: boolean;
  foeBanLocked?: boolean;
  yourPick?: string[];
  formation?: { FRONT?: string; MIDDLE?: string; BACK?: string };
};

type BattleView = {
  battleId: string;
  yourSide: 0 | 1;
  yourTurn: boolean;
  maturationRewards?: Array<{
    creatureId: string;
    name: string;
    amount: number;
    becameReady: boolean;
    maturationXp: number;
  }>;
  events?: Array<{ type: string; targetId?: string; cardKey?: string; text: string }>;
  state: {
    status: string;
    round: number;
    activeSide: number;
    type: string;
    winnerSide?: number;
    log: Array<{ text: string; type?: string; targetId?: string }>;
    sides: [SideView, SideView];
    rulesVersion?: "V1" | "V2";
    fusion?: {
      resonance: number;
      pool: Array<{ familyKey: string; namePt: string; ready: boolean; triple: boolean; kind?: string; textPt: string; reason?: string }>;
      awakened: string | null;
      convergence?: string | null;
      telegraph?: string | null;
      byTypology?: Record<string, number>;
      windowAnnounced?: boolean;
    };
    usageHistory?: Array<{ typology?: string; cardKey: string; round: number }>;
  };
  validTargets?: Record<string, string[]>;
  blockedTargets?: Record<string, Record<string, string>>;
  targetInfo?: Record<string, { targetRule?: string; frontlineBlocking?: boolean; frontlineBypass?: boolean; blockedTargets?: Record<string, string> }>;
  combatDebug?: {
    battleDeck: { total: number; byCreature: Record<string, number>; drawPile: number; hand: number; discard: number; exile: number };
    formation: Record<string, Record<string, string>>;
    handByCreature: Record<string, number>;
  };
  middleWindow?: "OPEN" | "CLOSED";
  captured?: { name: string } | null;
  energyCap?: number;
  linear?: boolean;
  fusionEnabled?: boolean;
  matchRules?: { mode?: string; hintsEnabled?: boolean; actionQueueEnabled?: boolean; resonanceEnabled?: boolean; rulesVersion?: string };
  hints?: Array<{ kind: string; text: string; cardInstanceId?: string }>;
  pressure?: { tier: number; label: string | null };
  casualRecap?: { bestSynergies: string[]; maxChain: number; resonanceGenerated: number };
  reactionArmed?: [boolean, boolean];
  clock?: { timeBank: [number, number] };
  returnMapKey?: string;
  orbs?: { nexorb: number; nexorb_plus: number };
};

function bySlot(units: BattleCreatureView[], slot: string) {
  return units.find((unit) => (unit.slot ?? "FRONT") === slot && unit.hp > 0);
}

function needsTarget(card: HandCard) {
  return card.targetType === "ENEMY" || card.targetType === "ALLY";
}

function fusionLockHint(reason?: string) {
  if (reason === "usage") return "Jogue as duas tipologias.";
  if (reason === "resonance") return "Ressonância insuficiente.";
  if (reason === "momentum") return "Momentum insuficiente.";
  if (reason?.startsWith("round")) return "Ainda não é o round.";
  return "Ainda selada.";
}

export default function BattlePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { accessToken } = useGameSession();
  const [view, setView] = useState<BattleView | null>(null);
  const [draft, setDraft] = useState<DraftView | null>(null);
  const [banId, setBanId] = useState<string | null>(null);
  const [pickIds, setPickIds] = useState<string[]>([]);
  const [formation, setFormation] = useState<{ FRONT?: string; MIDDLE?: string; BACK?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [anims, setAnims] = useState<Record<string, CreatureVisualState>>({});
  const animBeat = useRef(0);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [debug, setDebug] = useState(false);
  const [recycleFlash, setRecycleFlash] = useState(false);
  const [resonanceUnlock, setResonanceUnlock] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function refresh() {
    if (!accessToken || !id) return;
    try {
      const row = await api<BattleView & DraftView>(`/battles/${id}`, { accessToken });
      if (row.kind === "RANKED_DRAFT") {
        setDraft(row);
        setView(null);
      } else {
        setDraft(null);
        setView(row);
      }
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Falha ao carregar a batalha.");
    }
  }

  async function concedeActivePvp() {
    if (!accessToken) return;
    try {
      await api("/pvp/leave", { method: "POST", accessToken });
      router.push("/game/arena");
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Não saiu do PvP.");
    }
  }

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 1800);
    return () => clearInterval(timer);
  }, [accessToken, id]);

  const lastEvents = view?.events ?? [];
  useEffect(() => {
    const latest = lastEvents.slice(-6);
    const next: Record<string, CreatureVisualState> = {};
    for (const event of latest) {
      if (event.type === "DAMAGE" && event.targetId) {
        next[event.targetId] = "HIT";
      }
      if (event.type === "CARD_PLAYED" && event.targetId) {
        next[event.targetId] = event.cardKey?.includes("bloom") || event.cardKey?.includes("pact") ? "CAST" : "ATTACK";
      }
      if (event.type === "CREATURE_KO" && event.targetId) {
        next[event.targetId] = "KO";
      }
    }
    animBeat.current += 1;
    setAnims(next);
    if (latest.some((row) => row.type === "DECK_RECYCLED")) {
      setRecycleFlash(true);
      window.setTimeout(() => setRecycleFlash(false), 1400);
    }
    if (latest.some((row) => row.type === "GENETIC_RESONANCE_UNLOCKED")) {
      setResonanceUnlock(true);
      window.setTimeout(() => setResonanceUnlock(false), 2200);
    }
  }, [lastEvents.map((row) => `${row.type}:${row.targetId}`).join("|")]);

  async function act(body: Record<string, unknown>) {
    if (!accessToken || !id) return;
    setError(null);
    try {
      const row = await api<BattleView & Partial<DraftView>>(`/battles/${id}/actions`, { method: "POST", accessToken, body });
      setView(row as BattleView);
      setSelectedId(null);
      setPlayingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Jogada recusada.");
      setPlayingId(null);
    }
  }

  async function draftAct(body: Record<string, unknown>) {
    if (!accessToken || !id) return;
    setError(null);
    try {
      const row = await api<BattleView & Partial<DraftView>>(`/battles/${id}/draft`, { method: "POST", accessToken, body });
      if (row.kind === "RANKED_DRAFT") {
        setDraft(row as DraftView);
      } else {
        setDraft(null);
        setView(row as BattleView);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Draft recusado.");
    }
  }

  const selected = useMemo(() => {
    if (!view || !selectedId) return null;
    const me = view.state.sides[view.yourSide] ?? view.state.sides[0];
    return me.hand.find((card) => card.instanceId === selectedId) ?? null;
  }, [view, selectedId]);

  if (draft) {
    return (
      <GameShell title="Draft Ranked" stage>
        {error ? <p className="text-ember">{error}</p> : null}
        <p className="gx-page__kicker">RANKED · {draft.phase} · S1.V1</p>
        <h2 className="gx-page__title !text-3xl">Squad, ban e pick</h2>
        <p className="mt-2 text-sm text-muted">Ban simultâneo. O oponente não vê a sua escolha até os dois trancarem.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <section className="gx-draft-col">
            <h3>Seu roster</h3>
            {draft.yourRoster.map((row) => (
              <button
                key={row.creatureId}
                type="button"
                className="gx-draft-card"
                data-on={banId === row.creatureId || pickIds.includes(row.creatureId) || Object.values(formation).includes(row.creatureId)}
                onClick={() => {
                  if (draft.phase === "BAN_PHASE") setBanId(row.creatureId);
                  if (draft.phase === "PICK_PHASE") {
                    setPickIds((cur) => (cur.includes(row.creatureId) ? cur.filter((id) => id !== row.creatureId) : [...cur, row.creatureId].slice(0, 3)));
                  }
                  if (draft.phase === "FORMATION_PHASE") {
                    const empty = (["FRONT", "MIDDLE", "BACK"] as const).find((slot) => !formation[slot]);
                    if (empty) setFormation((cur) => ({ ...cur, [empty]: row.creatureId }));
                  }
                }}
              >
                <strong>{row.name}</strong>
                <small>{row.role} · {row.combatIdentity}</small>
                <small>{row.primaryElement} · {row.personalResource}</small>
                <small>Produces {row.produces.slice(0, 3).join(", ") || "—"}</small>
                <small>G9 {row.signatureSummary} · G10 {row.supremeSummary}</small>
              </button>
            ))}
          </section>
          <section className="gx-draft-col">
            <h3>Adversário {draft.foeBanLocked ? "· ban trancado" : ""}</h3>
            {draft.foeRoster.map((row) => (
              <button
                key={row.creatureId}
                type="button"
                className="gx-draft-card"
                data-on={banId === row.creatureId}
                onClick={() => draft.phase === "BAN_PHASE" && setBanId(row.creatureId)}
              >
                <strong>{row.name}</strong>
                <small>{row.role} · {row.combatIdentity}</small>
                <small>{row.primaryElement} · {row.personalResource}</small>
                <small>Produces {row.produces.slice(0, 3).join(", ") || "—"}</small>
              </button>
            ))}
          </section>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {draft.phase === "BAN_PHASE" ? (
            <button type="button" className="gx-endturn" disabled={!banId || draft.yourBanLocked} onClick={() => void draftAct({ type: "BAN_CREATURE", creatureId: banId })}>
              Banir {draft.yourBanLocked ? "(aguardando oponente)" : ""}
            </button>
          ) : null}
          {draft.phase === "PICK_PHASE" ? (
            <button type="button" className="gx-endturn" disabled={pickIds.length !== 3} onClick={() => void draftAct({ type: "SELECT_ACTIVE_CREATURES", creatureIds: pickIds })}>
              Escolher 3
            </button>
          ) : null}
          {draft.phase === "FORMATION_PHASE" ? (
            <button type="button" className="gx-endturn" disabled={!formation.FRONT || !formation.MIDDLE || !formation.BACK} onClick={() => void draftAct({ type: "SET_FORMATION", formation })}>
              Confirmar formação
            </button>
          ) : null}
        </div>
      </GameShell>
    );
  }

  if (!view) {
    return (
      <GameShell title="Batalha" stage>
        {loadError ? (
          <div className="space-y-3">
            <p className="text-ember">{loadError}</p>
            <p className="text-sm text-muted">Se a arena ficou presa em outro PvP, desista dele aqui.</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="rounded-xl border border-ember/40 px-3 py-2 text-ember" onClick={() => void concedeActivePvp()}>
                Desistir do PvP ativo
              </button>
              <button type="button" className="rounded-xl border border-gold/40 px-3 py-2 text-gold" onClick={() => router.push("/game/arena")}>
                Voltar à arena
              </button>
            </div>
          </div>
        ) : (
          "Carregando…"
        )}
      </GameShell>
    );
  }

  const yourSideIndex = view.yourSide;
  const foeSideIndex = view.yourSide === 0 ? 1 : 0;
  const winnerSide = view.state.winnerSide;
  const me = view.state.sides[yourSideIndex] ?? view.state.sides[0];
  const foe = view.state.sides[foeSideIndex] ?? view.state.sides[1];
  const finished = view.state.status !== "ACTIVE";
  const yourTurn = view.yourTurn;
  const youWon = finished && view.state.winnerSide === view.yourSide;
  const hoverUnit = [...me.creatures, ...foe.creatures].find((unit) => unit.id === hoverId);

  function ownerOf(card: HandCard) {
    return me.creatures.find((unit) => unit.creatureId === card.sourceCreatureId || unit.id === card.sourceCreatureId);
  }
  const shot = lastEvents.some((row) => row.type === "ULTIMATE_TRIGGERED") ? "ultimate" : selected ? "card" : "wide";

  function ownerAlive(card: HandCard) {
    if (!card.sourceCreatureId) {
      return true;
    }
    const owner = me.creatures.find((unit) => unit.creatureId === card.sourceCreatureId || unit.id === card.sourceCreatureId);
    return !owner || owner.hp > 0;
  }

  function resourceOf(card: HandCard) {
    const owner = ownerOf(card);
    const def = owner?.resourceDef;
    const current = def ? (owner?.resources?.[def.id] ?? 0) : 0;
    return { owner, def, current, gate: resourcePlayGate(card.effects ?? [], current, def) };
  }

  function cardState(card: HandCard): GeneticCardState {
    if (playingId === card.instanceId) {
      return "PLAYING";
    }
    if (finished || !yourTurn || !ownerAlive(card) || resourceOf(card).gate) {
      return "DISABLED";
    }
    if (card.cost > me.energy) {
      return "INSUFFICIENT_ENERGY";
    }
    if (selectedId === card.instanceId) {
      return "SELECTED";
    }
    if (card.type === "REACTION") {
      return "REACTION_AVAILABLE";
    }
    return "SELECTABLE";
  }

  function playCard(card: HandCard) {
    if (!yourTurn || finished || card.cost > me.energy || !ownerAlive(card) || resourceOf(card).gate) {
      return;
    }
    if (card.type === "REACTION" || card.tags?.includes("COUNTER") || card.tags?.includes("INTERCEPT")) {
      setPlayingId(card.instanceId);
      void act({ type: "ARM_REACTION", cardInstanceId: card.instanceId });
      return;
    }
    if (needsTarget(card)) {
      setSelectedId(card.instanceId);
      return;
    }
    setPlayingId(card.instanceId);
    void act({ type: view?.matchRules?.actionQueueEnabled === false ? "PLAY_CARD" : "QUEUE_CARD", cardInstanceId: card.instanceId });
  }

  function targetOf(unit: BattleCreatureView, foeSide: boolean): "valid" | "invalid" | null {
    if (!selected || !yourTurn) {
      return null;
    }
    if (unit.hp <= 0) {
      return "invalid";
    }
    const server = view?.validTargets?.[selected.instanceId];
    if (server) {
      return server.includes(unit.id) ? "valid" : "invalid";
    }
    if (selected.targetType === "ENEMY") {
      return foeSide ? (server ? "invalid" : "valid") : "invalid";
    }
    if (selected.targetType === "ALLY") {
      return foeSide ? "invalid" : "valid";
    }
    return null;
  }

  function clickCreature(unit: BattleCreatureView, foeSide: boolean) {
    if (!selected) {
      return;
    }
    if (targetOf(unit, foeSide) !== "valid") {
      return;
    }
    setPlayingId(selected.instanceId);
    void act({ type: view?.matchRules?.actionQueueEnabled === false ? "PLAY_CARD" : "QUEUE_CARD", cardInstanceId: selected.instanceId, targetId: unit.id });
  }

  const linear = view.linear || view.state.rulesVersion === "V2";
  const fusionOn = Boolean(view.fusionEnabled);
  const fusionPool = view.state.fusion?.pool ?? [];
  const middleWindow = view.middleWindow;
  const energyCap = view.energyCap ?? Math.min(10, Math.max(1, view.state.round));

  function backToMap() {
    router.push("/game/arena");
  }

  const laneName: Record<string, string> = { FRONT: "Frente", MIDDLE: "Meio", BACK: "Retaguarda", BACK_LEFT: "Esquerda", BACK_RIGHT: "Direita" };
  const mode = view.state.rulesVersion === "V2" ? "ranked" : view.state.type === "PVE" ? "adventure" : "casual";

  function slot(side: SideView, foeSide: boolean, key: string, area: string) {
    const unit = bySlot(side.creatures, key);
    const sideWon = finished && winnerSide === (foeSide ? foeSideIndex : yourSideIndex);
    return (
      <div className="gx-arena__slot" data-area={area} data-window={key === "MIDDLE" ? middleWindow : undefined} data-protected={key === "BACK" ? "true" : undefined}>
        <span className="gx-arena__lane">{laneName[key] ?? key}</span>
        {unit ? (
          <BattleCreature
            unit={{
              ...unit,
              resourceFlash: lastEvents
                .filter((row) => row.targetId === unit.id && (row.type === "RESOURCE_GAIN" || row.type === "RESOURCE_SPEND" || row.type === "RESOURCE_MAX" || row.type === "RESOURCE_THRESHOLD"))
                .slice(-1)
                .map((row) => ({ text: row.text, key: animBeat.current }))[0] ?? null,
            }}
            foe={foeSide}
            target={targetOf(unit, foeSide)}
            anim={sideWon ? "VICTORY" : anims[unit.id]}
            animKey={animBeat.current}
            debug={debug}
            onSelect={() => clickCreature(unit, foeSide)}
            onHover={(on) => setHoverId(on ? unit.id : null)}
          />
        ) : null}
      </div>
    );
  }

  return (
    <GameShell title="Batalha" stage>
      {error ? <p className="text-ember">{error}</p> : null}
      <div className="gx-stage">
        <div className="gx-stage__modes">
          <Link href="/game/arena?mode=ranked" className="gx-mode" data-active={mode === "ranked"}>
            Ranked
            <small>Climb the ranks</small>
          </Link>
          <Link href="/game/arena?mode=casual" className="gx-mode" data-active={mode === "casual"}>
            Casual
            <small>Play for fun</small>
          </Link>
          <Link href="/game/arena?mode=adventure" className="gx-mode" data-active={mode === "adventure"}>
            Adventure / Career
            <small>Explore GENORYX</small>
          </Link>
        </div>
        <div className="gx-stage__duel">
          <div className="gx-plate gx-plate--foe">
            <span className="gx-plate__seal" />
            <div>
              <strong>{view.state.type === "PVE" ? `${foe.displayName} selvagem` : foe.displayName}</strong>
              <span>{mode === "ranked" ? "Season 1 · Lab V2" : mode === "adventure" ? "Carreira PvE" : "Duelo casual"}</span>
            </div>
          </div>
          <div className="gx-round">
            <b>Round {view.state.round} / 20</b>
            <em>{finished ? (youWon ? "Vitória" : "Derrota") : yourTurn ? "Your turn" : "Opponent turn"}</em>
            {view.pressure?.label ? <small className="gx-pressure">{view.pressure.label}</small> : null}
          </div>
          <div className="gx-plate gx-plate--you">
            <span className="gx-plate__seal" />
            <div>
              <strong>{me.displayName}</strong>
              <span>{mode === "ranked" ? "Season 1" : "Seu time"}</span>
            </div>
          </div>
        </div>
        <section className="gx-arena" data-shot={shot}>
          <div className="gx-arena__field" data-formation={linear ? "linear" : "classic"}>
            <div className="gx-arena__side" data-side="foe">
              {linear ? (
                <>
                  {slot(foe, true, "BACK", "e-back")}
                  {slot(foe, true, "MIDDLE", "e-mid")}
                  {slot(foe, true, "FRONT", "e-front")}
                </>
              ) : (
                <>
                  {slot(foe, true, "BACK_LEFT", "e-bl")}
                  {slot(foe, true, "BACK_RIGHT", "e-br")}
                  {slot(foe, true, "FRONT", "e-front")}
                </>
              )}
            </div>
            <div className="gx-arena__core" />
            <div className="gx-arena__side" data-side="you">
              {linear ? (
                <>
                  {slot(me, false, "FRONT", "p-front")}
                  {slot(me, false, "MIDDLE", "p-mid")}
                  {slot(me, false, "BACK", "p-back")}
                </>
              ) : (
                <>
                  {slot(me, false, "FRONT", "p-front")}
                  {slot(me, false, "BACK_LEFT", "p-bl")}
                  {slot(me, false, "BACK_RIGHT", "p-br")}
                </>
              )}
            </div>
          </div>
          {linear ? (
            <p className="gx-arena__hint">
              Meio {view.middleWindow === "OPEN" ? "exposto" : "protegido"}
              {view.middleWindow === "OPEN" ? " ◎" : " ◯"}
            </p>
          ) : null}
          {me.teamResonance ? (
            <p className="gx-resonance-team">
              RESONANCE {Array.from({ length: me.teamResonance.max }, (_, i) => (i < me.teamResonance!.value ? "●" : "○")).join(" ")} {me.teamResonance.value}/{me.teamResonance.max}
              {me.teamResonance.ready ? " · RESONANCE READY" : ""}
            </p>
          ) : null}
          {me.geneticChain?.links?.length ? (
            <p className="gx-chain">{me.geneticChain.links.map((row) => row.creatureName).join(" ↓ ")} · x{me.geneticChain.links.length}</p>
          ) : null}
          {view.reactionArmed?.[foeSideIndex] ? <p className="gx-arena__hint">REAÇÃO PREPARADA</p> : null}
          {me.creatures.some((unit) => unit.supremeReady) ? (
            <p className="gx-arena__hint">{me.creatures.filter((unit) => unit.supremeReady).map((unit) => `${unit.name} · SUPREME READY`).join(" · ")}</p>
          ) : null}
          {resonanceUnlock ? <p className="gx-arena__hint">RESSONÂNCIA GENÉTICA DESPERTADA</p> : null}
          {recycleFlash ? <p className="gx-arena__hint">DISCARD → SHUFFLE → DRAW</p> : null}
          {fusionOn && view.state.round >= 5 && view.state.fusion?.awakened ? (
            <p className="gx-arena__hint">SINERGIA DESPERTADA · {fusionPool.find((row) => row.familyKey === view.state.fusion?.awakened)?.namePt}</p>
          ) : null}
          {fusionOn && view.state.round >= 7 && view.state.fusion?.convergence ? (
            <p className="gx-arena__hint">GENETIC CONVERGENCE · {fusionPool.find((row) => row.familyKey === view.state.fusion?.convergence)?.namePt}</p>
          ) : null}
          <p className="gx-arena__hint">
            {hoverUnit
              ? `${hoverUnit.name} · ${hoverUnit.hp}/${hoverUnit.maxHp}${
                  selected && view.blockedTargets?.[selected.instanceId]?.[hoverUnit.id] === "FRONTLINE_BLOCKING"
                    ? " · protegido pela linha de frente"
                    : ""
                }`
              : selected
                ? `Escolha o alvo de ${selected.name ?? "a carta"}`
                : ""}
          </p>
          {finished ? (
            <div className="gx-arena-over">
              <p className="text-[11px] uppercase tracking-[0.2em] text-crystal">Combate encerrado</p>
              <h2 className="font-display text-4xl text-gold">{youWon ? "Vitória" : view.state.status === "FLED" ? "Fuga" : "Derrota"}</h2>
              {view.captured ? <p className="text-crystal">Capturou {view.captured.name}</p> : null}
              {view.casualRecap ? (
                <div className="gx-recap">
                  <p>SUAS MELHORES SINERGIAS · {view.casualRecap.bestSynergies.join(" → ") || "—"}</p>
                  <p>GENETIC CHAIN máxima · x{view.casualRecap.maxChain}</p>
                  <p>RESONANCE gerada · {view.casualRecap.resonanceGenerated}</p>
                </div>
              ) : null}
              {view.maturationRewards?.length ? (
                <div className="space-y-1 text-sm text-crystal">
                  {view.maturationRewards.map((row) => (
                    <p key={row.creatureId}>
                      {row.becameReady ? `GENETIC MATURATION COMPLETE · ${row.name}` : `+${row.amount} MATURATION · ${row.name}`}
                    </p>
                  ))}
                </div>
              ) : null}
              <button type="button" className="gx-endturn" onClick={backToMap}>
                Voltar à Arena
              </button>
            </div>
          ) : null}
        </section>
        {fusionOn && view.state.round >= 5 && fusionPool.length > 0 ? (
          <div className="gx-fusion-pool">
            {fusionPool.map((row) => {
              const playable = row.ready && yourTurn && !finished;
              return (
                <button
                  key={row.familyKey}
                  type="button"
                  disabled={!playable}
                  className={`gx-fusion-card ${row.triple || row.kind === "CONVERGENCE" ? "gx-fusion-card--convergence" : ""} ${row.ready ? "" : "gx-fusion-card--locked"}`}
                  onClick={() => {
                    if (!playable) return;
                    void act({ type: row.triple || row.kind === "CONVERGENCE" ? "PLAY_CONVERGENCE" : "PLAY_FUSION", familyKey: row.familyKey });
                  }}
                >
                  <span className="gx-fusion-card__art" />
                  <span>
                    {row.kind === "CONVERGENCE" || row.triple ? "CONVERGENCE" : "FUSION"} · {row.namePt}
                  </span>
                  <small>{row.ready ? row.textPt : fusionLockHint(row.reason)}</small>
                </button>
              );
            })}
          </div>
        ) : fusionOn && view.state.round >= 5 ? (
          <p className="gx-arena__hint">Fusão: jogue cartas das tipologias vivas para despertar.</p>
        ) : null}
        <div className="gx-stage__dock">
          <div className="gx-energy-dial">
            <span>Energy</span>
            <b>
              {Math.max(0, me.energy - (me.reservedEnergy ?? 0))}/{energyCap}
            </b>
            {(me.reservedEnergy ?? 0) > 0 ? <small>Reservada {me.reservedEnergy}</small> : null}
            <p className="gx-piles">Draw {me.deckCount ?? 0} · Disc {me.discardCount ?? 0}</p>
          </div>
          <div>
            <div className="gx-arena__hand">
              {me.hand.map((card) => (
                <CardFace
                  key={card.instanceId}
                  cardKey={card.definitionKey}
                  locus={card.locus}
                  artUrl={card.artUrl}
                  imageHash={card.imageHash}
                  element={card.element}
                  chassis={ownerOf(card)?.chassis ?? ownerOf(card)?.visual?.chassis ?? null}
                  lifeStage={ownerOf(card)?.visual?.lifeStage}
                  disabled={!yourTurn || finished}
                  state={cardState(card)}
                  onPlay={() => playCard(card)}
                  presentation={{
                    name: card.name,
                    cost: card.cost,
                    text: card.text ?? card.description,
                    tags: card.tags ?? [],
                    effects: card.effects,
                    resourceCurrent: resourceOf(card).current,
                    resourceName: resourceOf(card).def?.displayName,
                    sourceCreature: card.sourceCreature,
                  }}
                />
              ))}
            </div>
            {selected?.sourceCreature ? (
              <p className="gx-arena__hint">
                {selected.sourceCreature}
                {selected.locus ? ` · ${selected.locus}` : ""} · {selected.name}
              </p>
            ) : null}
            {fusionOn ? (
              <div className="gx-resonance">
                {["BURN", "HEAL", "CONTROL", "TANK", "CRITICAL"].map((key) => {
                  const value = view.state.fusion?.byTypology?.[key] ?? 0;
                  return (
                    <p key={key}>
                      {key} {Array.from({ length: 4 }, (_, index) => (index < Math.min(4, value) ? "●" : "○")).join("")}
                    </p>
                  );
                })}
              </div>
            ) : null}
          </div>
          <div className="gx-stage__actions">
            {(me.actionQueue?.length ?? 0) > 0 ? (
              <div className="gx-queue">
                <p>FILA DE AÇÕES</p>
                {me.actionQueue!.map((row, index) => (
                  <button key={row.id} type="button" className="gx-queue__item" onClick={() => void act({ type: "UNQUEUE_CARD", queueId: row.id })}>
                    {index + 1} → {row.card?.definitionKey ?? row.cardInstanceId}
                  </button>
                ))}
              </div>
            ) : null}
            {view.hints?.length ? (
              <ul className="gx-hints">
                {view.hints.slice(0, 3).map((hint) => (
                  <li key={`${hint.kind}-${hint.text}`}>{hint.text}</li>
                ))}
              </ul>
            ) : null}
            {me.teamResonance?.ready ? (
              <div className="gx-res-actions">
                <button type="button" className="gx-capture" onClick={() => void act({ type: "RESONANCE_ACTION", resonanceAction: "RESONANCE_SHIFT", creatureId: me.creatures[0]?.id, destSlot: "MIDDLE" })}>
                  SHIFT
                </button>
                <button type="button" className="gx-capture" onClick={() => void act({ type: "RESONANCE_ACTION", resonanceAction: "GENETIC_DRAW" })}>
                  DRAW
                </button>
                <button type="button" className="gx-capture" onClick={() => void act({ type: "RESONANCE_ACTION", resonanceAction: "RESONANCE_AMPLIFY" })}>
                  AMPLIFY
                </button>
              </div>
            ) : null}
            <button type="button" className="gx-endturn" disabled={!yourTurn || finished || !(me.actionQueue?.length)} onClick={() => void act({ type: "CONFIRM_TURN" })}>
              Confirmar turno
            </button>
            <button type="button" className="gx-endturn" disabled={!yourTurn || finished} onClick={() => void act({ type: "END_TURN" })}>
              Passar
            </button>
            {view.state.type === "PVE" && !finished ? (
              <>
                <button type="button" className="gx-capture" onClick={() => setCaptureOpen((open) => !open)}>
                  Capturar
                </button>
                {captureOpen ? (
                  <>
                    <button type="button" className="gx-capture" disabled={(view.orbs?.nexorb ?? 0) < 1} onClick={() => void act({ type: "CAPTURE", orbKey: "nexorb" })}>
                      NexOrb ×{view.orbs?.nexorb ?? 0}
                    </button>
                    <button type="button" className="gx-capture" disabled={(view.orbs?.nexorb_plus ?? 0) < 1} onClick={() => void act({ type: "CAPTURE", orbKey: "nexorb_plus" })}>
                      NexOrb+ ×{view.orbs?.nexorb_plus ?? 0}
                    </button>
                  </>
                ) : null}
                <button type="button" className="gx-logbtn" onClick={() => void act({ type: "FLEE" })}>
                  Fugir
                </button>
              </>
            ) : null}
            {view.state.type === "PVP" && !finished ? (
              <button type="button" className="gx-logbtn" onClick={() => void act({ type: "CONCEDE" })}>
                Desistir
              </button>
            ) : null}
            <details className="gx-history">
              <summary>View log</summary>
              <ul>
                {view.state.log.slice(-16).map((row, index) => (
                  <li key={`${row.text}-${index}`}>{row.text}</li>
                ))}
              </ul>
            </details>
          </div>
        </div>
      </div>
      <label className="mt-2 flex items-center gap-2 text-xs text-muted">
        <input type="checkbox" checked={debug} onChange={(event) => setDebug(event.target.checked)} />
        SHOW BATTLE DEBUG
      </label>
      {debug ? (
        <pre className="overflow-auto rounded-xl border border-[#2a2438] p-3 text-[11px] text-muted">
          {JSON.stringify(
            {
              rulesVersion: view.state.rulesVersion,
              validTargets: view.validTargets,
              resonance: view.state.fusion?.resonance,
              byTypology: view.state.fusion?.byTypology,
              usage: view.state.usageHistory,
              combatDebug: view.combatDebug,
              selectedTarget: selected
                ? {
                    card: selected.definitionKey,
                    source: selected.sourceCreature,
                    ...view.targetInfo?.[selected.instanceId],
                    validTargets: view.validTargets?.[selected.instanceId],
                  }
                : null,
              resources: me.creatures.map((unit) => ({
                name: unit.name,
                current: unit.resources,
                cap: unit.resourceCap,
                def: unit.resourceDef,
              })),
            },
            null,
            2,
          )}
        </pre>
      ) : null}
    </GameShell>
  );
}
