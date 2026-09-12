"use client";

import Link from "next/link";
import { GameShell, Panel } from "../../../components/game-shell";
import { useGenesisQueue } from "../../../lib/use-genesis-queue";

export default function GenesisQueuePage() {
  const queue = useGenesisQueue();
  const next = queue?.items[0];

  return (
    <GameShell kicker="Primeiro pulso" title="Revelação" subtitle="Uma criatura por vez. O nascimento não se perde.">
      <Panel>
        {!queue || queue.count === 0 ? (
          <div className="gx-empty">
            <p>Nenhuma criatura aguarda o círculo. Quando um ovo romper, o pulso começa aqui.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-gold">
              {queue.readyToReveal} pronta{queue.readyToReveal === 1 ? "" : "s"} · {queue.pendingVisual} formando
            </p>
            {next ? (
              <Link href={`/game/genesis/${next.creatureId}`} className="gx-cta">
                Revelar a próxima
              </Link>
            ) : null}
          </div>
        )}
      </Panel>
    </GameShell>
  );
}
