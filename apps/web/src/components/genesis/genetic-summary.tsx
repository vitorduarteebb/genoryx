"use client";

import Link from "next/link";

export function GeneticSummary({
  speciesName,
  generation,
  bodyPlan,
  temperament,
  rareExpression,
  creatureId,
  element,
  typology,
  mutation,
  geneticPower,
  powerOrigin,
  genesisGrade,
  newGeneticPower,
}: {
  speciesName: string;
  generation: number;
  bodyPlan: string;
  temperament: string;
  rareExpression?: boolean;
  creatureId: string;
  element?: string | null;
  typology?: string | null;
  mutation?: string | null;
  geneticPower?: string | null;
  powerOrigin?: string | null;
  genesisGrade?: string | null;
  newGeneticPower?: boolean;
}) {
  return (
    <div className="space-y-3 px-6 py-8 text-center">
      <p className="text-[10px] uppercase tracking-[0.28em] text-crystal">New life created</p>
      <p className="font-display text-4xl text-gold">{speciesName}</p>
      <p className="text-sm uppercase tracking-[0.22em] text-crystal">Generation {generation}</p>
      <p className="text-sm text-muted">
        {[element, typology, bodyPlan, temperament].filter(Boolean).join(" · ")}
      </p>
      {geneticPower ? <p className="text-sm text-gold">{geneticPower}</p> : null}
      {powerOrigin ? <p className="text-xs text-muted">Origem do poder · {powerOrigin}</p> : null}
      {genesisGrade ? <p className="text-xs uppercase tracking-[0.2em] text-crystal">Genesis Grade · {genesisGrade}</p> : null}
      {newGeneticPower ? <p className="text-xs uppercase tracking-[0.2em] text-gold">New genetic power discovered</p> : null}
      {mutation ? <p className="text-xs text-ember">Mutação · {mutation}</p> : null}
      {rareExpression ? <p className="text-xs uppercase tracking-[0.2em] text-gold">Rare genetic expression</p> : null}
      <Link
        href={`/game/creatures/${creatureId}`}
        className="inline-block rounded-full border border-gold/50 px-5 py-2 text-sm text-gold"
      >
        Ver genética
      </Link>
    </div>
  );
}
