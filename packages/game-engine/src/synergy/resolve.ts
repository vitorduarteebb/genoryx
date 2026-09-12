import { synergyDefinitions } from "@nexora/config";

export function resolveSynergies(tags: readonly string[]): string[] {
  const tagSet = new Set(tags);
  return synergyDefinitions
    .filter((row) => row.requiredTags.every((tag) => tagSet.has(tag)))
    .map((row) => row.unlockCardKey);
}
