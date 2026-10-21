"use client";

import Link from "next/link";
import { useGameSession } from "../use-game-session";

/** Skin compacto para o World Engineer encaixar no shell sem reescrever navegação. */
export function WorldCompactHeader({ onMenu }: { onMenu?: () => void }) {
  const { character } = useGameSession();
  const gold = character?.wallets.find((wallet) => wallet.currency === "GOLD")?.balance ?? "0";
  let goldLabel = "0";
  try {
    goldLabel = BigInt(gold).toLocaleString("pt-BR");
  } catch {
    goldLabel = String(gold);
  }
  return (
    <header className="gx-adv__compact">
      <p>GX</p>
      <p className="gx-adv__compact-name">{character?.name ?? "Treinador"}</p>
      <p>{goldLabel} G</p>
      <button type="button" onClick={onMenu}>
        Menu
      </button>
      <Link href="/game/creatures" className="sr-only">
        Coleção
      </Link>
    </header>
  );
}
