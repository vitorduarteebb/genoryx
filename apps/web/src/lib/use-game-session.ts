"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { CharacterAppearance } from "@nexora/config";
import { api } from "./api";
import { useAuthStore } from "./auth-store";

export type CharacterMe = {
  id: string;
  name: string;
  level: number;
  xp: number;
  class: string;
  mapKey: string;
  starterChosen: boolean;
  appearance?: CharacterAppearance;
  appearanceConfirmed?: boolean;
  wallets: Array<{ currency: string; balance: string }>;
};

export function useGameSession() {
  const router = useRouter();
  const { accessToken, ready } = useAuthStore();
  const [character, setCharacter] = useState<CharacterMe | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!accessToken) {
      router.replace("/login");
      return;
    }
    void api<CharacterMe>("/characters/me", { accessToken })
      .then((row) => {
        setCharacter(row);
        const path = window.location.pathname;
        if (!row.appearanceConfirmed && !path.startsWith("/game/appearance")) {
          router.replace("/game/appearance");
          return;
        }
        if (
          row.appearanceConfirmed &&
          !row.starterChosen &&
          !path.startsWith("/game/starter")
        ) {
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
  }, [accessToken, ready, router]);

  return { accessToken, character, error };
}
