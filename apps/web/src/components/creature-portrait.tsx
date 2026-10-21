"use client";

import type { ChassisView, CreaturePhenotype } from "@nexora/config";
import type { BodyPlan, HeadType } from "@nexora/types";
import { resolveCreatureVisual, type PresentedVisual } from "../lib/creature-art";
import type { CreatureVisualContext } from "../lib/creature-visual-contract";
import { GenesisEggVisual } from "./genesis/genesis-egg-visual";
import { CreatureGxrFigure } from "./creature-gxr-figure";

export type PortraitInput = {
  context?:CreatureVisualContext;
  modelUrl?:string|null;
  speciesKey?: string | null;
  bodyPlan?: BodyPlan | string | null;
  head?: HeadType | string | null;
  element?: string;
  genesisSeed?: number;
  phenotype?: CreaturePhenotype | null;
  portraitUrl?: string | null;
  visualStatus?: string | null;
  visualJob?: boolean;
  visual?: PresentedVisual | null;
  revealStatus?: string | null;
  chassis?: ChassisView | null;
  lifeStage?: string | null;
  temperament?: string | null;
  visualSeed?: string | null;
  creatureId?: string | null;
};

export function CreaturePortrait({
  context,
  modelUrl,
  bodyPlan,
  element,
  visual,
  portraitUrl,
  revealStatus,
  chassis,
  lifeStage,
  temperament,
  visualSeed,
  creatureId,
  size = 160,
  className = "",
}: PortraitInput & { size?: number; className?: string }) {
  const resolved = resolveCreatureVisual({ visual, portraitUrl, revealStatus });
  const born = Boolean(chassis) || Boolean(element) || Boolean(modelUrl);

  // Ovo 3D é só incubação/cerimônia. Criatura nascida — mesmo sem retrato OpenAI — é o chassi.
  if (!born && (resolved.mode === "secret" || resolved.mode === "forming" || resolved.mode === "pending")) {
    return (
      <div className={`relative ${className}`} style={{ width: size, height: size }}>
        <EggPlaceholder
          size={size}
          label={resolved.mode === "secret" ? "???" : resolved.mode === "forming" ? "Genesis está formando…" : "Aguardando forma"}
          pulse={resolved.mode === "forming"}
        />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width: size, height: size }}>
      <CreatureGxrFigure
        context={context}
        modelUrl={modelUrl}
        bodyPlan={bodyPlan}
        chassis={chassis}
        element={element}
        lifeStage={lifeStage}
        temperament={temperament}
        visualSeed={visualSeed}
        creatureId={creatureId}
        size={size}
      />
    </div>
  );
}

function EggPlaceholder({ size, label, pulse }: { size: number; label: string; pulse?: boolean }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <GenesisEggVisual size={size*.8} motion={pulse?"incubating":"still"} />
      <p className="mt-2 px-1 text-center text-[10px] uppercase tracking-[0.14em] text-crystal">{label}</p>
    </div>
  );
}
