"use client";

import type { ChassisView } from "@nexora/config";
import { CreatureGxrFigure } from "../../../components/creature-gxr-figure";

export type LabCreature = {
  creatureId: string;
  name: string;
  speciesKey: string;
  speciesName: string;
  element: string;
  typology: string;
  powerName: string;
  lifeStage: string;
  hp?: number;
  portraitUrl: string | null;
  chassis?: ChassisView | null;
  temperament?: string | null;
  visualSeed?: string | null;
  banned?: boolean;
  benched?: boolean;
  selected?: boolean;
  locked?: boolean;
  lock?: string;
};

const LAB_LOCK_MARK: Record<string, string> = {
  BATTLE: "em combate",
  MARKET: "à venda",
  BREEDING: "na Lyra",
};

export function LabCreatureCard({
  row,
  on,
  banned,
  mark,
  size = 140,
  onClick,
}: {
  row: LabCreature;
  on?: boolean;
  banned?: boolean;
  mark?: string;
  size?: number;
  onClick?: () => void;
}) {
  const occupied = Boolean(row.locked);
  const lockMark = occupied ? LAB_LOCK_MARK[row.lock ?? ""] ?? "ocupada" : mark;
  return (
    <button
      type="button"
      disabled={banned || occupied || !onClick}
      onClick={onClick}
      className="gx-lab__unit"
      data-on={on ? "true" : "false"}
      data-banned={banned || occupied ? "true" : "false"}
    >
      <div className="gx-lab__figure">
        <CreatureGxrFigure
          chassis={row.chassis}
          element={row.element}
          lifeStage={row.lifeStage}
          temperament={row.temperament}
          visualSeed={row.visualSeed}
          creatureId={row.creatureId}
          context="MARKET"
          animationState={on ? "BATTLE_IDLE" : "IDLE"}
          facing={0.15}
          label={row.name}
          size={size}
        />
      </div>
      <p className="gx-lab__name">{row.name}</p>
      <p className="gx-lab__meta">
        {row.element} · {row.typology}
      </p>
      {banned || lockMark ? <span className="gx-lab__mark">{banned ? "banida" : lockMark}</span> : null}
    </button>
  );
}
