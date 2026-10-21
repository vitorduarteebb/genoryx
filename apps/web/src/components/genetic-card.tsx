"use client";

import type { CardPresentation, ChassisView } from "@nexora/config";
import { buildCardReadout, presentCard, resourceGateCopy, resourcePlayGate } from "@nexora/config";
import { useState } from "react";
import { cardArtSrc } from "../lib/card-art";
import {
  cardTreatment,
  elementIconSrc,
  frameSrc,
  type GeneticCardSize,
  type GeneticCardState,
} from "../lib/card-chrome";
import { CreatureGxrFigure } from "./creature-gxr-figure";
import "./genetic-card.css";
import "./personal-resource.css";

type PresentationExtra = Partial<CardPresentation> & {
  sourceGenes?: string[];
  luckVariant?: string | null;
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
  resourceReady?: boolean;
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
  nested = false,
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
  presentation?: PresentationExtra;
  nested?: boolean;
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
  const frameElement = element ?? card.element;
  const creatureArt = Boolean(chassis) || Boolean(frameElement);
  const src = missingArt || creatureArt ? null : cardArtSrc(cardKey, variant, artUrl, imageHash);
  const figureSize = size === "battle" || size === "hand" ? 132 : 200;
  const effects = presentation?.effects ?? [];
  const readout = buildCardReadout({
    name: card.name,
    cost: card.cost,
    type: card.type,
    element: frameElement,
    locus: shownLocus,
    tags: card.tags,
    effects,
    domain: presentation?.domain ?? presentation?.domainLabel,
    speed: presentation?.speed ?? presentation?.speedLabel,
    estimatedDamage: presentation?.estimatedDamage,
    estimatedShield: presentation?.estimatedShield,
    estimatedHeal: presentation?.estimatedHeal,
  });
  const gate = resourcePlayGate(effects, presentation?.resourceCurrent ?? 0);
  const consume = effects.find((row) => row.op === "CONSUME_RESOURCE");

  const face = (
    <>
      <div className="gx-card__art">
        {creatureArt ? (
          <div className="gx-card__creature">
            <CreatureGxrFigure
              chassis={chassis}
              element={frameElement}
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
        <img src={frameSrc(frameElement, treatment)} alt="" />
      </div>
      <div className="gx-card__chrome">
        <span className="gx-card__cost" title={`${card.cost} Energia`}>
          <small>⚡</small>
          {card.cost}
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="gx-card__element" src={elementIconSrc(frameElement)} alt={card.elementLabel} title={card.elementLabel} />
      </div>
      {treatment === "ULTIMATE" ? <span className="gx-card__mark">SUPREMA</span> : null}
      {treatment === "SIGNATURE" ? <span className="gx-card__mark">ASSINATURA</span> : null}
      {treatment === "REACTION" ? <span className="gx-card__mark gx-card__mark--reaction">REAÇÃO</span> : null}
      <div className="gx-card__body">
        <p className="gx-card__name">{card.name}</p>
        {readout.triggerLine ? <p className="gx-card__trigger">{readout.triggerLine}</p> : null}
        <ul className="gx-card__effects">
          {readout.faceLines.map((line) => (
            <li key={`${line.kind}-${line.label}`} className={`gx-card__line gx-card__line--${line.kind}`}>
              <span aria-hidden>{line.icon}</span>
              <strong>{line.label}</strong>
            </li>
          ))}
          {readout.conditionLines.map((line) => (
            <li key={`cond-${line.label}`} className="gx-card__line gx-card__line--condition">
              <span aria-hidden>{line.icon}</span>
              <strong>{line.label}</strong>
            </li>
          ))}
        </ul>
        {gate ? (
          <p className="gx-card__lock">
            {resourceGateCopy({
              need: gate.need,
              have: gate.have,
              name: gate.name,
              consumeAmount: consume?.value,
            })}
          </p>
        ) : null}
        <div className="gx-card__badges">
          {readout.badges.map((badge) => (
            <span key={badge.key} className="gx-card__badge" data-badge={badge.key}>
              {badge.label}
            </span>
          ))}
          {shownLocus ? (
            <span className="gx-card__badge gx-card__badge--quiet" title="Origem genética">
              {shownLocus}
            </span>
          ) : null}
        </div>
        {readout.keywords.length > 0 ? (
          <div className="gx-card__keywords">
            {readout.keywords.slice(0, 3).map((row) => (
              <span key={row.key} className="gx-card__keyword" title={row.help}>
                {row.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );

  const className = `gx-card gx-card--${size}`;
  const dataAttrs = {
    "data-element": frameElement,
    "data-type": card.type,
    "data-treatment": treatment,
    "data-state": resolvedState,
  };

  return (
    <>
      <div className={`${className}${onPlay ? " gx-card--interactive" : ""}`} {...dataAttrs}>
        {onPlay ? (
          <button type="button" disabled={disabled} className="gx-card__play" onClick={onPlay} aria-label={`Jogar ${card.name}`}>
            {face}
          </button>
        ) : openDetail && !nested ? (
          <button type="button" className="gx-card__play" onClick={() => setDetail(true)} aria-label={`Detalhes de ${card.name}`}>
            {face}
          </button>
        ) : (
          face
        )}
        {!nested ? (
          <button type="button" className="gx-card__more" onClick={() => setDetail(true)}>
            Detalhes
          </button>
        ) : null}
      </div>
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
              nested
              presentation={{ ...presentation, effects }}
            />
            <div className="gx-card-detail__facts">
              <h3>{card.name}</h3>
              <dl>
                {readout.details.scaling ? (
                  <>
                    <dt>Scaling</dt>
                    <dd title="Escala do atributo ofensivo">{readout.details.scaling}</dd>
                  </>
                ) : null}
                {readout.details.defense ? (
                  <>
                    <dt>Defesa utilizada</dt>
                    <dd>{readout.details.defense}</dd>
                  </>
                ) : null}
                {readout.details.domain ? (
                  <>
                    <dt>Domínio</dt>
                    <dd>{readout.details.domain}</dd>
                  </>
                ) : null}
                {readout.details.speed ? (
                  <>
                    <dt>Velocidade</dt>
                    <dd>{readout.details.speed}</dd>
                  </>
                ) : null}
                {readout.details.locus ? (
                  <>
                    <dt>Origem genética</dt>
                    <dd>{readout.details.locus}</dd>
                  </>
                ) : null}
                {readout.details.resourceNote ? (
                  <>
                    <dt>Recurso</dt>
                    <dd>{readout.details.resourceNote}</dd>
                  </>
                ) : null}
                {presentation?.genomeDetails ? (
                  <>
                    <dt>Genome</dt>
                    <dd>{presentation.genomeDetails}</dd>
                  </>
                ) : null}
              </dl>
              {readout.keywords.length > 0 ? (
                <ul className="gx-card-detail__keys">
                  {readout.keywords.map((row) => (
                    <li key={row.key}>
                      <strong>{row.label}</strong>
                      <span>{row.help}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {readout.details.fantasyNote ? <p className="gx-card-detail__note">{readout.details.fantasyNote}</p> : null}
              {presentation?.sourceCreature ? <p className="gx-card-detail__owner">Criatura: {presentation.sourceCreature}</p> : null}
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
