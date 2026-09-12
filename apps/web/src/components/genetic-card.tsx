"use client";

import type { CardPresentation, ChassisView } from "@nexora/config";
import { presentCard, resourceChipFromEffect, resourcePlayGate } from "@nexora/config";
import { useState } from "react";
import { cardArtSrc } from "../lib/card-art";
import {
  cardTreatment,
  elementIconSrc,
  frameSrc,
  typeIconSrc,
  type GeneticCardSize,
  type GeneticCardState,
} from "../lib/card-chrome";
import { CreatureGxrFigure } from "./creature-gxr-figure";
import "./genetic-card.css";
import "./personal-resource.css";

const TAG_PT: Record<string, string> = {
  ATTACK: "Ataque",
  DEFENSE: "Defesa",
  FOUNDATION: "Fundação",
  SPECIALIZATION: "Especialização",
  SYNERGY: "Sinergia",
  ADVANCED: "Avançada",
  SIGNATURE: "Assinatura",
  SUPREME: "Suprema",
  HEAL: "Cura",
  SHIELD: "Escudo",
  CONTROL: "Controle",
  MOBILITY: "Mobilidade",
  DOT: "Dano contínuo",
  AOE: "Área",
  EXECUTE: "Execute",
  COUNTER: "Réplica",
  BUFF: "Apoio",
  DEBUFF: "Pressão",
  UTILITY: "Utilidade",
  SUSTAIN: "Sustento",
  SUPPORT: "Suporte",
};

function tagLabel(tag: string) {
  return TAG_PT[tag] ?? tag.replaceAll("_", " ");
}

