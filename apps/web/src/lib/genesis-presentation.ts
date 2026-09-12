/** Presentation only: inputs are public server DTOs, never child DNA. */
export type PublicEggHints = {
  eggId?: string; genesisGrade?: string | null;
  parentA?: { speciesKey?: string } | null; parentB?: { speciesKey?: string } | null;
};
const EGG_TONES: Record<string, readonly [string, string]> = {
  COMMON: ["#246d58", "#f1c77c"], REFINED: ["#075f8e", "#62eaff"], RARE: ["#472390", "#d49cff"],
  EXCEPTIONAL: ["#231b28", "#ff843a"], GENESIS: ["#123d57", "#f8d77b"],
};
export function publicEggAppearance(hints: PublicEggHints) {
  // Public lineage changes a decorative seal, never predicts the child's genes.
  const lineage = `${hints.parentA?.speciesKey ?? ""}|${hints.parentB?.speciesKey ?? ""}|${hints.eggId ?? ""}`;
  let signature = 2166136261;
  for (let i = 0; i < lineage.length; i += 1) signature = Math.imul(signature ^ lineage.charCodeAt(i), 16777619) >>> 0;
  const tones = EGG_TONES[hints.genesisGrade ?? "COMMON"] ?? EGG_TONES.COMMON!;
  return { shell: tones[0], energy: tones[1], sealRotation: signature % 60 };
}
export function eggIncubation(egg: { status: string; hatchAt: string; incubationStartedAt: string }, now: number) {
  const hatch = Date.parse(egg.hatchAt), start = Date.parse(egg.incubationStartedAt);
  const valid = Number.isFinite(hatch) && Number.isFinite(start) && hatch >= start && Number.isFinite(now);
  const ready = egg.status === "READY", hatched = egg.status === "HATCHED";
  const seconds = valid ? Math.max(0, Math.ceil((hatch - now) / 1000)) : 0;
  const progress = ready || hatched ? 1 : valid ? Math.max(0, Math.min(1, (now - start) / Math.max(1, hatch - start))) : 0;
  const pad = (n: number) => String(n).padStart(2, "0");
  const time = seconds >= 3600 ? `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(seconds % 60)}` : `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;
  // Client clock only presents a countdown. Server READY authorizes the UI action.
  const label = ready ? "Pronto para nascer" : hatched ? "Nascimento concluído" : !valid || seconds === 0 ? "Verificando incubação…" : time;
  return { ready, hatched, progress, seconds, label };
}
export type GenesisBeat = "wait" | "silence" | "pulse" | "crack" | "burst" | "silhouette" | "reveal" | "named" | "mutation" | "rarity" | "summary";
export type GenesisTimelineRow = { at: number; next: GenesisBeat; hook?: "onPulse" | "onCrack" | "onBurst" | "onSilhouette" | "onReveal" | "onMutation" };
export function genesisTimeline(reduced: boolean, mutation: boolean, rare: boolean): GenesisTimelineRow[] {
  if (reduced) return [{ at: 0, next: "reveal" }, { at: 150, next: "summary" }];
  const rows: GenesisTimelineRow[] = [
    { at: 400, next: "pulse", hook: "onPulse" }, { at: 1400, next: "crack", hook: "onCrack" },
    { at: 2300, next: "burst", hook: "onBurst" }, { at: 2800, next: "silhouette", hook: "onSilhouette" },
    { at: 3400, next: "reveal", hook: "onReveal" }, { at: 4900, next: "named" },
  ];
  if (mutation) rows.push({ at: 5400, next: "mutation", hook: "onMutation" });
  if (rare) rows.push({ at: mutation ? 6100 : 5400, next: "rarity" });
  rows.push({ at: mutation && rare ? 6900 : mutation || rare ? 6200 : 5500, next: "summary" });
  return rows;
}
export function evolutionPresentation(payload: { fromStage: string; toStage: string; evolved?: boolean; canEvolve: boolean }) {
  // A future target already differs before POST. Only server's evolved result marks completion.
  const complete = payload.evolved === true;
  return { complete, canSubmit: payload.canEvolve && !complete };
}
