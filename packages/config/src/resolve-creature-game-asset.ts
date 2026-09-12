import {
  resolveBattleCreatureVisual,
  type BattleCreatureVisual,
  type BattleVisualHints,
} from "./resolve-battle-visual";

export type CreatureGameAsset = BattleCreatureVisual;

/**
 * Resolver único World + Battle.
 * 3D READY → retrato canônico → master da espécie → silhueta Genesis.
 * Nunca quadrado colorido.
 */
export function resolveCreatureGameAsset(input: BattleVisualHints): CreatureGameAsset {
  return resolveBattleCreatureVisual(input);
}
