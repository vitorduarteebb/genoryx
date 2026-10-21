"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GameShell } from "../../../components/game-shell";
import { api } from "../../../lib/api";
import { useCharacterStore } from "../../../lib/character-store";
import { useGameSession } from "../../../lib/use-game-session";
import "./shop.css";

type ShopItem = {
  key: string;
  name: string;
  priceGold: number;
  rarity?: string;
  capturePower?: number;
  blurb?: string;
};

type InventoryItem = { key: string; name: string; quantity: number };
type Wallet = { currency: string; balance: string };

type Receipt = {
  itemKey: string;
  name: string;
  quantity: number;
  unitPriceGold: number;
  totalGold: string;
  goldAfter: string;
  ownedAfter: number;
  referenceId: string;
};

type BuyResponse = {
  wallets: Wallet[];
  items: InventoryItem[];
  receipt: Receipt;
};

const MAX_QTY = 20;

const RARITY_PT: Record<string, string> = {
  COMMON: "Comum",
  UNCOMMON: "Incomum",
  RARE: "Raro",
  ANCIENT: "Ancestral",
};

function formatGold(value: string | number) {
  try {
    return BigInt(value).toLocaleString("pt-BR");
  } catch {
    return String(value);
  }
}

function goldOf(wallets: Array<{ currency: string; balance: string }> | undefined) {
  return wallets?.find((row) => row.currency === "GOLD")?.balance ?? "0";
}

