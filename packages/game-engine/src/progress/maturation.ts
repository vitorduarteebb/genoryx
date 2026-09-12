import { maturationConfig, type EncounterFamily } from "@nexora/config";

export type ParticipationBreakdown = {
  cardsPlayed: number;
  damage: number;
  healing: number;
  shield: number;
  control: number;
  roundsAlive: number;
  battleRounds: number;
  present: boolean;
};

export type MaturationGrantInput = {
  family: EncounterFamily;
  won: boolean;
  participation: number;
  killsTodayOfSpecies: number;
  firstVictoryInBiome: boolean;
};

export type MaturationGrantResult = {
  base: number;
  amount: number;
  diversityShare: number;
  discovery: boolean;
};

export function participationScore(input: ParticipationBreakdown): number {
  const weights = maturationConfig.participation;
  const rounds = Math.max(1, input.battleRounds);
  const aliveRatio = Math.min(1, Math.max(0, input.roundsAlive / rounds));
  const cards = input.cardsPlayed > 0 ? Math.min(1, input.cardsPlayed / 3) : 0;
  const damage = input.damage > 0 ? 1 : 0;
  const support = input.healing + input.shield + input.control > 0 ? 1 : 0;
  const raw =
    (input.present ? weights.present : 0) +
    weights.cards * cards +
    weights.damage * damage +
    weights.support * support +
    weights.alive * aliveRatio;
  return Math.min(weights.max, Math.max(weights.min, Number(raw.toFixed(4))));
}

export function diversityShare(killsToday: number): number {
  for (const band of maturationConfig.diversity) {
    if (killsToday < band.upTo) {
      return band.share;
    }
  }
  return maturationConfig.diversity[maturationConfig.diversity.length - 1]?.share ?? 0.4;
}

export function computeMaturationGrant(input: MaturationGrantInput): MaturationGrantResult {
  const base = maturationConfig.familyXp[input.family];
  const outcome = input.won ? 1 : maturationConfig.lossShare;
  const diversity = diversityShare(input.killsTodayOfSpecies);
  const discovery = input.won && input.firstVictoryInBiome;
  const raw = base * outcome * input.participation * diversity * (discovery ? maturationConfig.discoveryBonus : 1);
  return {
    base,
    amount: Math.max(0, Math.round(raw)),
    diversityShare: diversity,
    discovery,
  };
}

export function familyFromKey(raw: string | null | undefined): EncounterFamily {
  const key = (raw ?? "COMMON").toUpperCase();
  if (key === "UNCOMMON" || key === "ELITE" || key === "BOSS") {
    return key;
  }
  return "COMMON";
}
