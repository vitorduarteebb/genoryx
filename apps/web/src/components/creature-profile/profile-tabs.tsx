"use client";

import { presentCard } from "@nexora/config";
import Link from "next/link";
import { useState } from "react";
import { GeneticCard } from "../genetic-card";
import { CreaturePortrait } from "../creature-portrait";
import { HashCopy } from "./identity-panel";
import type { GeneticPowerView } from "./genetic-power-panel";
import { Tip } from "./sheet-tip";
import {
  HELP,
  STAT_META,
  combatReadout,
  creatureBlurb,
  elementLabel,
  mutationLabel,
  originLabel,
  prettyToken,
  stageLabel,
  typologyProfile,
} from "../../lib/creature-lexicon";

export const PROFILE_TABS = ["OVERVIEW", "GENETICS", "CARDS", "LINEAGE", "HISTORY", "NFT"] as const;
export type ProfileTab = (typeof PROFILE_TABS)[number];

const TAB_UI: Record<ProfileTab, { label: string; hint: string }> = {
  OVERVIEW: { label: "Visão geral", hint: "Resumo da criatura" },
  GENETICS: { label: "Genética", hint: "Genes, traços e composição" },
  CARDS: { label: "Cartas", hint: "Habilidades no combate" },
  LINEAGE: { label: "Linhagem", hint: "Pais e ancestrais" },
  HISTORY: { label: "Histórico", hint: "Origem e eventos" },
  NFT: { label: "Propriedade", hint: "Registro e NFT" },
};

export type Kin = {
  id: string;
  name: string;
  speciesName: string;
  generation: number;
  portraitUrl?: string | null;
  visual?: Parameters<typeof CreaturePortrait>[0]["visual"];
  visualStatus?: string | null;
  revealStatus?: string | null;
  bodyPlan?: string | null;
  head?: string | null;
  elementPrimary?: string;
  speciesKey?: string | null;
  genesisSeed?: number;
  phenotype?: Parameters<typeof CreaturePortrait>[0]["phenotype"];
  chassis?: Parameters<typeof CreaturePortrait>[0]["chassis"];
  owned?: boolean;
};

const TRAIT_LABEL: Record<string, string> = {
  body: "Corpo",
  head: "Cabeça",
  eyes: "Olhos",
  horns: "Chifres",
  frontLimbs: "Patas dianteiras",
  rearLimbs: "Patas traseiras",
  tail: "Cauda",
  back: "Dorso",
  core: "Núcleo",
  pattern: "Padrão",
  aura: "Aura",
  temperament: "Personalidade",
  mutation: "Mutação",
};

type SheetRow = {
  name?: string;
  speciesName: string;
  level: number;
  origin?: string;
  birthDate?: string;
  generation: number;
  mutation: string | null;
  geneticHash: string | null;
  geneticPurity: number | null;
  fertility?: number;
  lifeStage?: string;
  temperament?: string | null;
  bodyPlan?: string | null;
  genes: Record<string, string>;
  physical: Record<string, string | null> | null;
  loci: Array<{
    key: string;
    expressed: string;
    recessive: string;
    expressedName?: string;
    expressedText?: string;
    cost?: number;
    sourceGenes?: string[];
    luckVariant?: string | null;
  }>;
  geneticPower?: GeneticPowerView;
  parents: { father: Kin | null; mother: Kin | null };
  chassis?: Parameters<typeof CreaturePortrait>[0]["chassis"];
  elementPrimary?: string;
  elementSecondary?: string | null;
};

