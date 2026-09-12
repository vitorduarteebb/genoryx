"use client";

import { useEffect, useState } from "react";
import { api } from "./api";
import { useGameSession } from "./use-game-session";

export type EvolutionQueueItem = {
  creatureId: string;
  name: string;
  speciesName: string;
  lifeStage: string;
  nextLifeStage: string | null;
  level: number;
};

export function useEvolutionQueue() {
  const { accessToken } = useGameSession();
  const [queue, setQueue] = useState<{ count: number; items: EvolutionQueueItem[] } | null>(null);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    let stop = false;
    void api<{ count: number; items: EvolutionQueueItem[] }>("/creatures/evolution-queue", { accessToken })
      .then((next) => {
        if (!stop) {
          setQueue(next);
        }
      })
      .catch(() => {
        if (!stop) {
          setQueue({ count: 0, items: [] });
        }
      });
    return () => {
      stop = true;
    };
  }, [accessToken]);

  return queue;
}
