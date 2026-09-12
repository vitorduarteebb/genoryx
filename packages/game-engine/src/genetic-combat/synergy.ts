import type { GeneticCombatManifest } from "./types";

export type SynergyLink = {
  key: string;
  namePt: string;
  connections: number;
  from: string;
  to: string;
};

export function partySynergyLinks(manifests: readonly { creatureId: string; name: string; manifest: GeneticCombatManifest }[]): SynergyLink[] {
  const links: SynergyLink[] = [];
  for (let i = 0; i < manifests.length; i += 1) {
    for (let j = 0; j < manifests.length; j += 1) {
      if (i === j) continue;
      const a = manifests[i]!;
      const b = manifests[j]!;
      const produced = new Set([
        ...a.manifest.cards.flatMap((card) => card.ability.produces),
        ...a.manifest.identity.synergyTags,
      ]);
      const consumed = new Set([
        ...b.manifest.cards.flatMap((card) => [...card.ability.consumes, ...card.ability.reactsTo]),
        ...b.manifest.identity.synergyTags,
      ]);
      let hits = 0;
      for (const token of produced) {
        if (consumed.has(token)) hits += 1;
      }
      if (hits > 0) {
        links.push({
          key: `${a.creatureId}:${b.creatureId}:${[...produced].join("+")}`,
          namePt: `${a.manifest.identity.namePt} → ${b.manifest.identity.namePt}`,
          connections: hits,
          from: a.creatureId,
          to: b.creatureId,
        });
      }
    }
  }
  return links;
}