export function ProfileTabs({
  tab,
  onTab,
  row,
}: {
  tab: ProfileTab;
  onTab: (tab: ProfileTab) => void;
  row: SheetRow;
}) {
  return (
    <section className="gx-dossier">
      <div className="gx-dossier__tabs" role="tablist">
        {PROFILE_TABS.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={tab === item}
            title={TAB_UI[item].hint}
            onClick={() => onTab(item)}
            data-on={tab === item}
          >
            {TAB_UI[item].label}
            <small>{TAB_UI[item].hint}</small>
          </button>
        ))}
      </div>
      <div className="gx-dossier__body">
        {tab === "OVERVIEW" ? <Overview row={row} onTab={onTab} /> : null}
        {tab === "GENETICS" ? <Genetics row={row} /> : null}
        {tab === "CARDS" ? <Cards loci={row.loci} cards={row.geneticPower?.cards} chassis={row.chassis} element={String(row.elementPrimary)} /> : null}
        {tab === "LINEAGE" ? <Lineage parents={row.parents} /> : null}
        {tab === "HISTORY" ? <History row={row} /> : null}
        {tab === "NFT" ? (
          <p className="gx-dossier__muted">
            <Tip help={HELP.nft}>Propriedade</Tip> — no Alpha o registro blockchain ainda não está ligado a esta ficha. A criatura já é sua no servidor do jogo.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function Overview({ row, onTab }: { row: SheetRow; onTab: (tab: ProfileTab) => void }) {
  const readout = combatReadout(row.genes, row.geneticPower?.typology);
  const profile = typologyProfile(row.geneticPower?.typology);
  const preview = (row.geneticPower?.cards ?? []).slice(0, 3);
  const blurb = creatureBlurb({
    name: row.name ?? row.speciesName,
    speciesName: row.speciesName,
    element: row.elementPrimary,
    lifeStage: row.lifeStage,
    level: row.level,
    typology: row.geneticPower?.typology,
    genes: row.genes,
  });
  return (
    <div className="gx-overview">
      <article className="gx-overview__story">
        <p className="gx-overview__kicker">Resumo</p>
        <p>{blurb}</p>
        <ul>
          <li>
            <span>Especialidade</span>
            <strong>
              {profile.role} · {profile.style}
            </strong>
          </li>
          <li>
            <span>Estágio</span>
            <strong>
              {stageLabel(row.lifeStage)} · nível {row.level}
            </strong>
          </li>
          <li>
            <span>Elemento</span>
            <strong>
              {elementLabel(row.elementPrimary)}
              {row.elementSecondary ? ` · ${elementLabel(row.elementSecondary)}` : ""}
            </strong>
          </li>
        </ul>
      </article>
      <article>
        <p className="gx-overview__kicker">No combate</p>
        <p>
          <b>Pontos fortes</b> {readout.strengths.map((item) => STAT_META[item.key].name).join(" · ")}
        </p>
        <p>
          <b>Pontos a cuidar</b> {readout.weaknesses.map((item) => STAT_META[item.key].name).join(" · ")}
        </p>
        <p className="gx-dossier__muted">{profile.hint}</p>
      </article>
      <article className="gx-overview__cards">
        <p className="gx-overview__kicker">
          <Tip help={HELP.manifestations}>Habilidades genéticas</Tip>
        </p>
        {preview.length > 0 ? (
          <div className="gx-overview__preview">
            {preview.map((card) => (
              <article key={card.locus} className="gx-overview__chip">
                <small>{card.locus}</small>
                <strong>{card.namePt || card.name}</strong>
                <span>{card.text}</span>
              </article>
            ))}
          </div>
        ) : (
          <p className="gx-dossier__muted">Abra a aba Cartas para ver as 10 manifestações de combate.</p>
        )}
        <div className="gx-overview__cta">
          <button type="button" onClick={() => onTab("CARDS")}>
            Ver todas as cartas
          </button>
          <button type="button" data-ghost="true" onClick={() => onTab("GENETICS")}>
            Ver genética
          </button>
          <button type="button" data-ghost="true" onClick={() => onTab("LINEAGE")}>
            Ver linhagem
          </button>
        </div>
      </article>
    </div>
  );
}

function Genetics({
  row,
}: {
  row: {
    physical: Record<string, string | null> | null;
    genes: Record<string, string>;
    geneticHash: string | null;
    loci: Array<{ key: string; expressed: string; recessive: string; expressedName?: string }>;
  };
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="gx-genes">
      <p className="gx-dossier__muted">Composição visível da criatura. Os nomes abaixo descrevem o chassi, não o poder de combate.</p>
      <div className="gx-genes__traits">
        {Object.entries(TRAIT_LABEL).map(([key, label]) => (
          <div key={key}>
            <p>{label}</p>
            <strong>{prettyPhysical(row.physical?.[key])}</strong>
          </div>
        ))}
      </div>
      <div className="gx-genes__ranks">
        {Object.entries(row.genes).map(([key, value]) => (
          <div key={key}>
            <p>{STAT_META[key as keyof typeof STAT_META]?.name ?? key}</p>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="gx-genes__loci">
        <button type="button" onClick={() => setOpen((value) => !value)}>
          {open ? "Ocultar" : "Mostrar"} cartas recessivas
        </button>
        {open ? (
          <ul>
            {row.loci.map((locus) => {
              const expressed = presentCard(locus.expressed);
              const hidden = presentCard(locus.recessive);
              return (
                <li key={locus.key}>
                  <p>{locus.key}</p>
                  <span>Visível: {locus.expressedName ?? expressed.name}</span>
                  <span>Recessivo: {hidden.name}</span>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
      {row.geneticHash ? (
        <div>
          <p className="gx-overview__kicker">Certificado genético</p>
          <HashCopy hash={row.geneticHash} />
        </div>
      ) : null}
    </div>
  );
}

function prettyPhysical(value?: string | null) {
  if (!value || value === "NONE") return "—";
  return prettyToken(value);
}

function Cards({
  loci,
  cards,
  chassis,
  element,
}: {
  loci: Array<{
    key: string;
    expressed: string;
    recessive: string;
    expressedName?: string;
    expressedText?: string;
    cost?: number;
    sourceGenes?: string[];
    luckVariant?: string | null;
  }>;
  cards?: GeneticPowerView["cards"];
  chassis?: Parameters<typeof CreaturePortrait>[0]["chassis"];
  element?: string | null;
}) {
  const rows =
    cards && cards.length > 0
      ? cards.map((card) => ({
          key: card.locus,
          cardKey: card.catalogKey ?? loci.find((locus) => locus.key === card.locus)?.expressed ?? card.locus,
          artUrl: card.artUrl,
          imageHash: card.imageHash,
          presentation: {
            name: card.namePt || card.name,
            text: card.text,
            cost: card.cost,
            tags: card.tags ?? [],
            sourceGenes: card.sourceGenes,
            luckVariant: card.luckVariant,
          },
        }))
      : loci.map((locus) => ({
          key: locus.key,
          cardKey: locus.expressed,
          artUrl: null,
          imageHash: null,
          presentation: locus.expressedName
            ? { name: locus.expressedName, text: locus.expressedText, cost: locus.cost, sourceGenes: locus.sourceGenes, luckVariant: locus.luckVariant }
            : undefined,
        }));
  return (
    <div>
      <p className="gx-dossier__muted">Estas são as 10 habilidades genéticas desta criatura. Elas entram no combate pelo grimório.</p>
      <div className="gx-card-grid">
        {rows.map((row) => (
          <GeneticCard
            key={row.key}
            cardKey={row.cardKey}
            locus={row.key}
            artUrl={row.artUrl}
            imageHash={row.imageHash}
            chassis={chassis}
            element={element}
            size="sheet"
            openDetail
            presentation={row.presentation}
          />
        ))}
      </div>
    </div>
  );
}

function Lineage({ parents }: { parents: { father: Kin | null; mother: Kin | null } }) {
  return (
    <div className="gx-lineage">
      <p className="gx-dossier__muted">Quem gerou esta criatura. Iniciais e capturas podem não ter pais registrados.</p>
      <div className="gx-lineage__grid">
        <ParentCard label="Pai" kin={parents.father} />
        <ParentCard label="Mãe" kin={parents.mother} />
      </div>
    </div>
  );
}

function ParentCard({ label, kin }: { label: string; kin: Kin | null }) {
  if (!kin) {
    return (
      <article className="gx-kin">
        <p>{label}</p>
        <strong>Sem linhagem registrada</strong>
        <span>Origem inicial, captura ou registro incompleto.</span>
      </article>
    );
  }
  const inner = (
    <>
      <p>{label}</p>
      <div className="gx-kin__row">
        <CreaturePortrait
          speciesKey={kin.speciesKey}
          bodyPlan={kin.bodyPlan}
          head={kin.head}
          element={kin.elementPrimary}
          genesisSeed={kin.genesisSeed}
          phenotype={kin.phenotype}
          portraitUrl={kin.portraitUrl}
          visualStatus={kin.visualStatus}
          visual={kin.visual}
          revealStatus={kin.revealStatus}
          chassis={kin.chassis}
          size={72}
        />
        <div>
          <strong>{kin.name}</strong>
          <span>
            {kin.speciesName} · geração {kin.generation}
          </span>
        </div>
      </div>
    </>
  );
  if (kin.owned) {
    return (
      <Link href={`/game/creatures/${kin.id}`} className="gx-kin">
        {inner}
      </Link>
    );
  }
  return <article className="gx-kin">{inner}</article>;
}

function History({
  row,
}: {
  row: { origin?: string; birthDate?: string; generation: number; fertility?: number; mutation: string | null };
}) {
  const born = row.birthDate ? new Date(row.birthDate) : null;
  return (
    <div className="gx-history-sheet">
      <p>
        <span>Origem</span> {originLabel(row.origin)}
      </p>
      <p>
        <span>Nascimento</span> {born ? born.toLocaleString("pt-BR") : "—"}
      </p>
      <p>
        <Tip help={HELP.generation}>
          <span>Geração</span>
        </Tip>{" "}
        {row.generation}
      </p>
      <p>
        <Tip help={HELP.mutation}>
          <span>Mutação</span>
        </Tip>{" "}
        {mutationLabel(row.mutation)}
      </p>
      <p className="gx-dossier__muted">O histórico de combates desta ficha ainda não está ligado.</p>
    </div>
  );
}
