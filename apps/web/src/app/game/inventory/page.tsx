"use client";

import { useEffect, useState } from "react";
import { GameShell, Panel } from "../../../components/game-shell";
import { api } from "../../../lib/api";
import { useGameSession } from "../../../lib/use-game-session";

export default function InventoryPage() {
  const { accessToken } = useGameSession();
  const [data, setData] = useState<{ wallets: Array<{ currency: string; balance: string }>; items: Array<{ key: string; name: string; quantity: number }> } | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    void api<{ wallets: Array<{ currency: string; balance: string }>; items: Array<{ key: string; name: string; quantity: number }> }>(
      "/inventory",
      { accessToken },
    ).then(setData);
  }, [accessToken]);

  return (
    <GameShell kicker="Relicário" title="Cofre" subtitle="O que você carrega. O saldo é o mesmo do ledger — nunca um número solto.">
      <div className="grid gap-3 md:grid-cols-2">
        {data?.wallets.map((row) => (
          <Panel key={row.currency}>
            <p className="gx-page__kicker">{row.currency}</p>
            <p className="gx-page__title !text-3xl">
              {(() => {
                try {
                  return BigInt(row.balance).toLocaleString("pt-BR");
                } catch {
                  return row.balance;
                }
              })()}
            </p>
          </Panel>
        ))}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {data?.items.map((item) => (
          <Panel key={item.key}>
            <p className="gx-page__kicker">Material</p>
            <h2 className="font-display text-2xl text-gold">{item.name}</h2>
            <p className="mt-1 text-crystal">× {item.quantity}</p>
          </Panel>
        ))}
        {data && data.items.length === 0 ? (
          <div className="gx-empty sm:col-span-2">
            <p>O cofre espera a primeira relíquia.</p>
          </div>
        ) : null}
      </div>
    </GameShell>
  );
}
