"use client";

import { useEffect, useRef } from "react";

export function GameCanvas({ accessToken, mapKey }: { accessToken: string; mapKey: string }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parent = host.current;
    if (!parent) {
      return;
    }

    let game: { destroy: (removeCanvas: boolean) => void } | undefined;
    let cancelled = false;

    void import("../game/bootstrap").then(({ createNexoraGame }) => {
      if (cancelled || !host.current) {
        return;
      }
      game = createNexoraGame(host.current, accessToken, mapKey);
    });

    return () => {
      cancelled = true;
      game?.destroy(true);
    };
  }, [accessToken, mapKey]);

  return (
    <div
      ref={host}
      className="min-h-screen overflow-hidden bg-black"
    />
  );
}
