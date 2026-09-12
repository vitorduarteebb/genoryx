"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { GameShell } from "../game-shell";
import { api } from "../../lib/api";
import { useGameSession } from "../../lib/use-game-session";
import { useReducedMotion } from "../genesis/use-reduced-motion";
import { BreedingHistory } from "./breeding-history";
import { CrossPotentialPanel } from "./cross-potential-panel";
import { EggIncubator } from "./egg-incubator";
import { GeneticAnalysis } from "./genetic-analysis";
import { GenesisAnimation } from "./genesis-animation";
import { GenesisCore } from "./genesis-core";
import { GenesisCost } from "./genesis-cost";
import "./genesis-lab.css";
import { ParentDisplay } from "./parent-display";
import { ParentSelector } from "./parent-selector";
import { silentLabHooks, type GenesisLabSoundHooks } from "./sound-hooks";
import type { BreedingHistoryRow, BreedingPreview, EnrichedCreature, GenesisEgg, LabTab, ParentSlot } from "./types";

export function GenesisLab({ sounds = silentLabHooks }: { sounds?: GenesisLabSoundHooks }) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const { accessToken, character } = useGameSession();
  const [creatures, setCreatures] = useState<EnrichedCreature[]>([]);
  const [fatherId, setFatherId] = useState("");
  const [motherId, setMotherId] = useState("");
  const [preview, setPreview] = useState<BreedingPreview | null>(null);
  const [eggs, setEggs] = useState<GenesisEgg[]>([]);
  const [history, setHistory] = useState<BreedingHistoryRow[]>([]);
  const [tab, setTab] = useState<LabTab>("eggs");
  const [selector, setSelector] = useState<ParentSlot | null>(null);
  const [phase, setPhase] = useState<"idle" | "merging" | "flash" | "forming">("idle");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const father = creatures.find((row) => row.id === fatherId);
  const mother = creatures.find((row) => row.id === motherId);
  const gold = character?.wallets.find((wallet) => wallet.currency === "GOLD")?.balance ?? "0";

  async function refresh() {
    if (!accessToken) return;
    const [list, eggList, hist] = await Promise.all([
      api<EnrichedCreature[]>("/creatures", { accessToken }),
      api<GenesisEgg[]>("/eggs", { accessToken }),
      api<BreedingHistoryRow[]>("/breeding/history", { accessToken }),
    ]);
    setCreatures(list);
    setEggs(eggList);
    setHistory(hist);
  }

  useEffect(() => {
    void refresh();
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    const timer = window.setInterval(() => {
      void api<GenesisEgg[]>("/eggs", { accessToken }).then(setEggs).catch(() => undefined);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || !fatherId || !motherId) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    void api<BreedingPreview>("/breeding/preview", {
      method: "POST",
      accessToken,
      body: { parentAId: fatherId, parentBId: motherId },
    })
      .then((row) => {
        if (!cancelled) {
          setPreview(row);
          setError(null);
          sounds.onGenesisReady?.();
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setPreview(null);
          setError(err.message);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, fatherId, motherId, sounds]);

  const canStart = Boolean(
    preview?.compatible &&
      fatherId &&
      motherId &&
      !busy &&
      (preview.catalystOwned ?? 0) >= (preview.catalystRequired ?? 1),
  );

  async function breed() {
    if (!accessToken || !fatherId || !motherId) return;
    setBusy(true);
    setError(null);
    sounds.onGenesisStarted?.();
    setPhase(reduced ? "forming" : "merging");
    try {
      await api("/breeding", {
        method: "POST",
        accessToken,
        body: { parentAId: fatherId, parentBId: motherId },
      });
      if (!reduced) {
        setPhase("flash");
        await new Promise((resolve) => window.setTimeout(resolve, 400));
        sounds.onGenomeCombined?.();
        setPhase("forming");
        await new Promise((resolve) => window.setTimeout(resolve, 700));
      }
      sounds.onEggCreated?.();
      setPhase("idle");
      setTab("eggs");
      await refresh();
    } catch (err) {
      setPhase("idle");
      setError(err instanceof Error ? err.message : "Gênese recusada.");
    } finally {
      setBusy(false);
    }
  }

  async function hatch(id: string) {
    if (!accessToken) return;
    setBusy(true);
    try {
      const born = await api<{ creatureId: string }>(`/eggs/${id}/hatch`, { method: "POST", accessToken });
      sounds.onReveal?.();
      router.push(`/game/genesis/${born.creatureId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "O ovo ainda não choca.");
    } finally {
      setBusy(false);
    }
  }

  const tabs = useMemo(
    () =>
      [
        ["analysis", "Análise"],
        ["eggs", "Ovos"],
        ["history", "Linhagem"],
      ] as const,
    [],
  );

  return (
    <GameShell
      wide
      kicker="Lyra · Altar de Gênese"
      title="Laboratório Genesis"
      subtitle="Duas criaturas. Um ovo. Toda linhagem começa com uma combinação."
    >
      <section className="genesis-lab genesis-lab-hero p-5">
        <GenesisAnimation phase={phase} />
        <div className="relative grid items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
          <ParentDisplay
            slot="A"
            creature={father}
            empty="Selecionar macho"
            onOpen={() => {
              setSelector("A");
              sounds.onParentSelected?.();
            }}
          />
          <div className="flex flex-col items-center gap-3">
            <GenesisCore ready={Boolean(preview)} merging={phase === "merging"} preview={preview} />
            {preview ? <GenesisCost preview={preview} nameA={father?.name ?? "Parent A"} nameB={mother?.name ?? "Parent B"} /> : null}
            <p className="text-xs text-crystal">Gold {gold}</p>
            <button
              type="button"
              disabled={!canStart}
              onClick={() => void breed()}
              className="rounded-full border border-gold bg-gold/10 px-8 py-3 font-display tracking-[0.2em] text-gold disabled:opacity-40"
            >
              {busy ? "Sintetizando…" : "INICIAR GÊNESE"}
            </button>
          </div>
          <ParentDisplay
            slot="B"
            creature={mother}
            empty="Selecionar fêmea"
            onOpen={() => {
              setSelector("B");
              sounds.onParentSelected?.();
            }}
          />
        </div>
        {preview ? (
          <div className="relative mt-5">
            <CrossPotentialPanel potential={preview.crossPotential} />
          </div>
        ) : null}
        {error ? <p className="relative mt-4 text-sm text-ember">{error}</p> : null}
      </section>

      <nav className="flex flex-wrap gap-2">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className="gx-nav__link"
            data-active={tab === key}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "analysis" ? <GeneticAnalysis preview={preview} /> : null}
      {tab === "eggs" ? <EggIncubator eggs={eggs} busy={busy} onHatch={(id) => void hatch(id)} /> : null}
      {tab === "history" ? <BreedingHistory rows={history} /> : null}

      {selector ? (
        <ParentSelector
          slot={selector}
          creatures={creatures}
          selectedId={selector === "A" ? fatherId : motherId}
          onClose={() => setSelector(null)}
          onSelect={(id) => {
            if (selector === "A") {
              setFatherId(id);
            } else {
              setMotherId(id);
            }
          }}
        />
      ) : null}
    </GameShell>
  );
}
