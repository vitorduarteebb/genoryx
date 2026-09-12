"use client";

import { defaultCharacterAppearance, parseCharacterAppearance } from "@nexora/config";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "../../../lib/api";
import { useAuthStore } from "../../../lib/auth-store";
import { useGameSession } from "../../../lib/use-game-session";

export default function CharacterAppearancePage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const { character } = useGameSession();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const appearance = parseCharacterAppearance(character?.appearance ?? defaultCharacterAppearance);

  async function confirm() {
    if (!accessToken) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      await api("/characters/me/appearance", {
        method: "PATCH",
        accessToken,
        body: { appearance },
      });
      router.push("/game/starter");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível confirmar o Tamer.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6">
      <p className="text-[11px] uppercase tracking-[0.28em] text-crystal">GENORYX · Genesis</p>
      <h1 className="font-display mt-2 text-3xl text-gold">Tamer</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        A criação e a customização 3D acontecem no cliente Unity, cena{" "}
        <span className="text-crystal">CharacterCreation</span>. O mesmo{" "}
        <span className="text-crystal">CharacterAssembler</span> monta o avatar no Creator e em Haven. Esta
        página só confirma os IDs salvos na conta — não é preview 3D e não usa imagem Meshy.
      </p>
      <p className="mt-4 text-xs text-muted">
        {character?.name ?? "Tamer"} · {appearance.hairId} · {appearance.chestId} · {appearance.skinTone}
      </p>
      {error ? <p className="mt-3 text-sm text-ember">{error}</p> : null}
      <button
        type="button"
        disabled={pending}
        onClick={() => void confirm()}
        className="mt-6 rounded-full bg-gold px-6 py-2 text-sm font-semibold text-[#1a1408] disabled:opacity-60"
      >
        {pending ? "Salvando…" : "Confirmar e continuar"}
      </button>
    </main>
  );
}
