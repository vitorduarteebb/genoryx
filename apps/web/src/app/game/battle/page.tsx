"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { GameShell } from "../../../components/game-shell";
import { api } from "../../../lib/api";
import { useGameSession } from "../../../lib/use-game-session";

function StartWild() {
  const router = useRouter();
  const params = useSearchParams();
  const { accessToken } = useGameSession();

  useEffect(() => {
    if (!accessToken) return;
    const offerId = params.get("offerId") ?? undefined;
    void api<{ battleId: string }>("/battles/wild", {
      method: "POST",
      accessToken,
      body: offerId ? { offerId } : {},
    })
      .then((row) => router.replace(`/game/battle/${row.battleId}`))
      .catch(() => router.replace("/game/arena"));
  }, [accessToken, params, router]);

  return <GameShell title="Encontro">Abrindo batalha…</GameShell>;
}

export default function BattleIndexPage() {
  return (
    <Suspense fallback={<GameShell title="Encontro">Abrindo batalha…</GameShell>}>
      <StartWild />
    </Suspense>
  );
}
