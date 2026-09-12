"use client";

import { cardElementLabel } from "@nexora/config";
import { marketFeeGold, marketListingFeeGold } from "@nexora/game-engine";
import type { Element } from "@nexora/types";
import { useEffect, useMemo, useState } from "react";
import { CreatureCollectCard } from "../../../components/creature-collect-card";
import { type CreaturePick } from "../../../components/creature-pick-card";
import { maturationMarketLabel, type MaturationView } from "../../../components/maturation-meter";
import { GameShell } from "../../../components/game-shell";
import { api } from "../../../lib/api";
import { useGameSession } from "../../../lib/use-game-session";
import "./market.css";

type Listing = {
  id: string;
  priceGold: string;
  seller: string;
  isMine: boolean;
  creature: CreaturePick & { loci: Array<{ key: string; expressed: string }>; maturation?: MaturationView | null };
};

type Confirm =
  | { type: "sell"; creatureId: string; name: string; price: number }
  | { type: "buy"; listing: Listing; fee: string; net: string }
  | { type: "cancel"; listing: Listing };

type Tab = "browse" | "sell" | "mine";
type SortKey = "price-asc" | "price-desc";

const ELEMENTS: Array<Element | "ALL"> = [
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

function formatGold(value: string | number) {
  try {
    return BigInt(value).toLocaleString("pt-BR");
  } catch {
    return String(value);
  }
}

export default function MarketPage() {
  const { accessToken, character } = useGameSession();
  const [listings, setListings] = useState<Listing[]>([]);
  const [mine, setMine] = useState<Array<CreaturePick & { lock?: string }>>([]);
  const [creatureId, setCreatureId] = useState("");
  const [price, setPrice] = useState("200");
  const [history, setHistory] = useState<Array<{ id: string; priceGold: string; species: string | null }>>([]);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>("browse");
  const [query, setQuery] = useState("");
  const [element, setElement] = useState<Element | "ALL">("ALL");
  const [sort, setSort] = useState<SortKey>("price-asc");

  const gold = character?.wallets.find((wallet) => wallet.currency === "GOLD")?.balance ?? "0";
  const sellable = useMemo(() => mine.filter((row) => !row.lock || row.lock === "NONE"), [mine]);
  const selected = sellable.find((row) => row.id === creatureId);
  const mineListings = listings.filter((row) => row.isMine);

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = listings.filter((row) => {
      const el = String(row.creature.elementPrimary);
      if (element !== "ALL" && el !== element) return false;
      if (!needle) return true;
      const identity = row.creature.combatIdentity;
      const tags = (identity?.synergyTags ?? []).join(" ").toLowerCase();
      return (
        row.creature.name.toLowerCase().includes(needle) ||
        row.creature.speciesName.toLowerCase().includes(needle) ||
        row.seller.toLowerCase().includes(needle) ||
        (identity?.namePt ?? "").toLowerCase().includes(needle) ||
        (identity?.archetype ?? "").toLowerCase().includes(needle) ||
        (identity?.resource?.displayName ?? "").toLowerCase().includes(needle) ||
        tags.includes(needle)
      );
    });
    return rows.sort((a, b) => {
      const left = BigInt(a.priceGold);
      const right = BigInt(b.priceGold);
      if (left === right) return 0;
      return sort === "price-asc" ? (left < right ? -1 : 1) : left > right ? -1 : 1;
    });
  }, [element, listings, query, sort]);

  async function refresh() {
    if (!accessToken) return;
    const [list, creatures, sales] = await Promise.all([
      api<Listing[]>("/market", { accessToken }),
      api<Array<CreaturePick & { lock?: string }>>("/creatures", { accessToken }),
      api<Array<{ id: string; priceGold: string; species: string | null }>>("/market/history", { accessToken }),
    ]);
    setListings(list);
    setMine(creatures);
    setHistory(sales);
    if (creatureId && creatures.every((row) => row.id !== creatureId || row.lock !== "NONE")) {
      setCreatureId("");
    }
  }

  useEffect(() => {
    void refresh();
  }, [accessToken]);

  async function run(action: () => Promise<void>) {
    if (!accessToken) return;
    setBusy(true);
    setError(null);
    try {
      await action();
      setConfirm(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mercado recusou a ação.");
    } finally {
      setBusy(false);
    }
  }

  function askSell() {
    const priceGold = Number(price);
    if (!selected || !Number.isInteger(priceGold) || priceGold <= 0) {
      setError("Escolha a criatura e um preço em GOLD.");
      return;
    }
    setError(null);
    setConfirm({ type: "sell", creatureId: selected.id, name: selected.name, price: priceGold });
  }

  function askBuy(listing: Listing) {
    const { fee, net } = marketFeeGold(BigInt(listing.priceGold));
    setError(null);
    setConfirm({ type: "buy", listing, fee: fee.toString(), net: net.toString() });
  }

  const listingFee = selected && Number.isInteger(Number(price)) && Number(price) > 0
    ? marketListingFeeGold(BigInt(price)).toString()
    : "0";

  return (
    <GameShell
      wide
      kicker="Nexus Market"
      title="Mercado"
      subtitle="Vitrine de linhagens. Anunciar custa 1% (mínimo 5). Comprar custa 5% — o ouro vai para o abismo."
    >
      <div className="gx-bazaar__bar">
        <p className="gx-bazaar__gold">
          <small>Seu Gold</small>
          {formatGold(gold)}
        </p>
        <div className="gx-bazaar__tabs">
          {(
            [
              ["browse", "Vitrine", String(listings.length)],
              ["sell", "Vender", String(sellable.length)],
              ["mine", "Meus anúncios", String(mineListings.length)],
            ] as const
          ).map(([key, label, count]) => (
            <button key={key} type="button" className="gx-bazaar__chip" data-active={tab === key} onClick={() => setTab(key)}>
              {label} · {count}
            </button>
          ))}
        </div>
      </div>

      {tab === "browse" ? (
        <>
          <div className="gx-bazaar__filters">
            <input
              className="gx-bazaar__search"
              value={query}
              placeholder="Buscar nome, identidade, Burn, Shield, Calor..."
              onChange={(event) => setQuery(event.target.value)}
            />
            {ELEMENTS.map((key) => (
              <button key={key} type="button" className="gx-bazaar__chip" data-active={element === key} onClick={() => setElement(key)}>
                {key === "ALL" ? "Todos" : cardElementLabel(key)}
              </button>
            ))}
            <button
              type="button"
              className="gx-bazaar__chip"
              data-active={sort === "price-asc"}
              onClick={() => setSort("price-asc")}
            >
              Menor preço
            </button>
            <button
              type="button"
              className="gx-bazaar__chip"
              data-active={sort === "price-desc"}
              onClick={() => setSort("price-desc")}
            >
              Maior preço
            </button>
            <p className="gx-bazaar__count">{shown.length} à venda</p>
          </div>
          <div className="gx-bazaar__grid">
            {shown.map((row) => (
              <ListingCard
                key={row.id}
                row={row}
                actionLabel={row.isMine ? "Cancelar" : "Comprar"}
                onAction={() => (row.isMine ? setConfirm({ type: "cancel", listing: row }) : askBuy(row))}
              />
            ))}
          </div>
          {shown.length === 0 ? (
            <div className="gx-empty">
              <p>
                {listings.length > 0
                  ? "Nenhuma linhagem neste filtro."
                  : mineListings.length > 0
                    ? "Seu anúncio está em Meus anúncios."
                    : "Ninguém anunciou ainda. Vai em Vender e coloca uma das suas."}
              </p>
            </div>
          ) : null}
        </>
      ) : null}

      {tab === "sell" ? (
        <>
          <div className="gx-bazaar__sellbar">
            <label>
              Preço
              <input value={price} inputMode="numeric" onChange={(event) => setPrice(event.target.value)} />
            </label>
            <p className="text-sm text-muted">
              {selected ? `${selected.name} · taxa de anúncio ${formatGold(listingFee)} GOLD` : "Toque numa criatura livre"}
            </p>
            <button type="button" className="gx-cta" onClick={askSell}>
              Anunciar
            </button>
          </div>
          <div className="gx-bazaar__grid">
            {sellable.map((row) => (
              <button
                key={row.id}
                type="button"
                className="gx-bazaar-card text-left"
                data-selected={row.id === creatureId}
                onClick={() => setCreatureId(row.id)}
              >
                <CreatureCollectCard creature={row} />
              </button>
            ))}
          </div>
          {sellable.length === 0 ? (
            <div className="gx-empty">
              <p>Nenhuma criatura livre. As que estão na formação ou à venda ficam travadas.</p>
            </div>
          ) : null}
        </>
      ) : null}

      {tab === "mine" ? (
        <>
          <div className="gx-bazaar__grid">
            {mineListings.map((row) => (
              <ListingCard
                key={row.id}
                row={row}
                actionLabel="Cancelar"
                onAction={() => setConfirm({ type: "cancel", listing: row })}
              />
            ))}
          </div>
          {mineListings.length === 0 ? (
            <div className="gx-empty">
              <p>Você não tem anúncio ativo.</p>
            </div>
          ) : null}
        </>
      ) : null}

      {history.length > 0 ? (
        <p className="gx-bazaar__count">
          Últimas vendas: {history.map((row) => `${row.species ?? "?"} ${formatGold(row.priceGold)}`).join(" · ")}
        </p>
      ) : null}

      {error ? <p className="text-sm text-ember">{error}</p> : null}

      {confirm ? (
        <div className="gx-bazaar__modal" role="dialog" aria-modal="true">
          <div className="gx-bazaar__dialog">
            {confirm.type === "sell" ? (
              <>
                <p className="gx-page__kicker">Confirmar anúncio</p>
                <h2 className="gx-page__title !text-3xl">{confirm.name}</h2>
                <p className="mt-3 text-sm text-muted">
                  À venda por {formatGold(confirm.price)} GOLD. Taxa de anúncio{" "}
                  {formatGold(marketListingFeeGold(BigInt(confirm.price)).toString())} GOLD. Ela sai da formação até vender
                  ou cancelar.
                </p>
              </>
            ) : null}
            {confirm.type === "buy" ? (
              <>
                <p className="gx-page__kicker">Confirmar compra</p>
                <h2 className="gx-page__title !text-3xl">{confirm.listing.creature.name}</h2>
                <p className="mt-3 text-sm text-muted">
                  Pagar {formatGold(confirm.listing.priceGold)} GOLD. Taxa 5% · o vendedor recebe {formatGold(confirm.net)}.
                </p>
              </>
            ) : null}
            {confirm.type === "cancel" ? (
              <>
                <p className="gx-page__kicker">Cancelar venda</p>
                <h2 className="gx-page__title !text-3xl">{confirm.listing.creature.name}</h2>
                <p className="mt-3 text-sm text-muted">A criatura volta para você, livre.</p>
              </>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                className="gx-cta"
                onClick={() => {
                  if (confirm.type === "sell") {
                    void run(async () => {
                      await api("/market/listings", {
                        method: "POST",
                        accessToken,
                        body: { creatureId: confirm.creatureId, priceGold: confirm.price },
                      });
                      setTab("mine");
                    });
                  }
                  if (confirm.type === "buy") {
                    void run(async () => {
                      await api(`/market/listings/${confirm.listing.id}/buy`, { method: "POST", accessToken });
                    });
                  }
                  if (confirm.type === "cancel") {
                    void run(async () => {
                      await api(`/market/listings/${confirm.listing.id}/cancel`, { method: "POST", accessToken });
                    });
                  }
                }}
              >
                {busy ? "Selando…" : "Confirmar"}
              </button>
              <button type="button" className="gx-cta gx-cta--ghost" onClick={() => setConfirm(null)}>
                Voltar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </GameShell>
  );
}

function ListingCard({
  row,
  actionLabel,
  onAction,
}: {
  row: Listing;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <article className="gx-bazaar-card">
      <div className="gx-bazaar-card__meta">
        <span>{cardElementLabel(String(row.creature.elementPrimary) as Element)}</span>
        <span>{row.isMine ? "Seu anúncio" : row.seller}</span>
      </div>
      <CreatureCollectCard
        creature={row.creature}
        priceHint={maturationMarketLabel(row.creature.lifeStage, row.creature.maturation)}
      />
      <div className="gx-bazaar-card__pay">
        <p className="gx-bazaar-card__price">
          {formatGold(row.priceGold)}
          <small>GOLD</small>
        </p>
        <button type="button" className={row.isMine ? "gx-cta gx-cta--danger" : "gx-cta"} onClick={onAction}>
          {actionLabel}
        </button>
      </div>
    </article>
  );
}
