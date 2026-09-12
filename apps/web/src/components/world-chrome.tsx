"use client";

import Link from "next/link";
import { useState } from "react";

type WorldChromeProps = {
  characterName: string;
  level: number;
  mapLabel: string;
  onLogout: () => void;
};

export function WorldChrome({ characterName, level, mapLabel, onLogout }: WorldChromeProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <p className="pointer-events-none absolute left-1/2 top-3 z-30 -translate-x-1/2 rounded-full border border-amber-700/50 bg-black/70 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-amber-200/80">
        DEV_WORLD · protótipo técnico
      </p>

      <aside className="absolute left-4 top-12 z-20 w-56 rounded-xl border border-[#2a2438] bg-black/72 px-3 py-3 text-[#f4efe4] shadow-lg">
        <p className="font-[Cinzel,serif] text-sm text-[#e4c36a]">
          {characterName} <span className="text-xs text-[#9a90a8]">{level}</span>
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded bg-[#2a1c18]">
          <div className="h-full w-4/5 bg-[#b43c3c]" />
        </div>
        <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-[#7ee0d6]">Companion · no chão na slice Unity</p>
        <div className="mt-1 h-1 overflow-hidden rounded bg-[#2a2410]">
          <div className="h-full w-2/5 bg-[#e4c36a]" />
        </div>
      </aside>

      <aside className="absolute right-4 top-12 z-20 w-40 rounded-xl border border-[#2a2438] bg-black/72 px-3 py-3 text-right text-[#f4efe4]">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#e4c36a]">Minimap</p>
        <p className="mt-1 text-xs text-[#c8c0b0]">{mapLabel}</p>
      </aside>

      <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {["1", "2", "3", "4", "5"].map((slot) => (
          <span key={slot} className="grid h-9 w-9 place-items-center rounded-md border border-[#2a2438] bg-black/70 text-xs text-[#9a90a8]">
            {slot}
          </span>
        ))}
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="ml-2 rounded-md border border-gold/40 bg-black/70 px-3 text-[10px] uppercase tracking-[0.16em] text-gold"
        >
          Menu
        </button>
      </div>

      {open ? (
        <div className="absolute bottom-16 left-1/2 z-30 flex -translate-x-1/2 gap-2 rounded-xl border border-[#2a2438] bg-black/85 px-3 py-2 text-[10px] uppercase tracking-[0.16em]">
          <Link href="/game/creatures" className="text-muted">
            Creatures
          </Link>
          <Link href="/game/party" className="text-muted">
            Party
          </Link>
          <Link href="/game/chamber" className="text-gold">
            Chamber
          </Link>
          <Link href="/game/market" className="text-muted">
            Market
          </Link>
          <button type="button" onClick={onLogout} className="text-muted">
            Sair
          </button>
        </div>
      ) : null}
    </>
  );
}
