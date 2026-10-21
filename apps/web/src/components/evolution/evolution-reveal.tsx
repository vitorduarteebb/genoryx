"use client";

import type { ChassisView } from "@nexora/config";
import { CreatureGxrFigure } from "../creature-gxr-figure";
import { officialPortraitSrc } from "../../lib/creature-art";
import { stageLabel } from "../../lib/creature-lexicon";
import { useReducedMotion } from "../genesis/use-reduced-motion";
import "./evolution-reveal.css";

export type EvolutionPayload = {
  chassis?: ChassisView | null;
  bodyPlan?: string | null;
  creatureId: string;
  name: string;
  speciesName: string;
  fromStage: string;
  toStage: string;
  evolutionStatus: string;
  canEvolve: boolean;
  evolved?: boolean;
  fromVisual: { status: string; lifeStage: string; url: string | null; imageHash: string | null };
  toVisual: { status: string; lifeStage: string; url: string | null; imageHash: string | null };
};

function StageFigure({
  payload,
  stage,
  variant,
  label,
  pose,
}: {
  payload: EvolutionPayload;
  stage: string;
  variant: "before" | "after";
  label: string;
  pose?: "IDLE" | "VICTORY";
}) {
  const portrait = officialPortraitSrc(variant === "before" ? payload.fromVisual.url : payload.toVisual.url);
  const adult = stage === "ADULT";
  return (
    <figure
      className={`gx-awaken__figure ${variant === "after" ? "gx-awaken__figure--after" : ""} ${adult ? "gx-awaken__figure--adult" : ""}`}
    >
      {payload.chassis ? (
        <CreatureGxrFigure
          chassis={payload.chassis}
          bodyPlan={payload.bodyPlan}
          creatureId={payload.creatureId}
          lifeStage={stage}
          size={420}
          animationState={pose ?? "IDLE"}
          label={label}
        />
      ) : portrait ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={portrait} alt="" className="aspect-square w-full object-cover" />
      ) : (
        <div className="grid aspect-square place-items-center text-gold">{stageLabel(stage)}</div>
      )}
      <figcaption className="gx-awaken__cap">{label}</figcaption>
    </figure>
  );
}

export function EvolutionReveal({
  payload,
  onEvolve,
  busy,
  error,
}: {
  payload: EvolutionPayload;
  onEvolve: () => Promise<void>;
  busy?: boolean;
  error?: string | null;
}) {
  const reduced = useReducedMotion();
  const showingResult = Boolean(payload.evolved) || (!payload.canEvolve && payload.fromStage !== payload.toStage);
  const toAdult = payload.toStage === "ADULT";
  const ready = payload.canEvolve && !showingResult;
  const continueAdult = showingResult && payload.canEvolve && payload.toStage !== "ADULT";

  return (
    <section className="gx-awaken" data-reduced={reduced}>
      <p className="gx-awaken__kicker">{toAdult ? "Despertar · Forma adulta" : "Despertar · Genesis"}</p>
      <h1 className="gx-awaken__title">{payload.name}</h1>
      <p className="gx-awaken__lead">
        {payload.speciesName} · {stageLabel(payload.fromStage)}
        {payload.canEvolve || showingResult ? ` → ${stageLabel(payload.toStage)}` : ""}
        . O DNA não muda. Só o corpo amadurece.
      </p>
      <div className="gx-awaken__duel">
        <StageFigure
          payload={payload}
          stage={payload.fromStage}
          variant="before"
          label={`Antes · ${stageLabel(payload.fromStage)}`}
        />
        <p className="gx-awaken__arrow" aria-hidden>
          {showingResult ? "↓" : "→"}
        </p>
        <StageFigure
          payload={payload}
          stage={payload.toStage}
          variant="after"
          label={showingResult ? `Agora · ${stageLabel(payload.toStage)}` : `Depois · ${stageLabel(payload.toStage)}`}
          pose={showingResult ? "VICTORY" : "IDLE"}
        />
      </div>
      {error ? <p className="gx-awaken__error">{error}</p> : null}
      {ready ? (
        <div className="gx-awaken__acts">
          <button type="button" disabled={busy} className="gx-cta" onClick={() => void onEvolve()}>
            {toAdult ? "Despertar forma adulta" : `Despertar ${stageLabel(payload.toStage).toLowerCase()}`}
          </button>
        </div>
      ) : showingResult ? (
        <div className="gx-awaken__acts">
          <p className="gx-awaken__note">
            {toAdult
              ? "A linhagem alcançou a forma adulta. Mesmo indivíduo, mesmo certificado genético."
              : "O mesmo indivíduo amadureceu. DNA, loci e linhagem permanecem intactos."}
          </p>
          {continueAdult ? (
            <button type="button" disabled={busy} className="gx-cta" onClick={() => void onEvolve()}>
              Continuar para forma adulta
            </button>
          ) : null}
        </div>
      ) : (
        <p className="gx-awaken__note">Leve esta criatura à Arena até o círculo acender. Nível e maturação precisam fechar juntos.</p>
      )}
    </section>
  );
}
