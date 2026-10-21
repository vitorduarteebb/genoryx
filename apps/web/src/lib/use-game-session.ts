"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "./api";
import { useAuthStore } from "./auth-store";
import { useCharacterStore, type CharacterMe } from "./character-store";

export type { CharacterMe };

export function useGameSession() {
  const router = useRouter();
  const { accessToken, ready } = useAuthStore();
  const character = useCharacterStore((state) => state.character);
  const setCharacter = useCharacterStore((state) => state.setCharacter);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!accessToken) {
      setCharacter(null);
      router.replace("/login");
      return;
    }
    void api<CharacterMe>("/characters/me", { accessToken })
      .then((row) => {
        const current = useCharacterStore.getState().character;
        if (current?.id === row.id) {
          setCharacter({ ...row, wallets: current.wallets });
        } else {
          setCharacter(row);
        }
        const path = window.location.pathname;
        if (!row.appearanceConfirmed && !path.startsWith("/game/appearance")) {
          router.replace("/game/appearance");
          return;
        }
        if (row.appearanceConfirmed && !row.starterChosen && !path.startsWith("/game/starter")) {
          router.replace("/game/starter");
        }
      })
      .catch((err: { code?: string }) => {
        if (err.code === "CHARACTER_NOT_FOUND") {
          router.replace("/create-character");
          return;
        }
        setError("Falha ao carregar o personagem.");
      });
  }, [accessToken, ready, router, setCharacter]);

  return { accessToken, character, error };
}
