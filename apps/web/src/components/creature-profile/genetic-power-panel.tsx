"use client";

import { elementIconSrc } from "../../lib/card-chrome";
import { HELP, elementLabel, typologyProfile } from "../../lib/creature-lexicon";
import { Tip } from "./sheet-tip";

export type GeneticPowerCardView = {
  locus: string;
  role: string;
  name: string;
  namePt: string;
  text: string;
  catalogKey: string | null;
  cost?: number;
  tier?: string;
  function?: string;
  targetType?: string;
  tags?: string[];
  sourceGenes?: string[];
  luckVariant?: string | null;
  produces?: string[];
  consumes?: string[];
  artUrl?: string | null;
  imageHash?: string | null;
};

export type GeneticPowerView = {
  name: string;
  element: string;
  typology: string;
  originType: string;
  powerLineageId?: string | null;
  lineageId?: string | null;
  cards?: GeneticPowerCardView[];
};

const ORIGIN: Record<string, string> = {
  GENESIS: "Nascido na gênese",
  INHERITED_FATHER: "Herdado do pai",
  INHERITED_MOTHER: "Herdado da mãe",
  MUTATED_NEW: "Poder novo",
};

export function GeneticPowerPanel({
  power,
  onOpenCards,
}: {
  power: GeneticPowerView;
  onOpenCards?: () => void;
}) {
  const profile = typologyProfile(power.typology);
  const preview = (power.cards ?? []).slice(0, 3);
  return (
    <section className="gx-power">
      <div>
        <Tip help={HELP.geneticPower}>
          <p className="gx-power__kicker">Poder genético principal</p>
        </Tip>
        <h2>{power.name}</h2>
        <p className="gx-power__meta">
          {power.element ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={elementIconSrc(power.element)} alt="" />
          ) : null}
          {elementLabel(power.element)} · {profile.role} · {ORIGIN[power.originType] ?? power.originType}
        </p>
        <p className="gx-power__lead">
          Esta é a identidade especial da criatura. Ela define o tema das{" "}
          <Tip help={HELP.manifestations}>10 habilidades genéticas</Tip> usadas no combate.
        </p>
      </div>
      <div className="gx-power__side">
        {preview.length > 0 ? (
          <ul>
            {preview.map((card) => (
              <li key={card.locus}>
                <small>{card.locus}</small>
                {card.namePt || card.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="gx-power__empty">As 10 manifestações aparecem na aba Cartas.</p>
        )}
        {onOpenCards ? (
          <button type="button" onClick={onOpenCards}>
            Abrir cartas
          </button>
        ) : null}
      </div>
    </section>
  );
}
