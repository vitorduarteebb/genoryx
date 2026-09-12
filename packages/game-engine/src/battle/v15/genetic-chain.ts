import type { BattleSide, GeneticChainLink } from "../types";

function tokensOf(link: GeneticChainLink): string[] {
  return [...link.produces, ...link.transforms];
}

function consumesOf(link: GeneticChainLink): string[] {
  return [...link.consumes, ...link.reactsTo];
}

export function recordChainLink(side: BattleSide, link: GeneticChainLink): { chained: boolean; length: number; tokens: string[] } {
  const chain = side.geneticChain ?? { links: [], maxLength: 0, lastTokens: [] };
  const prior = chain.links[chain.links.length - 1];
  const needed = consumesOf(link);
  const offered = prior ? tokensOf(prior) : chain.lastTokens;
  const connects = needed.some((token) => offered.includes(token));
  const different = Boolean(prior && prior.creatureId && link.creatureId && prior.creatureId !== link.creatureId);
  const chained = connects && different;
  if (chained) {
    chain.links.push(link);
  } else if (link.produces.length > 0 || link.transforms.length > 0) {
    chain.links = [link];
  } else {
    chain.links = [];
  }
  chain.lastTokens = tokensOf(link);
  chain.maxLength = Math.max(chain.maxLength, chain.links.length);
  side.geneticChain = chain;
  return { chained, length: chain.links.length, tokens: needed.filter((token) => offered.includes(token)) };
}

export function resetTurnChain(side: BattleSide) {
  if (!side.geneticChain) {
    side.geneticChain = { links: [], maxLength: 0, lastTokens: [] };
    return;
  }
  side.geneticChain.links = [];
  side.geneticChain.lastTokens = [];
}

export function chainNames(side: BattleSide): string[] {
  return (side.geneticChain?.links ?? []).map((row) => row.creatureName);
}
