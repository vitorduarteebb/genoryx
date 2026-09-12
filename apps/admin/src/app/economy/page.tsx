"use client";

import { useState } from "react";

type Dashboard = {
  window: string;
  from: string;
  to: string;
  activeUsers: number;
  goldMinted: string;
  goldSunk: string;
  netGold: string;
  goldPerActiveUser: number;
  marketGmv: string;
  marketFees: string;
  listingFees: string;
  saleFees: string;
  breedCount: number;
  eggCount: number;
  captureCount: number;
  creaturesCreated: number;
  creaturesTotal: number;
  catalystsGenerated: number;
  catalystsConsumed: number;
  nexOrbsPurchased: number;
  fertilityRemaining: Record<string, number>;
  dailyGoldRewardBudget: number;
  nex: { enabled: boolean; emission: number };
};

const windows = ["24h", "7d", "30d"] as const;

export default function EconomyDashboardPage() {
  const [apiUrl, setApiUrl] = useState("http://localhost:4000");
  const [token, setToken] = useState("");
  const [windowKey, setWindowKey] = useState<(typeof windows)[number]>("24h");
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const res = await fetch(`${apiUrl.replace(/\/$/, "")}/admin/economy/dashboard?window=${windowKey}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      setData((await res.json()) as Dashboard);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Falha ao carregar");
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <p className="text-xs uppercase tracking-[0.4em] text-crystal">Control Center · interno</p>
      <h1 className="mt-3 font-display text-4xl text-gold">Economy Dashboard</h1>
      <p className="mt-3 max-w-2xl text-sm text-[#9a90a8]">
        Não é público no jogo. Exige JWT ADMIN. GOLD, sinks e supply de assets — NEX permanece em 0 no Alpha.
      </p>

      <section className="mt-8 grid gap-3 rounded-2xl border border-[#2a2438] bg-panel p-4 md:grid-cols-[1fr_1fr_auto]">
        <input
          className="rounded-xl border border-[#2a2438] bg-void px-3 py-2 text-sm"
          value={apiUrl}
          onChange={(event) => setApiUrl(event.target.value)}
          placeholder="API URL"
        />
        <input
          className="rounded-xl border border-[#2a2438] bg-void px-3 py-2 text-sm"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="JWT admin"
        />
        <div className="flex gap-2">
          {windows.map((key) => (
            <button
              key={key}
              type="button"
              className={`rounded-full px-3 py-1 text-sm ${windowKey === key ? "bg-gold/20 text-gold" : "text-[#9a90a8]"}`}
              onClick={() => setWindowKey(key)}
            >
              {key}
            </button>
          ))}
          <button type="button" className="rounded-full border border-gold/40 px-4 py-1 text-sm text-gold" onClick={() => void load()}>
            Abrir
          </button>
        </div>
      </section>

      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

      {data ? (
        <section className="mt-8 grid gap-3 md:grid-cols-3">
          <Metric label="Gold minted" value={data.goldMinted} />
          <Metric label="Gold sunk" value={data.goldSunk} />
          <Metric label="Net gold" value={data.netGold} />
          <Metric label="Active users" value={String(data.activeUsers)} />
          <Metric label="Gold / active" value={data.goldPerActiveUser.toFixed(2)} />
          <Metric label="Budget diário" value={String(data.dailyGoldRewardBudget)} />
          <Metric label="Market GMV" value={data.marketGmv} />
          <Metric label="Market fees" value={data.marketFees} />
          <Metric label="Listing fees" value={data.listingFees} />
          <Metric label="Criaturas total" value={String(data.creaturesTotal)} />
          <Metric label="Criaturas / janela" value={String(data.creaturesCreated)} />
          <Metric label="Ovos" value={String(data.eggCount)} />
          <Metric label="Breeds" value={String(data.breedCount)} />
          <Metric label="Capturas" value={String(data.captureCount)} />
          <Metric label="Catalysts +" value={String(data.catalystsGenerated)} />
          <Metric label="Catalysts −" value={String(data.catalystsConsumed)} />
          <Metric label="NexOrbs shop" value={String(data.nexOrbsPurchased)} />
          <Metric label="NEX emission" value={String(data.nex.emission)} />
        </section>
      ) : null}

      {data ? (
        <section className="mt-8 rounded-2xl border border-[#2a2438] bg-panel p-4">
          <p className="text-xs uppercase tracking-[0.28em] text-gold">Fertility restante</p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-[#f4efe4]">
            {Object.entries(data.fertilityRemaining)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([fertility, count]) => (
                <span key={fertility} className="rounded-full border border-[#2a2438] px-3 py-1">
                  {fertility}/5 · {count}
                </span>
              ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-[#2a2438] bg-panel px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.24em] text-[#9a90a8]">{label}</p>
      <p className="mt-1 font-display text-2xl text-gold">{value}</p>
    </article>
  );
}
