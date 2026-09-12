import { combatConfig, creatureLifeStageConfig, getCardDefinition, usableLociForStage } from "@nexora/config";
import type { FormationSlot } from "@nexora/types";
import type { PlayableCard } from "../battle/types";
import { isCardKitManifest, kitToDefinition } from "./kit";
import type { RandomService } from "../random/random-service";
import { resolveSynergies } from "../synergy/resolve";
import type { CreatureBlueprint } from "../genes/generate";

export type DeckCard = {
  instanceId: string;
  definitionKey: string;
  sourceCreatureId?: string;
  sourceSlot?: FormationSlot;
  locus?: string;
  typology?: string;
  element?: string;
  geneticPowerId?: string;
  resolved?: PlayableCard;
};

export type DeckFighter = {
  blueprint: CreatureBlueprint;
  creatureId?: string;
  typology?: string;
  powerId?: string;
  slot?: FormationSlot;
};

export type CardContribution = {
  definitionKey: string;
  sourceCreatureId?: string;
  sourceSlot?: FormationSlot;
  locus?: string;
  typology?: string;
  element?: string;
  powerId?: string;
  resolved?: PlayableCard;
};

export function collectCreatureManifestations(creatures: readonly DeckFighter[]): CardContribution[] {
  const keys: CardContribution[] = [];
  for (const fighter of creatures) {
    const allowed = creatureLifeStageConfig.gateCardsByStage
      ? new Set(usableLociForStage(fighter.blueprint.lifeStage ?? "BABY"))
      : null;
    for (const locus of fighter.blueprint.loci) {
      if (allowed && !allowed.has(locus.locusKey)) {
        continue;
      }
      const kit = isCardKitManifest(locus.expressed) ? kitToDefinition(locus.expressed) : undefined;
      const catalog = getCardDefinition(locus.expressed.cardFamily);
      const resolved = kit
        ? { ...kit, typology: fighter.typology }
        : catalog
          ? { ...catalog, element: catalog.element, effects: [...catalog.effects], typology: fighter.typology ?? catalog.typology }
          : undefined;
      if (!resolved && !catalog) continue;
      keys.push({
        definitionKey: locus.expressed.cardFamily,
        sourceCreatureId: fighter.creatureId,
        sourceSlot: fighter.slot,
        locus: locus.locusKey,
        typology: fighter.typology,
        element: fighter.blueprint.elementPrimary,
        powerId: fighter.powerId,
        resolved,
      });
    }
  }
  return keys;
}

export function collectCardContributions(creatures: readonly DeckFighter[]): CardContribution[] {
  const keys = collectCreatureManifestations(creatures);
  const tags = creatures.flatMap((row) => row.blueprint.tags);
  for (const extra of resolveSynergies(tags)) {
    if (keys.some((row) => row.definitionKey === extra)) continue;
    keys.push({ definitionKey: extra });
  }
  return keys.filter((row) => Boolean(row.resolved ?? getCardDefinition(row.definitionKey)));
}

export function collectCardPool(creatures: readonly CreatureBlueprint[]): string[] {
  return collectCreatureManifestations(creatures.map((blueprint) => ({ blueprint }))).map((row) => row.definitionKey);
}

export function shufflePile<T>(items: readonly T[], rng: RandomService): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = rng.nextInt(0, i);
    const current = next[i] as T;
    next[i] = next[j] as T;
    next[j] = current;
  }
  return next;
}

export function buildBattleDeck(creatures: readonly DeckFighter[], rng: RandomService, prefix: string): DeckCard[] {
  const pool = collectCreatureManifestations(creatures);
  const shuffled = shufflePile(pool, rng);
  return shuffled.map((row, index) => ({
    instanceId: `${prefix}-${index}`,
    definitionKey: row.definitionKey,
    sourceCreatureId: row.sourceCreatureId,
    sourceSlot: row.sourceSlot,
    locus: row.locus,
    typology: row.typology,
    element: row.element ?? row.resolved?.element ?? getCardDefinition(row.definitionKey)?.element,
    geneticPowerId: row.powerId,
    resolved: row.resolved,
  }));
}

export function dealOpeningHand<T extends { sourceCreatureId?: string }>(
  deck: T[],
  livingCreatureIds: readonly string[],
  handSize = combatConfig.startingHand,
  rng?: RandomService,
): { hand: T[]; deck: T[] } {
  const guaranteed: T[] = [];
  const taken = new Set<string>();
  for (const id of livingCreatureIds) {
    const index = deck.findIndex((card) => card.sourceCreatureId === id && !taken.has(id));
    if (index < 0) continue;
    guaranteed.push(deck.splice(index, 1)[0]!);
    taken.add(id);
  }
  const extras: T[] = [];
  while (guaranteed.length + extras.length < handSize && deck.length > 0) {
    extras.push(deck.shift()!);
  }
  const hand = rng ? shufflePile([...guaranteed, ...extras], rng) : [...guaranteed, ...extras];
  return { hand, deck };
}
