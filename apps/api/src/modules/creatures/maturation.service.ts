import { Injectable } from "@nestjs/common";
import { maturationProgress } from "@nexora/config";
import type { BattleState } from "@nexora/game-engine";
import {
  applyCreatureXp,
  applyMaturationXp,
  computeMaturationGrant,
  familyFromKey,
  participationScore,
} from "@nexora/game-engine";
import type { Prisma } from "@nexora/database";

type Tx = Prisma.TransactionClient;

export type MaturationReward = {
  creatureId: string;
  name: string;
  amount: number;
  participation: number;
  discovery: boolean;
  becameReady: boolean;
  maturationXp: number;
  target: number;
  lifeStage: string;
};

@Injectable()
export class MaturationService {
  async grantForPveBattle(
    tx: Tx,
    input: {
      battleId: string;
      characterId: string;
      state: BattleState;
      family?: string | null;
      mobSpecies?: string | null;
      mapKey?: string | null;
    },
  ): Promise<MaturationReward[]> {
    if (input.state.type !== "PVE" || input.state.status !== "FINISHED") {
      return [];
    }

    const won = input.state.winnerSide === 0;
    const family = familyFromKey(input.family);
    const mobSpecies = input.mobSpecies ?? input.state.wildSpeciesKey ?? input.state.sides[1]?.creatures[0]?.speciesKey ?? "unknown";
    const mapKey = input.mapKey ?? "verdantis";
    const party = await tx.partySlot.findMany({
      where: { characterId: input.characterId },
      include: { creature: true },
      orderBy: { slot: "asc" },
    });
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    const rewards: MaturationReward[] = [];

    for (const slot of party) {
      const existing = await tx.maturationEvent.findUnique({
        where: { battleId_creatureId: { battleId: input.battleId, creatureId: slot.creatureId } },
      });
      if (existing) {
        continue;
      }

      const [killsToday, discovered] = await Promise.all([
        tx.maturationEvent.count({
          where: {
            creatureId: slot.creatureId,
            mobSpecies,
            outcome: "WIN",
            createdAt: { gte: dayStart },
          },
        }),
        tx.maturationEvent.findFirst({
          where: {
            creatureId: slot.creatureId,
            mobSpecies,
            mapKey,
            outcome: "WIN",
            discovery: true,
          },
          select: { id: true },
        }),
      ]);

      const participation = scoreFromState(input.state, slot.creatureId);
      const grant = computeMaturationGrant({
        family,
        won,
        participation,
        killsTodayOfSpecies: killsToday,
        firstVictoryInBiome: won && !discovered,
      });

      await tx.maturationEvent.create({
        data: {
          creatureId: slot.creatureId,
          battleId: input.battleId,
          source: "MATURATION_XP_GRANTED",
          mobSpecies,
          mapKey,
          family,
          amount: grant.amount,
          participation,
          diversityShare: grant.diversityShare,
          discovery: grant.discovery,
          outcome: won ? "WIN" : "LOSS",
        },
      });

      const matured = applyMaturationXp(
        {
          level: slot.creature.level,
          xp: slot.creature.xp,
          lifeStage: slot.creature.lifeStage,
          evolutionStatus: slot.creature.evolutionStatus,
          maturationXp: slot.creature.maturationXp,
        },
        grant.amount,
      );
      const progress = maturationProgress(matured.lifeStage, matured.maturationXp ?? 0);
      const state =
        matured.lifeStage === "ADULT" ? "MATURE" : matured.evolutionStatus === "READY_TO_EVOLVE" ? "READY" : progress.state;

      await tx.creature.update({
        where: { id: slot.creatureId },
        data: {
          maturationXp: matured.maturationXp ?? 0,
          maturationState: state,
          evolutionStatus: matured.evolutionStatus as "NONE" | "READY_TO_EVOLVE" | "EVOLVING",
          readyToEvolveAt: matured.becameReady ? new Date() : slot.creature.readyToEvolveAt,
        },
      });

      rewards.push({
        creatureId: slot.creatureId,
        name: slot.creature.name ?? slot.creatureId,
        amount: grant.amount,
        participation,
        discovery: grant.discovery,
        becameReady: matured.becameReady,
        maturationXp: matured.maturationXp ?? 0,
        target: progress.target,
        lifeStage: matured.lifeStage,
      });
    }

    return rewards;
  }

  applyCombatXp(
    current: {
      level: number;
      xp: number;
      lifeStage: string;
      evolutionStatus: string;
      maturationXp: number;
    },
    gained: number,
  ) {
    return applyCreatureXp(current, gained);
  }
}

export function scoreFromState(state: BattleState, creatureId: string): number {
  const unit = state.sides[0]?.creatures.find((row) => row.creatureId === creatureId);
  const logs = state.log ?? [];
  const cardsPlayed = logs.filter((row) => row.actorSide === 0 && (row.type === "CARD_PLAYED" || row.cardKey)).length;
  const damage = logs
    .filter((row) => row.actorSide === 0 && (row.type === "DAMAGE" || row.type === "HIT"))
    .reduce((sum, row) => sum + Math.max(0, row.value ?? 0), 0);
  const healing = logs
    .filter((row) => row.actorSide === 0 && row.type === "HEAL")
    .reduce((sum, row) => sum + Math.max(0, row.value ?? 0), 0);
  const shield = logs
    .filter((row) => row.actorSide === 0 && row.type === "SHIELD")
    .reduce((sum, row) => sum + Math.max(0, row.value ?? 0), 0);
  const control = logs.filter((row) => row.actorSide === 0 && (row.type === "STATUS_APPLIED" || row.type === "CONTROL")).length;
  const battleRounds = Math.max(1, state.round ?? 1);
  return participationScore({
    cardsPlayed,
    damage,
    healing,
    shield,
    control,
    roundsAlive: unit && unit.hp > 0 ? battleRounds : Math.max(1, Math.floor(battleRounds * 0.5)),
    battleRounds,
    present: Boolean(unit),
  });
}
