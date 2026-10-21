"use client";

import { useEffect, useState } from "react";
import { GameShell, Panel } from "../../../components/game-shell";
import { api } from "../../../lib/api";
import { useCharacterStore } from "../../../lib/character-store";
import { useGameSession } from "../../../lib/use-game-session";

function formatAmount(value: string) {
  try {
    return BigInt(value).toLocaleString("pt-BR");
  } catch {
    return value;
  }
}

export default function InventoryPage() {
  const { accessToken } = useGameSession();
  const applyWallets = useCharacterStore((state) => state.applyWallets);
  const [data, setData] = useState<{
    wallets: Array<{ currency: string; balance: string }>;
    items: Array<{ key: string; name: string; quantity: number; category?: string }>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    void api<{
      wallets: Array<{ currency: string; balance: string }>;
      items: Array<{ key: string; name: string; quantity: number; category?: string }>;
    }>("/inventory", { accessToken })
      .then((row) => {
        setData(row);
        applyWallets(row.wallets);
      })
      .catch(() => setError("O cofre não abriu."));
  }, [accessToken, applyWallets]);

  return (
    <GameShell kicker="Relicário" title="Cofre" subtitle="O que você carrega. Quantidade e saldo vêm do ledger — nunca de um número solto.">
      {error ? <p className="mt-2 text-ember">{error}</p> : null}
      <div className="grid gap-3 md:grid-cols-2">
        {data?.wallets.map((row) => (
          <Panel key={row.currency}>
            <p className="gx-page__kicker">{row.currency}</p>
            <p className="gx-page__title !text-3xl">{formatAmount(row.balance)}</p>
          </Panel>
        ))}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {data?.items.map((item) => (
          <Panel key={item.key}>
            <p className="gx-page__kicker">{item.category === "CONSUMABLES" ? "Consumível" : "Material"}</p>
            <h2 className="font-display text-2xl text-gold">{item.name}</h2>
            <p className="mt-2 font-display text-4xl text-crystal">×{item.quantity}</p>
          </Panel>
        ))}
        {data && data.items.length === 0 ? (
          <div className="gx-empty sm:col-span-2">
            <p>O cofre espera a primeira relíquia. A bancada do Theo vende orbes.</p>
          </div>
        ) : null}
      </div>
    </GameShell>
  );
}
