"use client";

import { detectCombatArchetype, formatGeneticHash } from "@nexora/game-engine";
import Link from "next/link";
import { elementIconSrc } from "../../lib/card-chrome";
import {
  HELP,
  RANK_ORDER,
  STAT_GROUPS,
  STAT_META,
  bodyPlanLabel,
  combatReadout,
  elementLabel,
  mutationLabel,
  originLabel,
  rankIndex,
  stageLabel,
  temperamentLabel,
  typologyProfile,
  type StatKey,
} from "../../lib/creature-lexicon";
import { genderMark } from "../creature-pick-card";
import { MaturationMeter, type MaturationView } from "../maturation-meter";
import { PersonalResourceHelp } from "../personal-resource-help";
import { InlineRename } from "./inline-rename";
import { Tip } from "./sheet-tip";

export function StatGrid({ genes }: { genes: Record<string, string> }) {
  return <GroupedStats genes={genes} />;
}

export function GroupedStats({ genes }: { genes: Record<string, string> }) {
  const readout = combatReadout(genes);
  const strong = new Set(readout.strengths.map((row) => row.key));
  const weak = new Set(readout.weaknesses.map((row) => row.key));
  return (
    <div className="gx-stats">
      {STAT_GROUPS.map((group) => (
        <div key={group.id} className="gx-stats__group">
          <p className="gx-stats__label">{group.title}</p>
          <div className="gx-stats__grid">
            {group.keys.map((key) => (
              <StatCell key={key} stat={key} rank={genes[key] ?? "C"} highlight={strong.has(key)} dim={weak.has(key)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatCell({
  stat,
  rank,
  highlight,
  dim,
}: {
  stat: StatKey;
  rank: string;
  highlight?: boolean;
  dim?: boolean;
}) {
  const filled = rankIndex(rank);
  const meta = STAT_META[stat];
  return (
    <div className="gx-stat" data-strong={highlight ? "true" : undefined} data-weak={dim ? "true" : undefined}>
      <div className="gx-stat__row">
        <Tip help={meta.hint}>
          <span className="gx-stat__key">{meta.name}</span>
        </Tip>
        <b>{rank}</b>
      </div>
      <div className="gx-stat__bar" aria-hidden>
        {RANK_ORDER.map((item, index) => (
          <span key={item} className={index <= filled ? "is-on" : ""} />
        ))}
      </div>
    </div>
  );
}

export type CombatIdentityView = {
  namePt?: string;
  stylePt?: string;
  archetype?: string;
  strengths?: string[];
  weaknesses?: string[];
  synergyTags?: string[];
  quirks?: Array<{ namePt: string; textPt: string }>;
  anomaly?: { textPt: string } | null;
  resource?: (import("@nexora/config").PersonalResourceDefinition & {
    help?: import("@nexora/config").ResourceHelpView;
  }) | null;
  expression?: Record<string, number>;
  rolls?: Record<string, number>;
};

export function IdentityPanel({
  name,
  speciesName,
  gender,
  lifeStage,
  temperament,
  generation,
  fertility,
  bodyPlan,
  mutation,
  genes,
  busy,
  error,
  saved,
  onRename,
  onOpenGenetics,
  onOpenCards,
  creatureId,
  canEvolve,
  level,
  maturation,
  elementPrimary,
  elementSecondary,
  origin,
  geneticPurity,
  typology,
  combatIdentity,
}: {
  name: string;
  speciesName: string;
  gender: "MALE" | "FEMALE";
  lifeStage?: string;
  temperament?: string | null;
  generation: number;
  fertility: number;
  bodyPlan?: string | null;
  mutation?: string | null;
  genes: Record<string, string>;
  busy: boolean;
  error: string | null;
  saved: boolean;
  onRename: (name: string) => Promise<void>;
  onOpenGenetics: () => void;
  onOpenCards?: () => void;
  creatureId?: string;
  canEvolve?: boolean;
  level?: number;
  maturation?: MaturationView | null;
  elementPrimary?: string | null;
  elementSecondary?: string | null;
  origin?: string;
  geneticPurity?: number | null;
  typology?: string | null;
  combatIdentity?: CombatIdentityView | null;
}) {
  const profile = typologyProfile(typology);
  const readout = combatReadout(genes, typology);
  const build = detectCombatArchetype(genes, typology, elementPrimary);
  return (
    <aside className="gx-sheet">
      <p className="gx-sheet__species">
        {speciesName}
        <span>
          {genderMark(gender)} {gender === "FEMALE" ? "Fêmea" : "Macho"}
        </span>
      </p>
      <InlineRename name={name} busy={busy} onRename={onRename} />
      <ul className="gx-sheet__facts">
        <li>
          <span>Elemento</span>
          <strong>
            {elementPrimary ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={elementIconSrc(elementPrimary)} alt="" />
            ) : null}
            {elementLabel(elementPrimary)}
            {elementSecondary ? ` · ${elementLabel(elementSecondary)}` : ""}
          </strong>
        </li>
        <li>
          <span>Estágio</span>
          <strong>{stageLabel(lifeStage)}</strong>
        </li>
        <li>
          <span>Nível</span>
          <strong>{level ?? 1}</strong>
        </li>
        <li>
          <Tip help={HELP.generation}>
            <span>Geração</span>
          </Tip>
          <strong>{generation}</strong>
        </li>
        <li>
          <span>Identidade genética</span>
          <Tip help="O que esta criatura nasceu para ser. Não é a build calculada pelos genes atuais.">
            <strong>{profile.role}</strong>
          </Tip>
        </li>
        <li>
          <span>Build atual</span>
          <Tip help={build.limitation ?? "Calculada pelos genes reais, não pela identidade de nascimento."}>
            <strong>{build.archetype}</strong>
          </Tip>
        </li>
        <li>
          <Tip help={HELP.temperament}>
            <span>Personalidade</span>
          </Tip>
          <strong>{temperamentLabel(temperament)}</strong>
        </li>
      </ul>
      <p className="text-sm text-muted">
        {build.line}. Potencial secundário: {build.secondary}.
        {build.limitation ? ` ${build.limitation}` : ""}
      </p>

      <dl className="gx-sheet__summary">
        <div>
          <dt>Origem</dt>
          <dd>{originLabel(origin)}</dd>
        </div>
        <div>
          <Tip help={HELP.bodyPlan}>
            <dt>Corpo</dt>
          </Tip>
          <dd>{bodyPlanLabel(bodyPlan)}</dd>
        </div>
        <div>
          <Tip help={HELP.mutation}>
            <dt>Mutação</dt>
          </Tip>
          <dd>{mutationLabel(mutation)}</dd>
        </div>
        <div>
          <Tip help={HELP.fertility}>
            <dt>Fertilidade</dt>
          </Tip>
          <dd>{fertility} de 5</dd>
        </div>
        <div>
          <Tip help={HELP.purity}>
            <dt>Pureza</dt>
          </Tip>
          <dd>{geneticPurity == null ? "—" : `${Math.round(geneticPurity)}%`}</dd>
        </div>
        <div>
          <dt>Estilo</dt>
          <dd>{profile.style}</dd>
        </div>
      </dl>

      <MaturationMeter lifeStage={lifeStage} level={level} maturation={maturation} />

      {combatIdentity?.namePt ? (
        <div className="gx-sheet__identity">
          <p className="gx-stats__label">Identidade de combate</p>
          <p>
            <b>{combatIdentity.namePt}</b>
            {combatIdentity.stylePt ? ` · ${combatIdentity.stylePt}` : ""}
          </p>
          {combatIdentity.resource ? (
            <PersonalResourceHelp
              current={0}
              definition={combatIdentity.resource}
              help={combatIdentity.resource.help}
              debug={typeof window !== "undefined" && new URLSearchParams(window.location.search).has("gxdebug")}
            />
          ) : null}
          <p>
            <b>Fortes</b> {(combatIdentity.strengths ?? []).join(" · ") || "—"}
          </p>
          <p>
            <b>Fracos</b> {(combatIdentity.weaknesses ?? []).join(" · ") || "—"}
          </p>
          {(combatIdentity.quirks ?? []).map((quirk) => (
            <p key={quirk.namePt}>
              <b>{quirk.namePt}</b> {quirk.textPt}
            </p>
          ))}
          {combatIdentity.anomaly ? <p>{combatIdentity.anomaly.textPt}</p> : null}
          {combatIdentity.expression ? (
            <p>
              Expressão {Object.entries(combatIdentity.expression)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4)
                .map(([key, value]) => `${key} ${value}`)
                .join(" · ")}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="gx-sheet__readout">
        <p>
          <b>Pontos fortes</b> {readout.strengths.map((row) => STAT_META[row.key].name).join(" · ")}
        </p>
        <p>
          <b>Pontos a cuidar</b> {readout.weaknesses.map((row) => STAT_META[row.key].name).join(" · ")}
        </p>
      </div>

      <GroupedStats genes={genes} />

      <div className="gx-sheet__cta">
        {onOpenCards ? (
          <button type="button" onClick={onOpenCards}>
            Ver cartas
          </button>
        ) : null}
        <button type="button" data-ghost="true" onClick={onOpenGenetics}>
          Ver genética
        </button>
        {canEvolve && creatureId ? (
          <Link href={`/game/evolution/${creatureId}`}>Despertar</Link>
        ) : null}
      </div>
      {error ? <p className="gx-sheet__note gx-sheet__note--bad">{error}</p> : null}
      {saved ? <p className="gx-sheet__note">Nome gravado.</p> : null}
    </aside>
  );
}

export function HashCopy({ hash }: { hash: string }) {
  return (
    <button type="button" className="gx-hash" onClick={() => void navigator.clipboard.writeText(hash)}>
      {formatGeneticHash(hash)} · copiar certificado
    </button>
  );
}
