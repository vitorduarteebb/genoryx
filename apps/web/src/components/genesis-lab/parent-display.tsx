"use client";

import { cardElementLabel } from "@nexora/config";
import type { Element } from "@nexora/types";
import { CreaturePortrait } from "../creature-portrait";
import { FertilityPips, genderLabel, type CreaturePick } from "../creature-pick-card";
import type { EnrichedCreature, ParentSlot } from "./types";

export function ParentDisplay({
  slot,
  creature,
  empty,
  onOpen,
}: {
  slot: ParentSlot;
  creature?: EnrichedCreature | CreaturePick;
  empty: string;
  onOpen: () => void;
}) {
  const power = "geneticPower" in (creature ?? {}) ? creature?.geneticPower : null;
  const mutation = "mutation" in (creature ?? {}) ? creature?.mutation : null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative w-full overflow-hidden rounded-3xl border border-[#2a2438] bg-void/50 p-4 text-left transition hover:border-crystal/40"
    >
      <p className="text-[10px] uppercase tracking-[0.32em] text-crystal">Parent {slot}</p>
      {creature ? (
        <div className="mt-3 space-y-3">
          <div className="flex justify-center">
            <CreaturePortrait chassis={creature.chassis} element={String(creature.elementPrimary)}
              modelUrl={creature.model?.status === "READY" ? creature.model.url : null}
              creatureId={creature.id} lifeStage={creature.lifeStage} visualSeed={creature.visualSeed}
              temperament={creature.temperament} visual={creature.visual} revealStatus={creature.revealStatus}
              portraitUrl={creature.portraitUrl} context="BREEDING" size={280} />
          </div>
          <div>
            <p className="font-display text-2xl text-gold">{creature.name}</p>
            <p className="text-xs text-muted">
              {creature.speciesName} · {genderLabel(creature.gender)} · Gen {creature.generation}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-crystal">
              {cardElementLabel(String(creature.elementPrimary) as Element)} · {power?.typology ?? creature.lifeStage}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-muted">
            <p>Estágio · {creature.lifeStage ?? "—"}</p>
            <p className="flex items-center gap-2">
              Fertilidade <FertilityPips value={creature.fertility} />
            </p>
            {power ? (
              <p className="col-span-2 text-gold">
                {power.name}
                {power.lineageId ? <span className="ml-2 text-muted">Lineage #{power.lineageId.replace(/-/g, "").slice(-4)}</span> : null}
              </p>
            ) : null}
            {mutation ? <p className="col-span-2">Mutação conhecida</p> : null}
          </div>
        </div>
      ) : (
        <p className="mt-16 text-center text-sm text-muted">{empty}</p>
      )}
    </button>
  );
}