export default function ShopPage() {
  const { accessToken, character } = useGameSession();
  const applyWallets = useCharacterStore((state) => state.applyWallets);
  const [catalog, setCatalog] = useState<ShopItem[]>([]);
  const [owned, setOwned] = useState<InventoryItem[]>([]);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [flashId, setFlashId] = useState<string | null>(null);

  const gold = goldOf(character?.wallets);
  const latest = receipts[0];

  async function loadStall() {
    if (!accessToken) return;
    setLoadState("loading");
    setError(null);
    try {
      const [shop, inv] = await Promise.all([
        api<{ items: ShopItem[] }>("/shop", { accessToken }),
        api<{ wallets: Wallet[]; items: InventoryItem[] }>("/inventory", { accessToken }),
      ]);
      setCatalog(shop.items);
      setOwned(inv.items);
      applyWallets(inv.wallets);
      setQty((prev) => {
        const next = { ...prev };
        for (const item of shop.items) {
          next[item.key] = next[item.key] ?? 1;
        }
        return next;
      });
      setLoadState("ready");
    } catch {
      setLoadState("error");
      setError("A bancada não respondeu.");
    }
  }

  useEffect(() => {
    void loadStall();
  }, [accessToken]);

  function ownedOf(key: string) {
    return owned.find((row) => row.key === key)?.quantity ?? 0;
  }

  function setAmount(key: string, value: number) {
    setQty((prev) => ({ ...prev, [key]: Math.min(MAX_QTY, Math.max(1, value)) }));
  }

  async function buy(item: ShopItem) {
    if (!accessToken) return;
    const quantity = qty[item.key] ?? 1;
    setBusyKey(item.key);
    setError(null);
    try {
      const result = await api<BuyResponse>("/shop/buy", {
        method: "POST",
        accessToken,
        body: { itemKey: item.key, quantity },
      });
      setOwned(result.items);
      applyWallets(result.wallets);
      setReceipts((prev) => [result.receipt, ...prev].slice(0, 6));
      setFlashId(result.receipt.referenceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Theo recusou a venda.");
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <GameShell
      kicker="Bancada de Theo"
      title="Loja"
      subtitle="Escolhe a quantidade. O ouro some no ledger. O orbe nasce no cofre. Nada aqui vende poder."
    >
      <div className="gx-stall">
        <div className="gx-stall__bar">
          <div className="gx-stall__purse">
            <small>Sua bolsa</small>
            <strong>{formatGold(gold)} GOLD</strong>
          </div>
          <div className="gx-stall__vault" aria-label="Orbes no cofre">
            {catalog.map((item) => (
              <div key={item.key} className="gx-stall__orb">
                <small>No cofre</small>
                <b>×{ownedOf(item.key)}</b>
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {latest ? (
          <aside className="gx-stall__receipt" aria-live="polite">
            <small>Compra selada</small>
            <h2>
              +{latest.quantity} {latest.name}
            </h2>
            <p>
              Gastou {formatGold(latest.totalGold)} GOLD · agora você tem ×{latest.ownedAfter} · bolsa{" "}
              {formatGold(latest.goldAfter)} GOLD.{" "}
              <Link href="/game/inventory">Abrir o cofre</Link>
            </p>
          </aside>
        ) : null}

        {error ? <p className="gx-stall__error">{error}</p> : null}

        {loadState === "loading" ? (
          <div className="gx-empty">
            <p>Theo está arrumando a bancada…</p>
          </div>
        ) : null}

        {loadState === "error" ? (
          <div className="gx-empty">
            <p>A bancada não abriu. Tenta de novo.</p>
            <button type="button" className="gx-cta mt-4" onClick={() => void loadStall()}>
              Chamar o Theo
            </button>
          </div>
        ) : null}

        {loadState === "ready" && catalog.length === 0 ? (
          <div className="gx-empty">
            <p>Theo ainda não abriu a bancada.</p>
          </div>
        ) : null}

        {loadState === "ready" && catalog.length > 0 ? (
          <div className="gx-stall__grid">
            {catalog.map((item) => {
              const quantity = qty[item.key] ?? 1;
              const have = ownedOf(item.key);
              const total = BigInt(item.priceGold) * BigInt(quantity);
              const afterOwned = have + quantity;
              let purse = 0n;
              try {
                purse = BigInt(gold);
              } catch {
                purse = 0n;
              }
              const canAfford = purse >= total;
              const goldAfter = canAfford ? purse - total : purse;
              const missing = canAfford ? 0n : total - purse;
              const busy = busyKey === item.key;
              return (
                <article key={item.key} className="gx-stall-card" data-rarity={item.rarity ?? "COMMON"}>
                  <div className="gx-stall-card__top">
                    <div>
                      <small>{RARITY_PT[item.rarity ?? ""] ?? "Mercadoria"}</small>
                      <p>{item.name}</p>
                    </div>
                    <div className="gx-stall-card__owned">
                      <small>Você tem</small>
                      <b>×{have}</b>
                    </div>
                  </div>
                  <p className="gx-stall-card__blurb">{item.blurb ?? "Orbe de captura. Não vende poder."}</p>
                  <div className="gx-stall-card__meta">
                    <span className="gx-stall-card__chip">{formatGold(item.priceGold)} GOLD / un.</span>
                    {item.capturePower ? (
                      <span className="gx-stall-card__chip">Poder {item.capturePower.toLocaleString("pt-BR")}×</span>
                    ) : null}
                  </div>
                  <div className="gx-stall-card__pay">
                    <div className="gx-stall-card__row">
                      <p className="gx-stall-card__price">
                        {formatGold(item.priceGold)}
                        <small>GOLD</small>
                      </p>
                      <div className="gx-stall__stepper" aria-label={`Quantidade de ${item.name}`}>
                        <button type="button" disabled={quantity <= 1 || busy} onClick={() => setAmount(item.key, quantity - 1)}>
                          −
                        </button>
                        <b>{quantity}</b>
                        <button
                          type="button"
                          disabled={quantity >= MAX_QTY || busy}
                          onClick={() => setAmount(item.key, quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <p className="gx-stall-card__total" data-poor={!canAfford}>
                      {canAfford ? (
                        <>
                          Comprar {quantity} por <strong>{formatGold(total.toString())} GOLD</strong>. Cofre ×{have} → ×
                          {afterOwned}. Bolsa depois: {formatGold(goldAfter.toString())}.
                        </>
                      ) : (
                        <>
                          Faltam <strong>{formatGold(missing.toString())} GOLD</strong> para {quantity} {item.name}.
                        </>
                      )}
                    </p>
                    <button type="button" className="gx-cta" disabled={!canAfford || busy} onClick={() => void buy(item)}>
                      {busy ? "Selando…" : `Comprar ${quantity}`}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}

        {receipts.length > 0 ? (
          <section className="gx-stall__tickets" aria-label="Compras desta visita">
            <p className="gx-page__kicker">Nesta visita</p>
            {receipts.map((row) => (
              <article key={row.referenceId} className="gx-stall__ticket" data-flash={row.referenceId === flashId}>
                <small>Recibo</small>
                <b>
                  +{row.quantity} {row.name}
                </b>
                <span>
                  −{formatGold(row.totalGold)} GOLD · cofre ×{row.ownedAfter}
                </span>
              </article>
            ))}
          </section>
        ) : null}
      </div>
    </GameShell>
  );
}
