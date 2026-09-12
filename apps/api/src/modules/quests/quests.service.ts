import { Injectable } from "@nestjs/common";
import { activeEconomy, breedingConfig, economyConfig, genomeCatalystKey } from "@nexora/config";
import { Errors } from "../../common/errors/app-error";
import { grantItem } from "../../common/inventory";
import { creditOnce } from "../../common/ledger";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class QuestsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const character = await this.prisma.client.character.findUnique({ where: { userId } });
    if (!character) {
      throw Errors.characterNotFound();
    }
    const rows = await this.prisma.client.questProgress.findMany({
      where: { characterId: character.id },
      include: { quest: true },
    });
    return rows.map((row) => ({
      key: row.quest.key,
      name: row.quest.name,
      status: row.status,
      completedAt: row.completedAt,
    }));
  }

  async acceptHunt(userId: string) {
    const character = await this.prisma.client.character.findUnique({ where: { userId } });
    if (!character) {
      throw Errors.characterNotFound();
    }
    const quest = await this.prisma.client.quest.findUnique({ where: { key: breedingConfig.captureQuestKey } });
    if (!quest) {
      throw Errors.questInvalid("Quest first-hunt ausente.");
    }
    const progress = await this.prisma.client.questProgress.upsert({
      where: { characterId_questId: { characterId: character.id, questId: quest.id } },
      update: {},
      create: { characterId: character.id, questId: quest.id, status: "ACTIVE" },
    });
    return { key: quest.key, status: progress.status };
  }

  async completeTutorial(userId: string) {
    const tutorial = activeEconomy().tutorial;
    const character = await this.prisma.client.character.findUnique({ where: { userId } });
    if (!character) {
      throw Errors.characterNotFound();
    }
    if (!character.starterChosen) {
      throw Errors.starterRequired();
    }
    const quest = await this.prisma.client.quest.findUnique({ where: { key: tutorial.questKey } });
    if (!quest) {
      throw Errors.questInvalid("Quest tutorial ausente.");
    }

    return this.prisma.client.$transaction(async (tx) => {
      const progress = await tx.questProgress.upsert({
        where: { characterId_questId: { characterId: character.id, questId: quest.id } },
        update: {},
        create: { characterId: character.id, questId: quest.id, status: "ACTIVE" },
      });
      if (progress.status === "COMPLETED") {
        return { key: quest.key, status: "COMPLETED" as const, alreadyClaimed: true };
      }
      const gold = await creditOnce(tx, {
        userId,
        currency: "GOLD",
        amount: BigInt(tutorial.gold),
        source: economyConfig.ledgerSources.QUEST_REWARD,
        referenceId: quest.id,
      });
      if (gold.credited) {
        await grantItem(tx, character.id, "nexorb", tutorial.nexOrbs, {
          source: economyConfig.ledgerSources.QUEST_REWARD,
          referenceId: quest.id,
        });
        await grantItem(tx, character.id, genomeCatalystKey, tutorial.catalysts, {
          source: economyConfig.ledgerSources.QUEST_REWARD,
          referenceId: quest.id,
        });
      }
      await tx.questProgress.update({
        where: { id: progress.id },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
      return {
        key: quest.key,
        status: "COMPLETED" as const,
        alreadyClaimed: !gold.credited,
        gold: tutorial.gold,
        nexOrbs: tutorial.nexOrbs,
        catalysts: tutorial.catalysts,
      };
    });
  }
}
