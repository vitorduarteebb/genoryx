export function presentModel(row: {
  modelAssets?: Array<{
    lifeStage: string;
    status: string;
    publicUrl?: string | null;
    modelHash?: string | null;
    version: number;
  }>;
  lifeStage: string;
}) {
  const ready = (row.modelAssets ?? []).find(
    (asset) => asset.lifeStage === row.lifeStage && asset.status === "READY" && asset.publicUrl,
  );
  if (!ready?.publicUrl) {
    return null;
  }
  const sep = ready.publicUrl.includes("?") ? "&" : "?";
  return {
    status: "READY" as const,
    url: ready.modelHash ? `${ready.publicUrl}${sep}v=${ready.modelHash.slice(0, 16)}` : ready.publicUrl,
    version: ready.version,
  };
}
