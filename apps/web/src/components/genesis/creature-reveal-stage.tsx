"use client";

import { officialPortraitSrc } from "../../lib/creature-art";

export function CreatureRevealStage({ url, aura }: { url: string; aura?: string | null }) {
  return (
    <div className="relative flex items-center justify-center px-6 py-12">
      <AuraParticles aura={aura} />
      <img src={officialPortraitSrc(url) ?? url} alt="" className="genesis-reveal-art relative z-10 h-64 w-64 object-contain" />
    </div>
  );
}

function AuraParticles({ aura }: { aura?: string | null }) {
  if (!aura || aura === "NONE") {
    return null;
  }
  return (
    <>
      <span className="genesis-spark left-[42%] top-[38%]" />
      <span className="genesis-spark left-[56%] top-[46%]" style={{ animationDelay: "0.4s" }} />
      <span className="genesis-spark left-[48%] top-[58%]" style={{ animationDelay: "0.8s" }} />
    </>
  );
}
