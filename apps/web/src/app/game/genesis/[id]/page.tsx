"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GenesisReveal, type GenesisPayload } from "../../../../components/genesis/genesis-reveal";
import { GameShell } from "../../../../components/game-shell";
import { api } from "../../../../lib/api";
import { useGameSession } from "../../../../lib/use-game-session";

export default function GenesisRevealPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { accessToken } = useGameSession();
  const [payload, setPayload] = useState<GenesisPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !id) {
      return;
    }
    let stop = false;
    let timer: number | undefined;
    const load = async () => {
      try {
        const next = await api<GenesisPayload>(`/creatures/${id}/genesis`, { accessToken });
        if (stop) {
          return;
        }
        setPayload(next);
        if (next.revealStatus === "REVEALED" || next.revealStatus === "NOT_REQUIRED") {
          router.replace(`/game/creatures/${id}`);
          return;
        }
        if (next.revealStatus === "PENDING_VISUAL" && !next.visual?.canConfirm) {
          timer = window.setTimeout(() => void load(), 2500);
        }
      } catch (err) {
        if (!stop) {
          setError(err instanceof Error ? err.message : "Não foi possível abrir o Genesis.");
        }
      }
    };
    void load();
    return () => {
      stop = true;
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [accessToken, id, router]);

  async function confirm() {
    if (!accessToken || !id) {
      return;
    }
    await api(`/creatures/${id}/reveal`, { method: "POST", accessToken });
    router.replace(`/game/creatures/${id}`);
  }

  if (error) {
    return <GameShell title="Genesis">{error}</GameShell>;
  }
  if (!payload) {
    return <GameShell title="Genesis">Carregando…</GameShell>;
  }

  return (
    <GameShell title="Nascimento" subtitle="A arte canônica só aparece aqui, depois do pulso.">
      <GenesisReveal payload={payload} onConfirm={confirm} onLeave={() => router.push("/game/genesis")} />
    </GameShell>
  );
}
