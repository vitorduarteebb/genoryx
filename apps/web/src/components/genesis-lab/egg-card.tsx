"use client";

import { useEffect,useState } from "react";
import { eggIncubation } from "../../lib/genesis-presentation";
import { GenesisEggVisual } from "../genesis/genesis-egg-visual";
import { gradeLabel, type GenesisEgg } from "./types";

export function EggCard({
  egg,
  startedAt,
  onHatch,
  busy,
}: {
  egg: GenesisEgg;
  startedAt: string;
  onHatch: () => void;
  busy?: boolean;
}) {
  const [now,setNow]=useState(()=>Date.now());
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
  const clock=eggIncubation({...egg,incubationStartedAt:startedAt},now),progress=clock.progress;

  return (
    <article
      className={`rounded-3xl border p-4 ${
        clock.ready ? "border-gold/50 bg-gold/10" : "border-[#2a2438] bg-void/50"
      }`}
    >
      <div className="flex justify-center"><GenesisEggVisual hints={egg} progress={progress} motion={clock.ready ? "ready" : "incubating"} size={230} /></div>
      <p className="mt-3 text-center text-[10px] uppercase tracking-[0.22em] text-crystal">{gradeLabel(egg.genesisGrade)}</p>
      <p className="text-center font-display text-2xl text-gold">{clock.ready ? "Pronto para nascer" : clock.label}</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#2a2438]">
        <div className="h-full bg-gradient-to-r from-crystal to-gold" style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>
      <p className="mt-2 text-center text-xs text-muted">
        Gen {egg.generation}
        {egg.parentA && egg.parentB ? ` · ${egg.parentA.speciesName} × ${egg.parentB.speciesName}` : ""}
      </p>
      {clock.ready ? (
        <button
          type="button"
          disabled={busy}
          onClick={onHatch}
          className="mt-3 w-full rounded-full border border-gold bg-gold/10 py-2 font-display tracking-[0.18em] text-gold"
        >
          Revelar criatura
        </button>
      ) : (
        <p className="mt-3 text-center text-[10px] uppercase tracking-[0.2em] text-muted">Incubando</p>
      )}
    </article>
  );
}
