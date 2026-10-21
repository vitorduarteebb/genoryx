import { GENETIC_ENGINE_VERSION, geneticCombatConfig } from "@nexora/config";
import type { CreatureBlueprint } from "../genes/generate";
import { generateIdentityCards } from "./cards";
import { expressGenome } from "./expression";
import { fingerprintTokens, mechanicalFingerprint, similarityScore } from "./fingerprint";
import { rollTimingStyle } from "../battle/v23/identity";
import { buildCombatIdentity } from "./identity";
import { birthSeedOf, rollBirth } from "./seeds";
import type { GeneticCombatManifest } from "./types";
import { validateCard, validateKit } from "./validate";

export type AssembleCombatInput = {
  creatureId: string;
  blueprint: CreatureBlueprint;
  parents?: ParentHint[];
  knownFingerprints?: readonly string[][];
};

export type ParentHint = { element: string; families: string[] };

export function assembleGeneticCombat(input: AssembleCombatInput): GeneticCombatManifest {
  const birthSeed = birthSeedOf({
    creatureId: input.creatureId,
    geneticHash: input.blueprint.geneticHash,
    genesisSeed: input.blueprint.genesisSeed,
  });
  const starter = input.blueprint.origin === "STARTER";
  const rolls = rollBirth(birthSeed, starter);
  const expression = expressGenome(input.blueprint, birthSeed);
  let identity = buildCombatIdentity({ blueprint: input.blueprint, expression, rolls, birthSeed });
  const timingStyle = rollTimingStyle(birthSeed, identity.archetype);
  if (!identity.synergyTags.includes(timingStyle)) {
    identity = { ...identity, synergyTags: [...identity.synergyTags, timingStyle] };
  }
  let cards = generateIdentityCards({ blueprint: input.blueprint, identity, expression, rolls, birthSeed, retryIndex: 0 });
  for (let retry = 0; retry < 6; retry += 1) {
    const badCard = cards.map(validateCard).find((row) => row);
    const badKit = validateKit(cards);
    if (!badCard && !badKit) break;
    cards = generateIdentityCards({ blueprint: input.blueprint, identity, expression, rolls, birthSeed, retryIndex: retry + 1 });
  }
  let similarityHint = 0;
  const tokens = fingerprintTokens(identity, cards);
  for (const known of input.knownFingerprints ?? []) {
    similarityHint = Math.max(similarityHint, similarityScore(tokens, known));
  }
  if (similarityHint > geneticCombatConfig.similarityReroll) {
    for (let retry = 1; retry <= geneticCombatConfig.maxNoveltyRetries; retry += 1) {
      identity = buildCombatIdentity({ blueprint: input.blueprint, expression, rolls, birthSeed, retryIndex: retry });
      cards = generateIdentityCards({ blueprint: input.blueprint, identity, expression, rolls, birthSeed, retryIndex: 10 + retry });
      const next = fingerprintTokens(identity, cards);
      const score = Math.max(0, ...((input.knownFingerprints ?? []).map((row) => similarityScore(next, row))));
      if (score < similarityHint) {
        similarityHint = score;
        break;
      }
    }
  }
  void input.parents;
  identity.resource.relatedCardIds = cards
    .filter((card) =>
      card.effects.some((effect) => effect.op === "CONSUME_RESOURCE" || effect.op === "GAIN_RESOURCE" || Boolean(effect.condition?.resourceAtLeast)),
    )
    .map((card) => `${card.locus} — ${card.namePt}`);
  return {
    engineVersion: GENETIC_ENGINE_VERSION,
    birthSeed,
    rolls,
    expression,
    identity,
    cards,
    fingerprint: mechanicalFingerprint(identity, cards),
    similarityHint,
  };
}
