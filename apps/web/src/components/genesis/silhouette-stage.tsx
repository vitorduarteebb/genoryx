"use client";

import { officialPortraitSrc } from "../../lib/creature-art";

export function SilhouetteStage({ url }: { url: string }) {
  return (
    <div className="genesis-silhouette flex items-center justify-center px-6 py-12">
      <img src={officialPortraitSrc(url) ?? url} alt="" className="genesis-shadow h-64 w-64 object-contain" />
    </div>
  );
}
