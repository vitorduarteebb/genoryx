"use client";

import { useEffect, useState } from "react";
import { GameShell, Panel } from "../../../components/game-shell";
import { api } from "../../../lib/api";
import { useGameSession } from "../../../lib/use-game-session";

export default function ShopPage() {
  const { accessToken } = useGameSession();
  const [items, setItems] = useState<Array<{ key: string; name: string; priceGold: number }>>([]);

  useEffect(() => {
    if (!accessToken) return;
    void api<{ items: Array<{ key: string; name: string; priceGold: number }> }>("/shop", { accessToken }).then((row) =>
      setItems(row.items),
    );
  }, [accessToken]);

  return (
    <GameShell kicker="Bancada de Theo" title="Ofertas" subtitle="O ouro some no ledger. O item nasce no cofre. Nada aqui vende poder.">
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <Panel key={item.key}>
            <p className="gx-page__kicker">Mercadoria</p>
            <h2 className="gx-page__title !text-3xl">{item.name}</h2>
            <p className="mt-2 text-gold">{item.priceGold.toLocaleString("pt-BR")} GOLD</p>
            <button
              type="button"
              className="gx-cta mt-4"
              onClick={() =>
                void api("/shop/buy", { method: "POST", accessToken, body: { itemKey: item.key, quantity: 1 } })
              }
            >
              Adquirir
            </button>
          </Panel>
        ))}
        {items.length === 0 ? (
          <div className="gx-empty">
            <p>Theo ainda não abriu a bancada.</p>
          </div>
        ) : null}
      </div>
    </GameShell>
  );
}
