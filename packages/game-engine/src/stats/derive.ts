import { combatConfig, lifeStageStatMultiplier } from "@nexora/config";
import type { GeneRank } from "@nexora/types";
import type { CreatureBlueprint } from "../genes/generate";

export type SpeciesBases = {
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  baseMag: number;
  baseRes: number;
  baseSpd: number;
};

export function deriveCombatStats(blueprint: CreatureBlueprint, bases: SpeciesBases) {
  const level = Math.max(1, blueprint.level);
  const mul = (rank: GeneRank) => combatConfig.geneRankMultiplier[rank];
  const stage = lifeStageStatMultiplier(blueprint.lifeStage);
  return {
    maxHp: Math.round(bases.baseHp * mul(blueprint.genes.HP) * (1 + (level - 1) * 0.08) * stage),
    atk: Math.round(bases.baseAtk * mul(blueprint.genes.ATK) * (1 + (level - 1) * 0.05) * stage),
    def: Math.round(bases.baseDef * mul(blueprint.genes.DEF) * (1 + (level - 1) * 0.05) * stage),
    mag: Math.round(bases.baseMag * mul(blueprint.genes.MAG) * (1 + (level - 1) * 0.05) * stage),
    res: Math.round(bases.baseRes * mul(blueprint.genes.RES) * (1 + (level - 1) * 0.05) * stage),
    spd: Math.round(bases.baseSpd * mul(blueprint.genes.SPD)),
    crit: combatConfig.critChanceByRank[blueprint.genes.CRIT],
  };
}
