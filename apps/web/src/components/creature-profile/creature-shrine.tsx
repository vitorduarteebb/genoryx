"use client";

import { useState } from "react";
import type { ChassisView } from "@nexora/config";
import { CreatureGxrFigure } from "../creature-gxr-figure";
import { CreatureModelViewer } from "../creature-model-viewer";
import { CreaturePortrait } from "../creature-portrait";
import type { CreatureVisualState } from "../../lib/creature-visual-contract";
import { officialPortraitSrc } from "../../lib/creature-art";
import type { PresentedVisual } from "../../lib/creature-art";

export function CreatureShrine({
  name,
  element,
  chassis,
  model,
  portraitUrl,
  visual,
  visualStatus,
  visualJob,
  revealStatus,
  lifeStage,
  temperament,
  visualSeed,
  aura,
  creatureId,
  speciesKey,
  bodyPlan,
  head,
  genesisSeed,
  phenotype,
}: {
  name: string;
  element: string;
  chassis?: ChassisView | null;
  model?: { status: string; url: string | null } | null;
  portraitUrl?: string | null;
  visual?: PresentedVisual | null;
  visualStatus?: string | null;
  visualJob?: boolean;
  revealStatus?: string | null;
  lifeStage?: string;
  temperament?: string | null;
  visualSeed?: string | null;
  aura?: string | null;
  creatureId: string;
  speciesKey?: string | null;
  bodyPlan?: string | null;
  head?: string | null;
  genesisSeed?: number;
  phenotype?: Parameters<typeof CreaturePortrait>[0]["phenotype"];
}) {
  const [pose, setPose] = useState<CreatureVisualState>("IDLE");
  const portrait = officialPortraitSrc(portraitUrl ?? visual?.url);
  const modelReady = model?.status === "READY" && Boolean(model.url);

  return (
    <figure className="gx-shrine" data-element={element}>
      <div className="gx-shrine__glow" aria-hidden />
      <div className="gx-shrine__stage">
        {chassis ? (
          <CreatureGxrFigure
            chassis={chassis}
            element={element}
            lifeStage={lifeStage}
            temperament={temperament}
            visualSeed={visualSeed}
            aura={aura}
            creatureId={creatureId}
            context="PROFILE"
            animationState={pose}
            animationKey={pose}
            label={name}
            size={460}
          />
        ) : modelReady && model?.url ? (
          <CreatureModelViewer
            url={model.url}
            portraitUrl={portrait}
            visualSeed={visualSeed}
            temperament={temperament}
            lifeStage={lifeStage}
            bodyPlan={bodyPlan}
            aura={aura}
            animationState={pose}
          />
        ) : (
          <CreaturePortrait
            speciesKey={speciesKey ?? name.toLowerCase()}
            bodyPlan={bodyPlan}
            head={head}
            element={element}
            genesisSeed={genesisSeed}
            phenotype={phenotype}
            portraitUrl={portraitUrl}
            visualStatus={visualStatus}
            visualJob={visualJob}
            visual={visual}
            revealStatus={revealStatus}
            lifeStage={lifeStage}
            temperament={temperament}
            visualSeed={visualSeed}
            creatureId={creatureId}
            size={420}
          />
        )}
        <span className="gx-shrine__plinth" aria-hidden />
      </div>
      <figcaption className="gx-shrine__actions">
        <button type="button" data-on={pose === "IDLE"} onClick={() => setPose("IDLE")}>
          Repouso
        </button>
        <button type="button" data-on={pose === "BATTLE_IDLE"} onClick={() => setPose("BATTLE_IDLE")}>
          Alerta
        </button>
        <button type="button" data-on={pose === "CAST"} onClick={() => setPose("CAST")}>
          Rugido
        </button>
      </figcaption>
    </figure>
  );
}