export function GeneticCard({
  cardKey,
  locus,
  variant = "BASE",
  artUrl,
  imageHash,
  chassis,
  element,
  lifeStage,
  creatureId,
  size = "sheet",
  state = "NORMAL",
  disabled,
  openDetail,
  onPlay,
  presentation,
}: {
  cardKey: string;
  locus?: string | null;
  variant?: string;
  artUrl?: string | null;
  imageHash?: string | null;
  chassis?: ChassisView | null;
  element?: string | null;
  lifeStage?: string | null;
  creatureId?: string | null;
  size?: GeneticCardSize;
  state?: GeneticCardState;
  disabled?: boolean;
  openDetail?: boolean;
  onPlay?: () => void;
  presentation?: Partial<CardPresentation> & {
    sourceGenes?: string[];
    luckVariant?: string | null;
    effects?: Array<{
      op: string;
      value?: number;
      resource?: string;
      condition?: { resourceAtLeast?: number; targetHas?: string; selfPosition?: string };
    }>;
    resourceCurrent?: number;
    resourceName?: string;
    resourceReady?: boolean;
    sourceCreature?: string;
  };
}) {
  const card = {
    ...presentCard(cardKey),
    ...Object.fromEntries(Object.entries(presentation ?? {}).filter(([, value]) => value !== undefined)),
  };
  const [missingArt, setMissingArt] = useState(false);
  const [detail, setDetail] = useState(false);
  const shownLocus = locus ?? null;
  const treatment = cardTreatment({ type: card.type, locus: shownLocus });
  const resolvedState = disabled ? "DISABLED" : state;
  const creatureArt = Boolean(chassis) || Boolean(element ?? card.element);
  const src = missingArt || creatureArt ? null : cardArtSrc(cardKey, variant, artUrl, imageHash);
  const figureSize = size === "battle" || size === "hand" ? 150 : 210;

  const inner = (
    <>
      <div className="gx-card__art">
        {creatureArt ? (
          <div className="gx-card__creature">
            <CreatureGxrFigure
              chassis={chassis}
              element={element ?? card.element}
              lifeStage={lifeStage}
              creatureId={creatureId}
              context="CARD"
              size={figureSize}
            />
          </div>
        ) : src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" onError={() => setMissingArt(true)} />
        ) : (
          <div className="gx-card__art-fallback" />
        )}
        <div className="gx-card__art-fade" />
      </div>
      <div className="gx-card__frame">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={frameSrc(card.element, treatment)} alt="" />
      </div>
      <div className="gx-card__chrome">
        <span className="gx-card__cost" title={`Custo ${card.cost}`}>
          {card.cost}
        </span>
        {shownLocus ? <span className="gx-card__locus">{shownLocus}</span> : <span />}
      </div>
      {treatment === "ULTIMATE" ? <span className="gx-card__mark">SUPREMA</span> : null}
      {treatment === "SIGNATURE" ? <span className="gx-card__mark">ASSINATURA</span> : null}
      <div className="gx-card__body">
        {presentation?.sourceCreature ? <p className="gx-card__owner">{presentation.sourceCreature}</p> : null}
        <p className="gx-card__name">{card.name}</p>
        <p className="gx-card__meta">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={typeIconSrc(treatment)} alt="" />
          {card.typeLabel}
          <span className="gx-card__dot">·</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={elementIconSrc(card.element)} alt="" />
          {card.elementLabel}
        </p>
        <p className="gx-card__text">{card.text}</p>
        {(() => {
          const effects = presentation?.effects ?? [];
          const chips = effects.map((effect) => resourceChipFromEffect(effect)).filter((row): row is NonNullable<typeof row> => Boolean(row));
          const gate = resourcePlayGate(effects, presentation?.resourceCurrent ?? 0);
          const combo = effects.some(
            (effect) =>
              effect.op !== "CONSUME_RESOURCE" &&
              effect.condition?.resourceAtLeast != null &&
              (presentation?.resourceCurrent ?? 0) >= effect.condition.resourceAtLeast,
          );
          return (
            <>
              {chips.length > 0 ? (
                <div className="gx-card__chips">
                  {chips.map((chip) => (
                    <span key={chip.text} className="gx-card__chip" data-kind={chip.kind} data-ready={combo && chip.kind !== "consume" ? "true" : undefined}>
                      {chip.text}
                    </span>
                  ))}
                  {combo ? <span className="gx-card__chip" data-ready="true">✦ disponível</span> : null}
                </div>
              ) : null}
              {gate ? (
                <p className="gx-card__lock" title={`Faltam ${gate.missing} ${gate.name}`}>
                  Requer {gate.need} · atual {gate.have}
                </p>
              ) : null}
            </>
          );
        })()}
        {card.tags.length > 0 ? (
          <div className="gx-card__tags">
            {card.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="gx-card__tag">
                {tagLabel(tag)}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );

  const className = `gx-card gx-card--${size}`;
  const data = {
    "data-element": card.element,
    "data-type": card.type,
    "data-treatment": treatment,
    "data-state": resolvedState,
  };

  const node = onPlay ? (
    <button type="button" disabled={disabled} onClick={onPlay} className={className} {...data}>
      {inner}
    </button>
  ) : openDetail ? (
    <button type="button" className={className} {...data} onClick={() => setDetail(true)}>
      {inner}
    </button>
  ) : (
    <article className={className} {...data}>
      {inner}
    </article>
  );

  return (
    <>
      {node}
      {detail ? (
        <div className="gx-card-detail" role="dialog" onClick={() => setDetail(false)}>
          <div className="gx-card-detail__panel" onClick={(event) => event.stopPropagation()}>
            <GeneticCard
              cardKey={cardKey}
              locus={shownLocus}
              variant={variant}
              artUrl={artUrl}
              imageHash={imageHash}
              chassis={chassis}
              element={element}
              lifeStage={lifeStage}
              creatureId={creatureId}
              size="detail"
              presentation={presentation}
            />
            <div className="gx-card-detail__facts">
              <p>
                {shownLocus ?? "—"} · custo {card.cost} · {card.typeLabel} · {card.elementLabel}
              </p>
              <p>{card.text}</p>
              {card.tags.length > 0 ? <p>{card.tags.map(tagLabel).join(" · ")}</p> : null}
              {presentation?.sourceGenes && presentation.sourceGenes.length > 0 ? (
                <p>
                  Origem da manifestação: {presentation.sourceGenes.join(" · ")}
                  {presentation.luckVariant ? ` · sorte ${presentation.luckVariant}` : ""}
                </p>
              ) : null}
              <button type="button" className="text-gold" onClick={() => setDetail(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
