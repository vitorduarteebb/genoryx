"use client";

import { cardElementLabel } from "@nexora/config";
import type { Element } from "@nexora/types";
import { elementTone } from "./creature-pick-card";

export type BattleCreature = {
  id: string;
  name: string;
  speciesKey?: string;
  element?: string;
  hp: number;
  maxHp: number;
  shield: number;
};

export function BattleUnit({ unit, foe }: { unit: BattleCreature; foe?: boolean }) {
  const element = unit.element ?? "ARCANE";
  const ratio = unit.maxHp > 0 ? Math.max(0, Math.min(1, unit.hp / unit.maxHp)) : 0;
  const low = ratio <= 0.35;
  const mark = (unit.speciesKey ?? unit.name).slice(0, 1).toUpperCase();

  return (
    <article
      className={`flex items-center gap-3 rounded-2xl border p-3 ${
        foe ? "border-ember/30 bg-ember/5" : "border-gold/25 bg-gold/5"
      }`}
    >
      <div
        className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-b shadow-[0_0_20px_rgba(126,224,214,0.12)] ${elementTone(element)}`}
      >
        <span className="font-display text-2xl leading-none">{mark}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-[0.18em] text-crystal">
          {cardElementLabel(element as Element)}
          {unit.speciesKey ? ` · ${unit.speciesKey}` : ""}
        </p>
        <p className="truncate font-display text-lg text-gold">{unit.name}</p>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#2a2438]">
          <div
            className={`h-full rounded-full ${low ? "bg-ember" : foe ? "bg-crystal" : "bg-gold"}`}
            style={{ width: `${ratio * 100}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-muted">
          {unit.hp}/{unit.maxHp}
          {unit.shield ? ` · +${unit.shield} escudo` : ""}
        </p>
      </div>
    </article>
  );
}
