"use client";

import { cardElementLabel } from "@nexora/config";
import type { Element } from "@nexora/types";
import { useEffect, useMemo, useState } from "react";
import { CreatureCollectCard } from "../../../components/creature-collect-card";
import "../../../components/creature-collect-card.css";
import { genderLabel, type CreaturePick } from "../../../components/creature-pick-card";
import { type MaturationView } from "../../../components/maturation-meter";
import { GameShell } from "../../../components/game-shell";
import { api } from "../../../lib/api";
import { useGameSession } from "../../../lib/use-game-session";
import "./collection.css";

type CreatureCard = CreaturePick & {
  level: number;
  mutation: string | null;
  canEvolve?: boolean;
  maturation?: MaturationView | null;
  evolutionStatus?: string;
  nextLifeStage?: string | null;
  loci: Array<{ key: string; expressed: string }>;
};

type ElementFilter = Element | "ALL";
type StageFilter = "ALL" | "BABY" | "YOUNG" | "ADULT";
type GenderFilter = "ALL" | "MALE" | "FEMALE";
type FlagFilter = "ALL" | "EVOLVE" | "REVEAL" | "FERTILE";
type SortKey = "name" | "level" | "generation" | "fertility" | "species";

const ELEMENTS: ElementFilter[] = [
  "ALL",
  "FIRE",
  "WATER",
  "NATURE",
  "EARTH",
  "ELECTRIC",
  "ICE",
  "LIGHT",
  "DARK",
  "ARCANE",
];

const STAGE_LABEL: Record<StageFilter, string> = {
  ALL: "Idade",
  BABY: "Filhote",
  YOUNG: "Jovem",
  ADULT: "Adulto",
};

const SORT_LABEL: Record<SortKey, string> = {
  name: "Nome",
  level: "Nível",
  generation: "Geração",
  fertility: "Fertilidade",
  species: "Espécie",
};

function creatureHref(row: CreatureCard) {
  if (row.revealStatus === "PENDING_VISUAL" || row.revealStatus === "READY_TO_REVEAL") {
    return `/game/genesis/${row.id}`;
  }
  return `/game/creatures/${row.id}`;
}

function creatureBadge(row: CreatureCard) {
  if (row.revealStatus === "READY_TO_REVEAL") return "Revelar";
  if (row.revealStatus === "PENDING_VISUAL") return "Formando";
  if (row.canEvolve || row.evolutionStatus === "READY_TO_EVOLVE") return "Despertar";
  return null;
}

function stageLabel(stage?: string) {
  if (stage === "YOUNG") return "Jovem";
  if (stage === "ADULT") return "Adulto";
  return "Filhote";
}

