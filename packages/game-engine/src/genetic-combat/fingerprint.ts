import { geneticHash } from "../genes/hash";
import type { CombatIdentity, GeneticCardManifest } from "./types";

export function mechanicalFingerprint(identity: CombatIdentity, cards: readonly GeneticCardManifest[]): string {
  const tokens = [
    identity.archetype,
    identity.resource.id,
    identity.resource.variant ?? "",
    ...(identity.resource.generationRules ?? []).map((row) => `${row.trigger}:${row.status ?? ""}`),
    ...identity.verbs,
    ...identity.quirks.map((row) => row.key),
    ...cards.flatMap((card) => [
      card.function,
      card.cost,
      ...card.ability.produces,
      ...card.ability.consumes,
      ...card.ability.reactsTo,
      ...card.ability.positions,
    ]),
  ];
  return geneticHash(tokens);
}

export function fingerprintTokens(identity: CombatIdentity, cards: readonly GeneticCardManifest[]): string[] {
  return [
    identity.archetype,
    identity.resource.id,
    identity.resource.variant ?? "",
    ...identity.verbs,
    ...cards.flatMap((card) => [card.function, ...card.ability.produces, ...card.ability.consumes]),
  ];
}

export function similarityScore(a: readonly string[], b: readonly string[]): number {
  const left = new Set(a);
  const right = new Set(b);
  let inter = 0;
  for (const token of left) {
    if (right.has(token)) inter += 1;
  }
  const union = new Set([...left, ...right]).size;
  return union === 0 ? 0 : inter / union;
}
