"use client";

import { useMemo, useState } from "react";
import { CreaturePickCard } from "../creature-pick-card";
import type { EnrichedCreature, ParentSlot } from "./types";

export function ParentSelector({
  slot,
  creatures,
  selectedId,
  onSelect,
  onClose,
}: {
  slot: ParentSlot;
  creatures: EnrichedCreature[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const gender = slot === "A" ? "MALE" : "FEMALE";
  const [species, setSpecies] = useState("");
  const [element, setElement] = useState("");
  const [typology, setTypology] = useState("");
  const pool = useMemo(
    () =>
      creatures.filter((row) => {
        if (row.gender !== gender) return false;
        if (species && row.speciesKey !== species) return false;
        if (element && String(row.elementPrimary) !== element) return false;
        if (typology && row.geneticPower?.typology !== typology && row.typology !== typology) return false;
        return true;
      }),
    [creatures, gender, species, element, typology],
  );
  const speciesOptions = [...new Set(creatures.filter((row) => row.gender === gender).map((row) => row.speciesKey).filter(Boolean))] as string[];
  const elementOptions = [...new Set(creatures.filter((row) => row.gender === gender).map((row) => String(row.elementPrimary)))];
  const typologyOptions = [
    ...new Set(
      creatures
        .filter((row) => row.gender === gender)
        .map((row) => row.geneticPower?.typology ?? row.typology)
        .filter(Boolean),
    ),
  ] as string[];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-void/80 p-4 md:items-center">
      <div className="max-h-[88vh] w-full max-w-2xl overflow-auto rounded-3xl border border-crystal/25 bg-panel p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-crystal">Select Genetic Parent</p>
            <h2 className="font-display text-2xl text-gold">Parent {slot}</h2>
          </div>
          <button type="button" className="text-sm text-muted" onClick={onClose}>
            Fechar
          </button>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          <select className="rounded-xl border border-[#2a2438] bg-void px-3 py-2 text-sm" value={species} onChange={(e) => setSpecies(e.target.value)}>
            <option value="">Espécie</option>
            {speciesOptions.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
          <select className="rounded-xl border border-[#2a2438] bg-void px-3 py-2 text-sm" value={element} onChange={(e) => setElement(e.target.value)}>
            <option value="">Elemento</option>
            {elementOptions.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
          <select className="rounded-xl border border-[#2a2438] bg-void px-3 py-2 text-sm" value={typology} onChange={(e) => setTypology(e.target.value)}>
            <option value="">Typology</option>
            {typologyOptions.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4 grid gap-2">
          {pool.map((row) => (
            <CreaturePickCard
              key={row.id}
              creature={row}
              selected={row.id === selectedId}
              onSelect={() => {
                onSelect(row.id === selectedId ? "" : row.id);
                onClose();
              }}
            />
          ))}
          {pool.length === 0 ? (
            <p className="text-sm text-muted">
              {gender === "MALE"
                ? "Nenhum macho neste filtro. Parent A só aceita macho."
                : "Nenhuma fêmea neste filtro. Parent B só aceita fêmea."}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
