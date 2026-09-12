"use client";

import { cardElementLabel } from "@nexora/config";
import type { Element } from "@nexora/types";
import type { BreedingPreview } from "./types";

export function GeneticAnalysis({ preview }: { preview: BreedingPreview | null }) {
  if (!preview) {
    return <p className="text-sm text-muted">A análise genética aparece quando os dois pais estão no núcleo.</p>;
  }
  const { crossPotential } = preview;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section>
        <p className="text-[10px] uppercase tracking-[0.24em] text-crystal">Possibilities</p>
        <p className="mt-2 text-sm text-gold">
          Elementos: {crossPotential.possibleElements.map((el) => cardElementLabel(el as Element)).join(" / ")}
        </p>
        <p className="mt-1 text-sm text-gold">
          Typologies: {crossPotential.possibleTypologies.length ? crossPotential.possibleTypologies.join(" / ") : "—"}
        </p>
        <p className="mt-1 text-sm text-muted">Herança de poder: Pai / Mãe / Novo — sem resultado final.</p>
      </section>
      <section>
        <p className="text-[10px] uppercase tracking-[0.24em] text-crystal">Power Inheritance</p>
        <p className="mt-2 text-sm text-muted">33.33% Parent A</p>
        <p className="text-sm text-muted">33.33% Parent B</p>
        <p className="text-sm text-muted">33.33% New Genetic Power</p>
      </section>
    </div>
  );
}
