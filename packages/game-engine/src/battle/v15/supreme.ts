import type { Combatant, PlayableCard } from "../types";

export function supremeReady(unit: Combatant, cards: Array<{ locus?: string; resolved?: PlayableCard | null; definitionKey: string }>): boolean {
  const hasUltimate = cards.some((card) => card.locus === "ULTIMATE" || card.resolved?.locusRole === "ULTIMATE" || card.resolved?.type === "ULTIMATE");
  if (!hasUltimate || !unit.resourceDef) {
    return Boolean(hasUltimate && !unit.resourceDef);
  }
  const have = unit.resources?.[unit.resourceDef.id] ?? 0;
  return have >= unit.resourceDef.maxStacks;
}

export function supremeTelegraph(unit: Combatant): string | null {
  if (!unit.supremeReady) {
    return null;
  }
  const def = unit.resourceDef;
  const have = def ? (unit.resources?.[def.id] ?? 0) : 0;
  const cap = def?.maxStacks ?? 0;
  return def ? `${def.displayName.toUpperCase()} ${have}/${cap} · SUPREME READY` : "SUPREME READY";
}
