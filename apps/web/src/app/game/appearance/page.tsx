"use client";

import { parseCharacterAppearance } from "@nexora/config";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TamerEditor } from "../../../components/tamer-editor";
import { api } from "../../../lib/api";
import { useCharacterStore, type CharacterMe } from "../../../lib/character-store";
import { useGameSession } from "../../../lib/use-game-session";

export default function CharacterAppearancePage() {
  const router = useRouter();
  const { accessToken, character } = useGameSession();
  const [draft, setDraft] = useState(() => parseCharacterAppearance(null));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (character) setDraft(parseCharacterAppearance(character.appearance));
  }, [character]);

  async function save() {
    if (!accessToken || !character) return;
    setPending(true);
    setError(null);
    try {
      const saved = await api<Omit<CharacterMe, "wallets">>("/characters/me/appearance", {
        method: "PATCH",
        accessToken,
        body: { appearance: draft },
      });
      useCharacterStore.getState().setCharacter({
        ...character,
        ...saved,
        wallets: character.wallets,
      });
      router.push(character.starterChosen ? "/game/adventure" : "/game/starter");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar a aparência.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <p className="text-xs tracking-[0.28em] text-crystal">GENORYX · SEU TREINADOR</p>
      <h1 className="mb-2 font-display text-3xl text-gold">A sua jornada, o seu estilo</h1>
      <p className="mb-6 max-w-2xl text-muted">
        Escolha os detalhes do seu personagem. A aparência salva acompanha você no mundo e no retorno
        da batalha.
      </p>
      <TamerEditor value={draft} onChange={setDraft} />
      {error ? (
        <p role="alert" className="mt-4 text-ember">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        disabled={!character || pending}
        onClick={() => void save()}
        className="mt-6 rounded-xl bg-gold px-6 py-3 font-semibold text-black disabled:opacity-50"
      >
        {pending ? "Salvando…" : "Salvar aparência e continuar"}
      </button>
    </main>
  );
}
