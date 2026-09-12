"use client";

import type { ReactNode } from "react";
import { GenesisEggVisual } from "./genesis-egg-visual";
import type { PublicEggHints } from "../../lib/genesis-presentation";

export function EggStage({ title, action, hints }: { title: string; action?: ReactNode;hints?:PublicEggHints }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <GenesisEggVisual hints={hints} motion="ready" size={320} />
      <p className="font-display text-3xl text-gold">{title}</p>
      {action}
    </div>
  );
}
