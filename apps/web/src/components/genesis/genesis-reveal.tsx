"use client";

import type { ChassisView } from "@nexora/config";
import { useEffect, useState } from "react";
import { officialPortraitSrc } from "../../lib/creature-art";
import { CreatureGxrFigure } from "../creature-gxr-figure";
import { CreatureRevealStage } from "./creature-reveal-stage";
import { GenesisEggVisual } from "./genesis-egg-visual";
import { EggStage } from "./egg-stage";
import { FormationStage } from "./formation-stage";
import "./genesis-reveal.css";
import { GeneticSummary } from "./genetic-summary";
import { MutationReveal } from "./mutation-reveal";
import { SilhouetteStage } from "./silhouette-stage";
import { silentGenesisHooks, type GenesisSoundHooks } from "./sound-hooks";
import { useReducedMotion } from "./use-reduced-motion";

export type GenesisPayload = {
  creatureId: string;
  revealStatus: string;
  speciesName: string;
  generation: number;
  bodyPlan: string;
  temperament: string;
  mutation: string | null;
  rareExpression: boolean;
  aura?: string | null;
  chassis?: ChassisView | null;
  visual: {
    status: string;
    lifeStage: string;
    url: string | null;
    imageHash: string | null;
    canConfirm?: boolean;
  };
  element?: string | null;
  typology?: string | null;
  geneticPower?: string | null;
  powerOrigin?: string | null;
  genesisGrade?: string | null;
  newGeneticPower?: boolean;
};

type Beat =
  | "wait"
  | "silence"
  | "pulse"
  | "crack"
  | "burst"
  | "silhouette"
  | "reveal"
  | "named"
  | "mutation"
  | "rarity"
  | "summary";

