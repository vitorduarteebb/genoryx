"use client";

export function GenesisAnimation({ phase }: { phase: "idle" | "merging" | "flash" | "forming" }) {
  if (phase === "idle") {
    return null;
  }
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
      <div
        className={`rounded-full border border-crystal/40 px-6 py-3 font-display tracking-[0.22em] text-gold ${
          phase === "flash" ? "bg-gold/20" : "bg-void/70"
        }`}
      >
        {phase === "merging" ? "GENOME SYNTHESIS" : phase === "flash" ? "PULSO" : "EGG FORMING"}
      </div>
    </div>
  );
}
