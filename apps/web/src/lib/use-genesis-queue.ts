"use client";

import { useEffect, useState } from "react";
import { api } from "./api";
import { useGameSession } from "./use-game-session";

export type GenesisQueueItem = {
  creatureId: string;
  revealStatus: "PENDING_VISUAL" | "READY_TO_REVEAL" | string;
  visual: { status: string; lifeStage: string; url: string | null };
};

export type GenesisQueue = {
  count: number;
  pendingVisual: number;
  readyToReveal: number;
  items: GenesisQueueItem[];
};

export function useGenesisQueue() {
  const { accessToken } = useGameSession();
  const [queue, setQueue] = useState<GenesisQueue | null>(null);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    let stop = false;
    let timer: number | undefined;
    const tick = async () => {
      try {
        const next = await api<GenesisQueue>("/creatures/genesis-queue", { accessToken });
        if (stop) {
          return;
        }
        setQueue(next);
        if (next.pendingVisual > 0) {
          timer = window.setTimeout(() => void tick(), 2500);
        }
      } catch {
        if (!stop) {
          timer = window.setTimeout(() => void tick(), 4000);
        }
      }
    };
    void tick();
    return () => {
      stop = true;
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [accessToken]);

  return queue;
}
