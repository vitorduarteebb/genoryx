"use client";

import { cardElementLabel } from "@nexora/config";
import type { Element } from "@nexora/types";
import Link from "next/link";
import type { ReactNode } from "react";
import { shortCreatureId } from "../lib/gxr-kit";
import { CreaturePortrait } from "./creature-portrait";
import type { CreaturePick } from "./creature-pick-card";
import "./creature-collect-card.css";

const ELEMENT_MARK: Record<string, string> = {
  FIRE: "🔥",
  WATER: "💧",
  NATURE: "🌿",
  EARTH: "🪨",
  ELECTRIC: "⚡",
  ICE: "❄️",
  LIGHT: "✦",
  DARK: "◆",
  ARCANE: "✧",
};

export function CreatureCollectCard({
  creature,
  level,
  priceGold,
  priceHint,
  listedAt,
  selected,
  disabled,
  lockHint,
  href,
  onSelect,
  caption,
  badge,
}: {
  creature: CreaturePick;
  level?: number;
  priceGold?: string;
  priceHint?: string;
  listedAt?: string;
  selected?: boolean;
  disabled?: boolean;
  lockHint?: string | null;
  href?: string;
  onSelect?: () => void;
  caption?: string;
  badge?: string | null;
}) {
  const element = String(creature.elementPrimary);
  const locked = Boolean(disabled);
  const inner = (
    <>
      <div className="gx-collect__stage" data-element={element}>
        <span className="gx-collect__level">{level ?? creature.generation}</span>
        <div className="gx-collect__meta">
          <span title={cardElementLabel(element as Element)}>{ELEMENT_MARK[element] ?? "✧"}</span>
          <span className="gx-collect__egg" title="Fertilidade">
            ○ {creature.fertility}/5
          </span>
        </div>
        <CreaturePortrait
          revealStatus={creature.revealStatus}
          visual={creature.visual}
          chassis={creature.chassis}
          bodyPlan={creature.bodyPlan}
          element={element}
          lifeStage={creature.lifeStage}
          temperament={creature.temperament}
          visualSeed={creature.visualSeed}
          creatureId={creature.id}
          context="MARKET"
          size={200}
        />
        {badge ? <span className="gx-collect__badge">{badge}</span> : null}
        {href ? <span className="gx-collect__open">Abrir ficha</span> : null}
      </div>
      <div className="gx-collect__foot">
        <span className="gx-collect__id">
          <span>{ELEMENT_MARK[element] ?? "✧"}</span>#{shortCreatureId(creature.id)}
        </span>
        <p className="gx-collect__name">{creature.name}</p>
        {caption ? <p className="gx-collect__caption">{caption}</p> : null}
        {priceGold ? (
          <p className="gx-collect__price">
            {priceGold} GOLD
            {priceHint ? <span className="gx-collect__hint">{priceHint}</span> : null}
          </p>
        ) : null}
        {listedAt ? <p className="gx-collect__time">{listedAt}</p> : null}
        {lockHint ? <p className="gx-collect__lock">{lockHint}</p> : null}
      </div>
    </>
  );

  const attrs = { "data-selected": selected ? "true" : "false", "data-locked": locked ? "true" : "false" };

  if (href) {
    return (
      <Link href={href} className="gx-collect" {...attrs}>
        {inner}
      </Link>
    );
  }
  if (onSelect) {
    return (
      <button type="button" disabled={locked} onClick={onSelect} className="gx-collect w-full" {...attrs}>
        {inner}
      </button>
    );
  }
  return <article className="gx-collect" {...attrs}>{inner}</article>;
}

export function CollectStage({
  children,
  element,
  className = "",
}: {
  children: ReactNode;
  element: string;
  className?: string;
}) {
  return (
    <div className={`gx-collect__stage ${className}`} data-element={element}>
      {children}
    </div>
  );
}
