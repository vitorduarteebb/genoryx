"use client";

import { geneticCardConfig } from "@nexora/config";
import { useEffect, useMemo, useState } from "react";
import { CardFace } from "../../../components/card-face";
import { GameShell } from "../../../components/game-shell";
import { CreatureGxrFigure } from "../../../components/creature-gxr-figure";
import type { CreaturePick } from "../../../components/creature-pick-card";
import { api } from "../../../lib/api";
import { useGameSession } from "../../../lib/use-game-session";
import "./deck.css";

type DeckCard = {
  catalogKey?: string;
  key?: string;
  locus?: string | null;
  artUrl?: string | null;
  imageHash?: string | null;
  sourceCreatureId?: string | null;
};

type DeckPayload = {
  creatures: CreaturePick[];
  deck: string[];
  cards?: DeckCard[];
};

export default function DeckPage() {
  const { accessToken } = useGameSession();
  const [party, setParty] = useState<CreaturePick[]>([]);
  const [owned, setOwned] = useState(0);
  const [cards, setCards] = useState<DeckCard[]>([]);
  const [battleSize, setBattleSize] = useState<number>(geneticCardConfig.competitiveDeckSize);

  useEffect(() => {
    if (!accessToken) return;
    void Promise.all([
      api<DeckPayload>("/deck", { accessToken }),
      api<CreaturePick[]>("/creatures", { accessToken }),
    ]).then(([row, collection]) => {
      setParty(row.creatures ?? []);
      setOwned(collection.length);
      setCards(row.cards ?? row.deck.map((key) => ({ catalogKey: key })));
      setBattleSize(row.deck.length || geneticCardConfig.competitiveDeckSize);
    });
  }, [accessToken]);

  const groups = useMemo(() => {
    const byId = new Map(party.map((row) => [row.id, row]));
    const buckets = new Map<string, DeckCard[]>();
    const extras: DeckCard[] = [];
    for (const card of cards) {
      const owner = card.sourceCreatureId;
      if (owner && byId.has(owner)) {
        const list = buckets.get(owner) ?? [];
        list.push(card);
        buckets.set(owner, list);
        continue;
      }
      extras.push(card);
    }
    const lined = party.map((creature) => ({
      creature,
      cards: buckets.get(creature.id) ?? [],
    }));
    return { lined, extras };
  }, [cards, party]);

  const geneticCount = cards.filter((row) => row.sourceCreatureId).length;

  return (
    <GameShell
      kicker="Cartas da formação"
      title="Grimório"
      subtitle={`Cada criatura traz G1–G10. Três criaturas = 30 cartas no deck da batalha. A mão continua limitada.`}
    >
      <div className="gx-grimoire__stats">
        <span>
          Coleção <strong>{owned}</strong>
        </span>
        <span>
          Formação <strong>{party.length}</strong>/{geneticCardConfig.partyCreatures}
        </span>
        <span>
          Cartas da linhagem <strong>{geneticCount}</strong>
        </span>
        <span>
          Baralho de batalha <strong>{battleSize}</strong>
        </span>
      </div>

      {party.length === 0 ? (
        <div className="gx-empty">
          <p>Sela três criaturas na Formação. O grimório nasce delas, não da coleção inteira.</p>
        </div>
      ) : null}

      {groups.lined.map(({ creature, cards: ownedCards }) => (
        <section key={creature.id} className="gx-grimoire__bind">
          <header className="gx-grimoire__owner">
            <div className="gx-grimoire__mini">
              <CreatureGxrFigure
                chassis={creature.chassis}
                element={String(creature.elementPrimary)}
                lifeStage={creature.lifeStage}
                temperament={creature.temperament}
                visualSeed={creature.visualSeed}
                creatureId={creature.id}
                context="MARKET"
                label={creature.name}
                size={72}
              />
            </div>
            <div>
              <p className="gx-page__kicker">{creature.speciesName}</p>
              <h2 className="gx-grimoire__name">{creature.name}</h2>
              <p className="text-sm text-muted">
                {ownedCards.length} carta{ownedCards.length === 1 ? "" : "s"} do DNA
              </p>
            </div>
          </header>
          <div className="gx-grimoire__grid">
            {ownedCards.map((card, index) => {
              const cardKey = card.catalogKey ?? card.key ?? "";
              return (
                <CardFace
                  key={`${creature.id}-${card.locus ?? index}-${cardKey}`}
                  cardKey={cardKey}
                  locus={card.locus}
                  artUrl={card.artUrl}
                  imageHash={card.imageHash}
                  chassis={creature.chassis}
                  element={String(creature.elementPrimary)}
                  lifeStage={creature.lifeStage}
                  creatureId={creature.id}
                />
              );
            })}
          </div>
        </section>
      ))}

      {groups.extras.length > 0 ? (
        <section className="gx-grimoire__bind">
          <header className="gx-grimoire__owner">
            <div>
              <p className="gx-page__kicker">Composição</p>
              <h2 className="gx-grimoire__name">Sinergia</h2>
              <p className="text-sm text-muted">Cartas que nascem da formação, não de um único DNA.</p>
            </div>
          </header>
          <div className="gx-grimoire__grid">
            {groups.extras.map((card, index) => {
              const cardKey = card.catalogKey ?? card.key ?? "";
              return (
                <CardFace
                  key={`extra-${index}-${cardKey}`}
                  cardKey={cardKey}
                  locus={card.locus}
                  artUrl={card.artUrl}
                  imageHash={card.imageHash}
                />
              );
            })}
          </div>
        </section>
      ) : null}
    </GameShell>
  );
}