export default function CreaturesPage() {
  const { accessToken } = useGameSession();
  const [rows, setRows] = useState<CreatureCard[]>([]);
  const [query, setQuery] = useState("");
  const [element, setElement] = useState<ElementFilter>("ALL");
  const [species, setSpecies] = useState("ALL");
  const [stage, setStage] = useState<StageFilter>("ALL");
  const [gender, setGender] = useState<GenderFilter>("ALL");
  const [flag, setFlag] = useState<FlagFilter>("ALL");
  const [sort, setSort] = useState<SortKey>("level");

  useEffect(() => {
    if (!accessToken) return;
    void api<CreatureCard[]>("/creatures", { accessToken })
      .then(setRows)
      .catch(() => setRows([]));
  }, [accessToken]);

  const speciesOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of rows) {
      const key = row.speciesKey ?? row.speciesName;
      if (!map.has(key)) map.set(key, row.speciesName);
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "pt"));
  }, [rows]);

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = rows.filter((row) => {
      if (element !== "ALL" && String(row.elementPrimary) !== element) return false;
      if (species !== "ALL" && (row.speciesKey ?? row.speciesName) !== species) return false;
      if (stage !== "ALL" && (row.lifeStage ?? "BABY") !== stage) return false;
      if (gender !== "ALL" && row.gender !== gender) return false;
      if (flag === "EVOLVE" && !(row.canEvolve || row.evolutionStatus === "READY_TO_EVOLVE")) return false;
      if (flag === "REVEAL" && row.revealStatus !== "READY_TO_REVEAL" && row.revealStatus !== "PENDING_VISUAL") {
        return false;
      }
      if (flag === "FERTILE" && row.fertility <= 0) return false;
      if (!needle) return true;
      const identity = row.combatIdentity;
      const tags = (identity?.synergyTags ?? []).join(" ").toLowerCase();
      return (
        row.name.toLowerCase().includes(needle) ||
        row.speciesName.toLowerCase().includes(needle) ||
        (row.mutation ?? "").toLowerCase().includes(needle) ||
        (identity?.namePt ?? "").toLowerCase().includes(needle) ||
        (identity?.archetype ?? "").toLowerCase().includes(needle) ||
        tags.includes(needle)
      );
    });
    return filtered.sort((a, b) => {
      if (sort === "level") return b.level - a.level || a.name.localeCompare(b.name, "pt");
      if (sort === "generation") return b.generation - a.generation || a.name.localeCompare(b.name, "pt");
      if (sort === "fertility") return b.fertility - a.fertility || a.name.localeCompare(b.name, "pt");
      if (sort === "species") return a.speciesName.localeCompare(b.speciesName, "pt") || a.name.localeCompare(b.name, "pt");
      return a.name.localeCompare(b.name, "pt");
    });
  }, [element, flag, gender, query, rows, sort, species, stage]);

  const filtersActive =
    query.trim() !== "" || element !== "ALL" || species !== "ALL" || stage !== "ALL" || gender !== "ALL" || flag !== "ALL";

  function clearFilters() {
    setQuery("");
    setElement("ALL");
    setSpecies("ALL");
    setStage("ALL");
    setGender("ALL");
    setFlag("ALL");
  }

  return (
    <GameShell
      wide
      kicker="Santuário da linhagem"
      title="Coleção"
      subtitle="Toque no card para abrir a ficha. Busca e filtros ficam no topo."
    >
      {rows.length > 0 ? (
        <div className="gx-vault__bar">
          <div className="gx-vault__row">
            <input
              className="gx-vault__search"
              value={query}
              placeholder="Buscar nome, espécie, mutação..."
              onChange={(event) => setQuery(event.target.value)}
            />
            <select className="gx-vault__select" value={species} onChange={(event) => setSpecies(event.target.value)}>
              <option value="ALL">Todas as espécies</option>
              {speciesOptions.map(([key, name]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </select>
            <select
              className="gx-vault__select"
              value={stage}
              onChange={(event) => setStage(event.target.value as StageFilter)}
            >
              {(Object.keys(STAGE_LABEL) as StageFilter[]).map((key) => (
                <option key={key} value={key}>
                  {STAGE_LABEL[key]}
                </option>
              ))}
            </select>
            <select
              className="gx-vault__select"
              value={gender}
              onChange={(event) => setGender(event.target.value as GenderFilter)}
            >
              <option value="ALL">Sexo</option>
              <option value="MALE">Macho</option>
              <option value="FEMALE">Fêmea</option>
            </select>
            <select className="gx-vault__select" value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
              {(Object.keys(SORT_LABEL) as SortKey[]).map((key) => (
                <option key={key} value={key}>
                  Ordenar · {SORT_LABEL[key]}
                </option>
              ))}
            </select>
            <p className="gx-vault__count">
              {shown.length}
              {shown.length !== rows.length ? ` de ${rows.length}` : ""} linhagem{shown.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="gx-vault__row">
            {ELEMENTS.map((key) => (
              <button
                key={key}
                type="button"
                className="gx-vault__chip"
                data-active={element === key}
                onClick={() => setElement(key)}
              >
                {key === "ALL" ? "Todos" : cardElementLabel(key)}
              </button>
            ))}
            <button type="button" className="gx-vault__chip" data-active={flag === "EVOLVE"} onClick={() => setFlag(flag === "EVOLVE" ? "ALL" : "EVOLVE")}>
              Despertar
            </button>
            <button type="button" className="gx-vault__chip" data-active={flag === "REVEAL"} onClick={() => setFlag(flag === "REVEAL" ? "ALL" : "REVEAL")}>
              Revelar
            </button>
            <button type="button" className="gx-vault__chip" data-active={flag === "FERTILE"} onClick={() => setFlag(flag === "FERTILE" ? "ALL" : "FERTILE")}>
              Fértil
            </button>
            {filtersActive ? (
              <button type="button" className="gx-vault__chip" onClick={clearFilters}>
                Limpar
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="gx-vault__grid">
        {shown.map((row) => (
          <CreatureCollectCard
            key={row.id}
            creature={row}
            level={row.level}
            href={creatureHref(row)}
            badge={creatureBadge(row)}
            caption={`${row.speciesName} · Nv ${row.level} · ${stageLabel(row.lifeStage)} · ${genderLabel(row.gender)} · Gen ${row.generation}`}
          />
        ))}
      </div>
      {rows.length === 0 ? (
        <div className="gx-empty">
          <p>O círculo ainda está vazio. Escolha um starter e a primeira linhagem nasce aqui.</p>
        </div>
      ) : null}
      {rows.length > 0 && shown.length === 0 ? (
        <div className="gx-empty">
          <p>Nenhuma criatura neste filtro.</p>
          <button type="button" className="gx-vault__chip mt-3" onClick={clearFilters}>
            Limpar filtros
          </button>
        </div>
      ) : null}
    </GameShell>
  );
}
