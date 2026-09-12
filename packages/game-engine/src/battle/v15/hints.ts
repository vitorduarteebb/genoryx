import type { BattleState, CardInstance, Combatant, PlayableCard } from "../types";
import { effectMetaOf } from "./card-meta";
import { resolveMatchRules } from "./match-rules";

export type CombatHint = {
  kind: "COMBO" | "REACTION" | "CARD_BLOCKED" | "TARGET_BLOCKED" | "SUPREME" | "RESOURCE";
  text: string;
  cardInstanceId?: string;
  public: true;
};

export function casualHints(
  state: BattleState,
  sideIndex: 0 | 1,
  playDefinition: (card: CardInstance) => PlayableCard | { name?: string; effects?: PlayableCard["effects"]; ability?: PlayableCard["ability"]; tags?: readonly string[]; locusRole?: string } | null,
): CombatHint[] {
  const rules = resolveMatchRules(state);
  if (!rules.hintsEnabled) {
    return [];
  }
  const side = state.sides[sideIndex];
  const foe = state.sides[sideIndex === 0 ? 1 : 0];
  const hints: CombatHint[] = [];
  const enemyStatuses = new Set(foe.creatures.flatMap((unit) => unit.statuses.map((row) => row.key)));
  for (const card of side.hand) {
    const def = playDefinition(card);
    if (!def) continue;
    const meta = effectMetaOf(def as PlayableCard);
    const hit = meta.reactsTo.find((token) => enemyStatuses.has(token));
    if (hit) {
      hints.push({
        kind: "COMBO",
        cardInstanceId: card.instanceId,
        public: true,
        text: `${hit} + ${def.name ?? card.definitionKey} → follow-up disponível`,
      });
    }
    if (meta.produces.includes("WET") && enemyStatuses.has("SHOCK")) {
      hints.push({ kind: "REACTION", cardInstanceId: card.instanceId, public: true, text: "WET detectado → CONDUCTIVE disponível" });
    }
    const owner = ownerOf(side.creatures, card.sourceCreatureId);
    if (owner?.resourceDef && (card.locus === "ULTIMATE" || def.locusRole === "ULTIMATE")) {
      const have = owner.resources?.[owner.resourceDef.id] ?? 0;
      const need = owner.resourceDef.maxStacks;
      if (have < need) {
        hints.push({
          kind: "SUPREME",
          cardInstanceId: card.instanceId,
          public: true,
          text: `Falta: +${need - have} ${owner.resourceDef.displayName}`,
        });
      }
    }
  }
  return hints;
}

function ownerOf(creatures: Combatant[], creatureId?: string) {
  return creatures.find((row) => row.creatureId === creatureId);
}

export function casualSummary(state: BattleState, sideIndex: 0 | 1) {
  const side = state.sides[sideIndex];
  return {
    bestSynergies: (side.geneticChain?.links ?? []).flatMap((link) => link.produces).slice(0, 6),
    maxChain: side.geneticChain?.maxLength ?? 0,
    resonanceGenerated: side.teamResonance?.gainedThisBattle ?? 0,
  };
}
