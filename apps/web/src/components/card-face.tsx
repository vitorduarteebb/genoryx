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
  openDetail,
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
  openDetail?: boolean;
  presentation?: Partial<CardPresentation> & {
    effects?: Array<{
      op: string;
      value?: number;
      status?: string;
      duration?: number;
      resource?: string;
      condition?: { resourceAtLeast?: number; targetHas?: string; selfPosition?: string; targetHpBelow?: number };
    }>;
    resourceCurrent?: number;
    resourceName?: string;
    sourceCreature?: string;
    domain?: string | null;
    speed?: string | null;
    domainLabel?: string | null;
    speedLabel?: string | null;
    estimatedDamage?: number | null;
    estimatedShield?: number | null;
    estimatedHeal?: number | null;
    genomeDetails?: string | null;
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
      openDetail={openDetail}
      presentation={presentation}
    />
  );
}