export function GenesisReveal({
  payload,
  onConfirm,
  onLeave,
  sounds = silentGenesisHooks,
}: {
  payload: GenesisPayload;
  onConfirm: () => Promise<void>;
  onLeave?: () => void;
  sounds?: GenesisSoundHooks;
}) {
  const reduced = useReducedMotion();
  const ready = Boolean(payload.visual.url) || Boolean(payload.visual.canConfirm);
  const failed = payload.visual.status === "FAILED" && !payload.visual.canConfirm;
  const [beat, setBeat] = useState<Beat>("wait");
  const [started, setStarted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!started) {
      return;
    }
    const timeline: Array<{ at: number; next: Beat; hook?: keyof GenesisSoundHooks }> = reduced
      ? [
          { at: 80, next: "reveal", hook: "onReveal" },
          { at: 500, next: "named" },
          { at: 900, next: payload.mutation ? "mutation" : payload.rareExpression ? "rarity" : "summary" },
          { at: 1400, next: "summary" },
        ]
      : [
          { at: 500, next: "pulse", hook: "onPulse" },
          { at: 1500, next: "crack", hook: "onCrack" },
          { at: 2300, next: "burst", hook: "onBurst" },
          { at: 3700, next: "silhouette", hook: "onSilhouette" },
          { at: 4050, next: "reveal", hook: "onReveal" },
          { at: 4900, next: "named" },
          { at: 5100, next: payload.mutation ? "mutation" : payload.rareExpression ? "rarity" : "summary" },
          { at: payload.mutation ? 5900 : 5600, next: payload.rareExpression && payload.mutation ? "rarity" : "summary" },
          { at: 6600, next: "summary" },
        ];
    const timers = timeline.map((row) =>
      window.setTimeout(() => {
        setBeat(row.next);
        if (row.hook) {
          sounds[row.hook]?.();
        }
        if (row.next === "mutation") {
          sounds.onMutation?.();
        }
      }, row.at),
    );
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [started, reduced, payload.mutation, payload.rareExpression, sounds]);

  async function start() {
    if (failed) {
      onLeave?.();
      return;
    }
    if (!ready) {
      return;
    }
    setStarted(true);
    setBeat("silence");
  }

  const [confirmError,setConfirmError]=useState<string|null>(null);
  useEffect(()=>{setStarted(false);setBeat("wait");setBusy(false);setConfirmError(null);},[payload.creatureId]);
  async function finish() {
    setBusy(true);setConfirmError(null);
    try{await onConfirm();}catch(e){setConfirmError(e instanceof Error?e.message:"Não foi possível confirmar o nascimento.");}finally{setBusy(false);}
  }

  const url = payload.visual.url ? officialPortraitSrc(payload.visual.url) : null;
  const eggHints={eggId:payload.creatureId,genesisGrade:payload.genesisGrade};
  const phaseClass =
    beat === "pulse" ? "genesis-pulse" : beat === "crack" ? "genesis-crack" : beat === "burst" ? "genesis-burst" : "";

  return (
    <section className={`genesis-stage genesis-temperament-${payload.temperament} ${phaseClass}`}>
      {beat === "wait" && !ready && !failed ? (
        <FormationStage
          chassis={payload.chassis}
          bodyPlan={payload.bodyPlan}
          element={payload.element}
          lifeStage={payload.visual.lifeStage}
          temperament={payload.temperament}
          creatureId={payload.creatureId}
          genesisGrade={payload.genesisGrade}
        />
      ) : null}
      {beat === "wait" && failed ? (
        <>
          <FormationStage
            failed
            chassis={payload.chassis}
            bodyPlan={payload.bodyPlan}
            element={payload.element}
            lifeStage={payload.visual.lifeStage}
            temperament={payload.temperament}
            creatureId={payload.creatureId}
            genesisGrade={payload.genesisGrade}
          />
          <div className="pb-10 text-center">
            <button type="button" className="rounded-full border border-gold/40 px-5 py-2 text-gold" onClick={() => void start()}>
              Sair
            </button>
          </div>
        </>
      ) : null}
      {beat === "wait" && ready ? (
        <EggStage hints={eggHints}
          title={payload.visual.url ? "Seu Genesis está pronto para nascer." : "O filho já tem forma. Revele pelo chassi."}
          action={
            <button type="button" className="rounded-full border border-gold bg-gold/10 px-8 py-2 font-display tracking-[0.2em] text-gold" onClick={() => void start()}>
              Revelar
            </button>
          }
        />
      ) : null}
      {beat === "silence" || beat === "pulse" || beat === "crack" || beat === "burst" ? (
        <div className="flex items-center justify-center py-20">
          <GenesisEggVisual hints={eggHints} motion={beat === "silence" ? "still" : beat === "pulse" ? "pulse" : beat === "crack" ? "crack" : "burst"} size={360} />
        </div>
      ) : null}
      {beat === "silhouette" && url && !payload.chassis ? <SilhouetteStage url={url} /> : null}
      {beat === "silhouette" && payload.chassis ? (
        <div className="flex justify-center py-10 opacity-40">
          <CreatureGxrFigure
            chassis={payload.chassis}
            bodyPlan={payload.bodyPlan}
            element={payload.element ?? "ARCANE"}
            lifeStage={payload.visual.lifeStage}
            temperament={payload.temperament}
            aura={payload.aura}
            creatureId={payload.creatureId}
            context="HATCH"
            size={260}
          />
        </div>
      ) : null}
      {(beat === "reveal" || beat === "named" || beat === "mutation" || beat === "rarity" || beat === "summary") && url && !payload.chassis ? (
        <CreatureRevealStage url={url} aura={payload.aura} />
      ) : null}
      {(beat === "reveal" || beat === "named" || beat === "mutation" || beat === "rarity" || beat === "summary") &&
      payload.chassis ? (
        <div className="flex justify-center py-10">
          <CreatureGxrFigure
            chassis={payload.chassis}
            element={payload.element ?? "ARCANE"}
            lifeStage={payload.visual.lifeStage}
            temperament={payload.temperament}
            aura={payload.aura}
            creatureId={payload.creatureId}
            context="HATCH"
            animationState="HATCH"
            bodyPlan={payload.bodyPlan}
            animationKey={payload.creatureId}
            label={payload.speciesName}
            size={280}
          />
        </div>
      ) : null}
      {beat === "named" || beat === "mutation" || beat === "rarity" || beat === "summary" ? (
        <p className="text-center font-display text-3xl text-gold">{payload.speciesName}</p>
      ) : null}
      {beat === "mutation" && payload.mutation ? <MutationReveal mutation={payload.mutation} /> : null}
      {beat === "rarity" && payload.rareExpression ? (
        <p className="pb-6 text-center text-xs uppercase tracking-[0.22em] text-gold">Rare genetic expression</p>
      ) : null}
      {confirmError ? <p role="alert" className="text-center text-ember">{confirmError}</p> : null}
      {beat === "summary" ? (
        <>
          <GeneticSummary
            speciesName={payload.speciesName}
            generation={payload.generation}
            bodyPlan={payload.bodyPlan}
            temperament={payload.temperament}
            rareExpression={payload.rareExpression}
            creatureId={payload.creatureId}
            element={payload.element}
            typology={payload.typology}
            mutation={payload.mutation}
            geneticPower={payload.geneticPower}
            powerOrigin={payload.powerOrigin}
            genesisGrade={payload.genesisGrade}
            newGeneticPower={payload.newGeneticPower}
          />
          <div className="pb-10 text-center">
            <button type="button" disabled={busy} className="rounded-full border border-gold/40 px-5 py-2 text-gold" onClick={() => void finish()}>
              {busy ? "Gravando…" : "Confirmar nascimento"}
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}
