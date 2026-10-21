"use client";

import { buildCardReadout } from "@nexora/config";
import { refineSealedKit, type SealedCardInput } from "@nexora/game-engine";
import { GeneticCard } from "../../../components/genetic-card";
import { GameShell } from "../../../components/game-shell";

const RAW_SAMPLES: SealedCardInput[] = [
  {
    key: "labareda",
    name: "Labareda Incandescente",
    cost: 1,
    element: "FIRE",
    locus: "G3",
    function: "ATTACK",
    effects: [
      { op: "DAMAGE", value: 11 },
      { op: "APPLY_STATUS", status: "BURN", duration: 3 },
    ],
  },
  {
    key: "pulso",
    name: "Pulso Ardente",
    cost: 1,
    element: "FIRE",
    locus: "G5",
    function: "BUFF",
    effects: [
      { op: "CONSUME_RESOURCE", value: 2, resource: "HEAT", condition: { resourceAtLeast: 1 } },
      { op: "GAIN_ENERGY", value: 1 },
    ],
  },
  {
    key: "veu",
    name: "Véu Ardente",
    cost: 1,
    element: "FIRE",
    locus: "G4",
    function: "SHIELD",
    effects: [{ op: "SHIELD", value: 18 }],
  },
  {
    key: "guarda",
    name: "Guarda Ardente",
    cost: 1,
    element: "FIRE",
    locus: "G8",
    function: "SHIELD",
    effects: [{ op: "SHIELD", value: 19 }],
  },
  {
    key: "descarga",
    name: "Descarga Elétrica",
    cost: 1,
    element: "ELECTRIC",
    locus: "G5",
    function: "BUFF",
    effects: [{ op: "GAIN_ENERGY", value: 1 }],
  },
  {
    key: "retorno",
    name: "Retorno Ígneo",
    cost: 1,
    element: "FIRE",
    locus: "G7",
    function: "COUNTER",
    type: "REACTION",
    effects: [
      { op: "DAMAGE", value: 9, condition: { targetHas: "BURN" } },
      { op: "SHIELD", value: 10, condition: { targetHas: "BURN" } },
    ],
  },
  {
    key: "prisao",
    name: "Prisão Ardente",
    cost: 2,
    element: "FIRE",
    locus: "G6",
    function: "CONTROL",
    effects: [
      { op: "APPLY_STATUS", status: "BURN", duration: 2 },
      { op: "DAMAGE", value: 8 },
    ],
  },
  {
    key: "marca",
    name: "Marca Incandescente",
    cost: 1,
    element: "FIRE",
    locus: "G2",
    function: "DEBUFF",
    effects: [
      { op: "APPLY_STATUS", status: "BURN", duration: 2 },
      { op: "DAMAGE", value: 6 },
    ],
  },
  {
    key: "mordida",
    name: "Mordida Ardente",
    cost: 2,
    element: "FIRE",
    locus: "G1",
    function: "ATTACK",
    effects: [
      { op: "DAMAGE", value: 14 },
      { op: "APPLY_STATUS", status: "BURN", duration: 2 },
    ],
  },
];

const REFINED = refineSealedKit(RAW_SAMPLES);

export default function CardFacePreviewPage() {
  return (
    <GameShell
      kicker="QA conteúdo"
      title="Card Face + Content Pass"
      subtitle="Hierarquia aprovada + efeitos refinados (sem reroll de kits)."
    >
      <div className="gx-card-grid">
        {RAW_SAMPLES.map((sample, index) => {
          const refined = REFINED[index]!;
          const presentation = {
            name: sample.name,
            cost: sample.cost,
            type: (sample.type ?? (sample.locus === "G7" ? "REACTION" : "SKILL")) as
              | "ATTACK"
              | "REACTION"
              | "SKILL"
              | "ULTIMATE"
              | "GENETIC"
              | "SYNERGY",
            element: String(sample.element) as
              | "FIRE"
              | "WATER"
              | "NATURE"
              | "EARTH"
              | "ELECTRIC"
              | "ICE"
              | "LIGHT"
              | "DARK"
              | "ARCANE",
            domain: refined.domain,
            speed: refined.speed,
            effects: refined.effects,
            locus: sample.locus,
            tags: refined.tags,
          };
          const readout = buildCardReadout(presentation);
          const detailBits = [
            readout.details.scaling,
            ...(refined.changes.length ? [`Content: ${refined.changes.join("; ")}`] : []),
            `Roles: ${refined.roles.join(", ")}`,
          ].filter(Boolean) as string[];
          return (
            <div key={sample.key} style={{ display: "grid", gap: 8, justifyItems: "center" }}>
              <GeneticCard
                cardKey={sample.key === "descarga" ? "spark_jolt" : "ember_strike"}
                locus={sample.locus}
                element={presentation.element}
                openDetail
                presentation={{
                  name: sample.name,
                  cost: sample.cost,
                  type: presentation.type,
                  element: presentation.element,
                  domain: refined.domain,
                  speed: refined.speed,
                  effects: [...refined.effects],
                  genomeDetails: detailBits.join(" · "),
                }}
              />
              <p className="text-sm text-muted" style={{ maxWidth: 220, textAlign: "center" }}>
                {readout.faceSummary}
              </p>
            </div>
          );
        })}
      </div>
    </GameShell>
  );
}
