"use client";

import type { CardPresentation, ChassisView } from "@nexora/config";
import { GeneticCard } from "./genetic-card";
import type { GeneticCardState } from "../lib/card-chrome";

export function CardFace({
  cardKey,
  locus,
  artUrl,
  imageHash,
  chassis,
  element,
  lifeStage,
  creatureId,
  disabled,
  state,
  onPlay,
  presentation,
}: {
  cardKey: string;
  locus?: string | null;
  artUrl?: string | null;
  imageHash?: string | null;
  chassis?: ChassisView | null;
  element?: string | null;
  lifeStage?: string | null;
  creatureId?: string | null;
  disabled?: boolean;
  state?: GeneticCardState;
  onPlay?: () => void;
  presentation?: Partial<CardPresentation> & {
    effects?: Array<{
      op: string;
      value?: number;
      resource?: string;
      condition?: { resourceAtLeast?: number; targetHas?: string; selfPosition?: string };
    }>;
    resourceCurrent?: number;
    resourceName?: string;
    sourceCreature?: string;
  };
}) {
  return (
    <GeneticCard
      cardKey={cardKey}
      locus={locus}
      artUrl={artUrl}
      imageHash={imageHash}
      chassis={chassis}
      element={element}
      lifeStage={lifeStage}
      creatureId={creatureId}
      size="battle"
      state={state}
      disabled={disabled}
      onPlay={onPlay}
      presentation={presentation}
    />
  );
}
