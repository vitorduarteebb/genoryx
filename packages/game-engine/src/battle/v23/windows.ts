import { getCardDefinition, type ResponseWindow } from "@nexora/config";
import type { BattleSide, BattleState, CardInstance, PlayableCard } from "../types";
import type { StackFrame } from "./types";
import { canAnswerSpeed, domainAllowsCounter, hydrateResolutionProfile } from "./timing";
import { impetusUsedOf } from "./mana";

export type EligibleResponse = {
  side: 0 | 1;
  card: CardInstance;
  definition: PlayableCard;
  reason: string;
};

function definitionOf(card: CardInstance): PlayableCard | null {
  if (card.resolved) {
    return card.resolved;
  }
  const catalog = getCardDefinition(card.definitionKey);
  return catalog ? { ...catalog, effects: [...catalog.effects], typology: card.typology ?? catalog.typology } : null;
}

export function eligibleResponses(
  state: BattleState,
  window: ResponseWindow,
  top: StackFrame | undefined,
  resolveDef: (card: CardInstance) => PlayableCard | null = definitionOf,
): EligibleResponse[] {
  if (!top) return [];
  const found: EligibleResponse[] = [];
  const targetProfile = {
    stackSpeed: top.stackSpeed,
    timingClass: top.timingClass,
    effectDomain: top.domain,
    universalCounter: false,
    counterDomains: [top.domain],
  };
  for (const sideIndex of [0, 1] as const) {
    const side = state.sides[sideIndex];
    const pool = [...side.hand, ...(side.reactionSlot ? [side.reactionSlot.card] : [])];
    for (const card of pool) {
      const def = resolveDef(card);
      if (!def) continue;
      const profile = hydrateResolutionProfile(def, card.locus ?? def.locusRole);
      if (!profile.canJoinStack) continue;
      const tags = def.tags ?? [];
      const intervention =
        profile.timingClass === "COUNTER" ||
        Boolean(profile.interventionOp) ||
        tags.some((tag) => ["COUNTER", "INTERCEPT", "DODGE", "LAST_STAND", "MITIGATE", "SUPPRESS", "REACTION"].includes(tag));
      if (!intervention) continue;
      if (!profile.responseWindows.includes(window)) continue;
      if (!canAnswerSpeed(profile, targetProfile as ReturnType<typeof hydrateResolutionProfile>)) continue;
      if (profile.timingClass === "COUNTER" && !domainAllowsCounter(profile, top.domain)) continue;
      if (profile.timingClass === "IMPETUS") {
        const used = impetusUsedOf(side, card.sourceCreatureId);
        if (used >= profile.impetusLimit) continue;
      }
      if (profile.timingClass === "REACTION" && profile.trigger === "SELF_TARGETED_BY_ATTACK") {
        const owner = side.creatures.find((unit) => unit.creatureId === card.sourceCreatureId);
        if (
          top.targetId &&
          owner &&
          owner.id !== top.targetId &&
          owner.creatureId !== top.targetId
        ) {
          continue;
        }
      }
      const manaNeed = profile.manaCost;
      if ((side.mana ?? 0) < manaNeed) continue;
      found.push({ side: sideIndex, card, definition: def, reason: `${profile.timingClass}:${window}` });
    }
  }
  return found;
}

export function shouldOpenWindow(eligible: readonly EligibleResponse[]): boolean {
  return eligible.length > 0;
}

export function autoPassSides(eligible: readonly EligibleResponse[]): [boolean, boolean] {
  return [!eligible.some((row) => row.side === 0), !eligible.some((row) => row.side === 1)];
}

export function pveInterventionBudget(tier: "WILD" | "ELITE" | "BOSS", rolled: number): number {
  if (tier === "WILD") return rolled <= 0 ? 0 : 1;
  if (tier === "ELITE") return Math.min(4, Math.max(2, rolled));
  return Math.max(6, rolled);
}

export function sideHasValidResponse(side: BattleSide, eligible: readonly EligibleResponse[], sideIndex: 0 | 1): boolean {
  return eligible.some((row) => row.side === sideIndex) && (side.mana ?? 0) > 0;
}
