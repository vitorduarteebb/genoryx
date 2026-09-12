"use client";

import type { ChassisView } from "@nexora/config";
import { useEffect, useState } from "react";
import { BattleSilhouette } from "./battle-silhouette";
import { officialPortraitSrc } from "../lib/creature-art";
import { CreatureGxrFigure } from "./creature-gxr-figure";
import { elementIconSrc } from "../lib/card-chrome";
import type { CreatureVisualState } from "../lib/creature-visual-contract";
import { PersonalResourceHelp } from "./personal-resource-help";
import type { PersonalResourceDefinition } from "@nexora/config";

export type BattleCreatureVisual = {
  renderMode?: string;
  modelUrl?: string | null;
  portraitUrl?: string | null;
  imageHash?: string | null;
  lifeStage?: string;
  temperament?: string | null;
  bodyPlan?: string | null;
  mutation?: string | null;
  aura?: string | null;
  visualSeed?: string | null;
  chassis?: ChassisView | null;
  source?: string;
  url?: string | null;
  forming?: boolean;
};

export type BattleCreatureView = {
  id: string;
  creatureId?: string;
  name: string;
  speciesKey?: string;
  element?: string;
  hp: number;
  maxHp: number;
  shield: number;
  slot?: string;
  statuses?: Array<{ key: string; stacks: number }>;
  resources?: Record<string, number>;
  resourceCap?: Record<string, number>;
  resourceDef?: PersonalResourceDefinition;
  resourceFlash?: { text: string; key: number } | null;
  visual?: BattleCreatureVisual | null;
  model?: { status: string; url: string | null; version: number } | null;
  chassis?: ChassisView | null;
  supremeReady?: boolean;
};

export function BattleCreature({
  unit,
  foe,
  target,
  anim,
  animKey,
  onSelect,
  onHover,
  debug,
}: {
  unit: BattleCreatureView;
  foe?: boolean;
  target?: "valid" | "invalid" | null;
  anim?: CreatureVisualState;
  animKey?: number;
  onSelect?: () => void;
  onHover?: (on: boolean) => void;
  debug?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  const ratio = unit.maxHp > 0 ? Math.max(0, Math.min(1, unit.hp / unit.maxHp)) : 0;
  const portrait = officialPortraitSrc(unit.visual?.portraitUrl ?? unit.visual?.url);
  const ko = unit.hp <= 0;
  const pose: CreatureVisualState = ko ? "KO" : anim ?? "BATTLE_IDLE";
  const chassis = unit.chassis ?? unit.visual?.chassis ?? null;
  const forming = Boolean(unit.visual?.forming) && !portrait && !chassis;

  useEffect(() => {
    setBroken(false);
  }, [portrait]);

  return (
    <article
      className="gx-creature"
      data-slot={unit.slot ?? "FRONT"}
      data-depth={unit.slot === "FRONT" ? "FRONT" : unit.slot === "MIDDLE" ? "MIDDLE" : "BACK"}
      data-side={foe ? "foe" : "you"}
      data-target={target ?? undefined}
      data-anim={pose}
      data-temperament={unit.visual?.temperament ?? undefined}
      data-stage={unit.visual?.lifeStage ?? undefined}
      data-clickable={Boolean(onSelect)}
      onClick={() => onSelect?.()}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
    >
      <div className="gx-creature__hud">
        <p className="gx-creature__name">{unit.name}</p>
        <div className="gx-creature__bar">
          <div className="gx-creature__hp" data-low={ratio <= 0.35} style={{ width: `${ratio * 100}%` }} />
        </div>
        <p className="gx-creature__meta">
          {unit.element ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={elementIconSrc(unit.element)} alt="" />
          ) : null}
          {unit.hp}/{unit.maxHp}
          {unit.shield > 0 ? ` · +${unit.shield}` : ""}
        </p>
        {unit.resourceDef ? (
          <PersonalResourceHelp
            compact
            debug={debug}
            current={unit.resources?.[unit.resourceDef.id] ?? 0}
            definition={unit.resourceDef}
          />
        ) : null}
        {unit.resourceFlash ? <p className="gx-creature__flash">{unit.resourceFlash.text}</p> : null}
        {unit.statuses && unit.statuses.length > 0 ? (
          <div className="gx-creature__statuses">
            {unit.statuses.map((status) => (
              <span key={status.key} className="gx-creature__status">
                {status.key.slice(0, 3)}
                {status.stacks > 1 ? status.stacks : ""}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="gx-creature__body">
        {forming ? (
          <BattleSilhouette name={unit.speciesKey ?? unit.name} loading />
        ) : chassis || !portrait || broken ? (
          <CreatureGxrFigure
            chassis={chassis}
            element={unit.element}
            lifeStage={unit.visual?.lifeStage}
            temperament={unit.visual?.temperament}
            visualSeed={unit.visual?.visualSeed}
            aura={unit.visual?.aura}
            creatureId={unit.creatureId ?? unit.id}
            bodyPlan={unit.visual?.bodyPlan}
            context="BATTLE"
            animationState={pose}
            animationKey={animKey}
            teamSide={foe ? "FOE" : "YOU"}
            label={unit.name}
            size={unit.slot === "FRONT" ? 210 : unit.slot === "BACK" || unit.slot === "BACK_LEFT" || unit.slot === "BACK_RIGHT" ? 168 : 188}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="gx-creature__art" src={portrait} alt="" onError={() => setBroken(true)} />
        )}
        <span className="gx-creature__shadow" aria-hidden />
      </div>
    </article>
  );
}
