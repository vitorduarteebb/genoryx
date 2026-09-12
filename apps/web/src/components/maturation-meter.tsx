export type MaturationView = {
  current: number;
  target: number;
  ratio: number;
  state: string;
  label: string;
  requirements: {
    level: { current: number; required: number; met: boolean };
    maturation: { current: number; required: number; met: boolean };
  };
};

export function maturationMarketLabel(lifeStage?: string, maturation?: MaturationView | null) {
  if (lifeStage === "ADULT") {
    return "ADULT · Mature";
  }
  if (!maturation) {
    return lifeStage ?? "BABY";
  }
  return `${lifeStage ?? "BABY"} · Maturation ${maturation.label}`;
}

export function MaturationMeter({
  lifeStage,
  level,
  maturation,
  compact,
}: {
  lifeStage?: string;
  level?: number;
  maturation?: MaturationView | null;
  compact?: boolean;
}) {
  if (!maturation) {
    return null;
  }
  const fill = Math.round(Math.min(1, maturation.ratio) * 100);
  return (
    <div className={compact ? "mt-2" : "mt-4"}>
      <div className="flex items-baseline justify-between text-[10px] uppercase tracking-[0.16em] text-muted">
        <span>Crescimento</span>
        <span className="text-crystal">
          {maturation.current} / {maturation.target}
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#1a1624]">
        <div className="h-full rounded-full bg-gradient-to-r from-crystal to-gold" style={{ width: `${fill}%` }} />
      </div>
      {compact ? null : (
        <ul className="mt-2 space-y-1 text-xs text-muted">
          <li>
            {maturation.requirements.maturation.met ? "✓" : "✗"} Maturação {maturation.current} / {maturation.target}
          </li>
          <li>
            {maturation.requirements.level.met ? "✓" : "✗"} Nível {level ?? maturation.requirements.level.current} /{" "}
            {maturation.requirements.level.required}
          </li>
          <li>Próximo estágio · {lifeStage === "YOUNG" ? "Adulta" : lifeStage === "ADULT" ? "—" : "Jovem"}</li>
        </ul>
      )}
    </div>
  );
}
