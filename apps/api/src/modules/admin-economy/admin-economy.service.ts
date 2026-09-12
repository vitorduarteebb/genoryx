import { Injectable } from "@nestjs/common";
import { activeEconomy, economyConfig, economySystemEmail, genomeCatalystKey } from "@nexora/config";
import { Errors } from "../../common/errors/app-error";
import { creditWallet, debitWallet } from "../../common/ledger";
import { PrismaService } from "../../prisma/prisma.service";

type WindowKey = "24h" | "7d" | "30d";

const windowMs: Record<WindowKey, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

const mintSources = [
  economyConfig.ledgerSources.QUEST_REWARD,
  economyConfig.ledgerSources.PVE_REWARD,
  economyConfig.ledgerSources.PVP_REWARD,
  economyConfig.ledgerSources.SYSTEM_GRANT,
  economyConfig.ledgerSources.ADMIN_ADJUSTMENT,
] as const;

const playerSinkSources = [
  economyConfig.ledgerSources.BREEDING_COST,
  economyConfig.ledgerSources.SHOP_PURCHASE,
  economyConfig.ledgerSources.CRAFT_COST,
] as const;

@Injectable()
export class AdminEconomyService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(window: WindowKey = "24h") {
    const to = new Date();
    const from = new Date(to.getTime() - windowMs[window]);
    const metrics = await this.computeWindow(from, to);
    const snapshot = await this.persistUtcDay();
    return {
      window,
      from,
      to,
      nex: { enabled: activeEconomy().nex.enabled, emission: 0, balanceAlwaysZeroInAlpha: true },
      dailyGoldRewardBudget: activeEconomy().dailyGoldRewardBudget,
      ...metrics,
      snapshot,
    };
  }

  async adjust(adminUserId: string, input: { userId: string; amount: number; currency: "GOLD" | "NEX"; reason: string }) {
    if (!input.reason.trim()) {
      throw Errors.validation("Motivo obrigatório.");
    }
    if (input.currency === "NEX") {
      throw Errors.validation("NEX está inativo no Alpha. Sem emissão.");
    }
    if (!Number.isInteger(input.amount) || input.amount === 0) {
      throw Errors.validation("Amount inválido.");
    }
    const target = await this.prisma.client.user.findUnique({ where: { id: input.userId } });
    if (!target) {
      throw Errors.validation("Usuário alvo não encontrado.");
    }

    return this.prisma.client.$transaction(async (tx) => {
      const log = await tx.adminActionLog.create({
        data: {
          adminUserId,
          action: "GOLD_ADJUSTMENT",
          targetType: "USER",
          targetId: input.userId,
          payload: { amount: input.amount, currency: input.currency },
          reason: input.reason.trim(),
        },
      });
      const amount = BigInt(Math.abs(input.amount));
      if (input.amount > 0) {
        await creditWallet(tx, {
          userId: input.userId,
          currency: "GOLD",
          amount,
          source: economyConfig.ledgerSources.ADMIN_ADJUSTMENT,
          referenceId: log.id,
        });
      } else {
        await debitWallet(tx, {
          userId: input.userId,
          currency: "GOLD",
          amount,
          source: economyConfig.ledgerSources.ADMIN_ADJUSTMENT,
          referenceId: log.id,
        });
      }
      return { ok: true, adminLogId: log.id, amount: input.amount };
    });
  }

  private async computeWindow(from: Date, to: Date) {
    const txWhere = { currency: "GOLD" as const, createdAt: { gte: from, lte: to } };
    const [credits, playerSinks, systemSinks, active, market, breeds, eggs, captures, creatures, catalystIn, catalystOut, orbs, fertility] =
      await Promise.all([
        this.prisma.client.currencyTransaction.aggregate({
          where: { ...txWhere, type: "CREDIT", source: { in: [...mintSources] } },
          _sum: { amount: true },
        }),
        this.prisma.client.currencyTransaction.aggregate({
          where: { ...txWhere, type: "DEBIT", source: { in: [...playerSinkSources] } },
          _sum: { amount: true },
        }),
        this.prisma.client.currencyTransaction.aggregate({
          where: { ...txWhere, type: "CREDIT", source: economyConfig.ledgerSources.SYSTEM_SINK },
          _sum: { amount: true },
        }),
        this.prisma.client.currencyTransaction.findMany({
          where: { createdAt: { gte: from, lte: to }, user: { email: { not: economySystemEmail } } },
          distinct: ["userId"],
          select: { userId: true },
        }),
        this.prisma.client.marketTransaction.aggregate({
          where: { createdAt: { gte: from, lte: to } },
          _sum: { grossGold: true, feeGold: true },
        }),
        this.prisma.client.breedingSession.count({ where: { createdAt: { gte: from, lte: to }, status: "COMPLETED" } }),
        this.prisma.client.egg.count({ where: { createdAt: { gte: from, lte: to } } }),
        this.prisma.client.creature.count({ where: { birthDate: { gte: from, lte: to }, origin: "WILD" } }),
        this.prisma.client.creature.count({ where: { birthDate: { gte: from, lte: to } } }),
        this.prisma.client.itemFlow.aggregate({
          where: { templateKey: genomeCatalystKey, quantity: { gt: 0 }, createdAt: { gte: from, lte: to } },
          _sum: { quantity: true },
        }),
        this.prisma.client.itemFlow.aggregate({
          where: { templateKey: genomeCatalystKey, quantity: { lt: 0 }, createdAt: { gte: from, lte: to } },
          _sum: { quantity: true },
        }),
        this.prisma.client.itemFlow.aggregate({
          where: {
            templateKey: { startsWith: "nexorb" },
            source: economyConfig.ledgerSources.SHOP_PURCHASE,
            createdAt: { gte: from, lte: to },
          },
          _sum: { quantity: true },
        }),
        this.prisma.client.creature.groupBy({
          by: ["fertility"],
          _count: { fertility: true },
        }),
      ]);

    const listingFees = await this.prisma.client.currencyTransaction.aggregate({
      where: {
        ...txWhere,
        type: "DEBIT",
        source: economyConfig.ledgerSources.MARKET_LISTING_FEE,
      },
      _sum: { amount: true },
    });

    const goldMinted = credits._sum.amount ?? 0n;
    const playerSinkAbs = playerSinks._sum.amount ? -playerSinks._sum.amount : 0n;
    const goldSunk = playerSinkAbs + (systemSinks._sum.amount ?? 0n);
    const netGold = goldMinted - goldSunk;
    const activeUsers = active.length;
    const marketGmv = market._sum.grossGold ?? 0n;
    const saleFees = market._sum.feeGold ?? 0n;
    const listFees = listingFees._sum.amount ? -listingFees._sum.amount : 0n;
    const marketFees = saleFees + listFees;
    const fertilityDistribution = Object.fromEntries(
      fertility.map((row) => [String(row.fertility), row._count.fertility]),
    );

    return {
      activeUsers,
      goldMinted: goldMinted.toString(),
      goldSunk: goldSunk.toString(),
      netGold: netGold.toString(),
      goldPerActiveUser: activeUsers > 0 ? Number(goldMinted) / activeUsers : 0,
      marketGmv: marketGmv.toString(),
      marketFees: marketFees.toString(),
      listingFees: listFees.toString(),
      saleFees: saleFees.toString(),
      breedCount: breeds,
      eggCount: eggs,
      captureCount: captures,
      creaturesCreated: creatures,
      creaturesTotal: await this.prisma.client.creature.count(),
      catalystsGenerated: catalystIn._sum.quantity ?? 0,
      catalystsConsumed: Math.abs(catalystOut._sum.quantity ?? 0),
      nexOrbsPurchased: catalystSafe(orbs._sum.quantity),
      fertilityRemaining: fertilityDistribution,
    };
  }

  private async persistUtcDay() {
    const today = new Date();
    const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const metrics = await this.computeWindow(date, today);
    const data = {
      activeUsers: metrics.activeUsers,
      goldMinted: BigInt(metrics.goldMinted),
      goldSunk: BigInt(metrics.goldSunk),
      netGold: BigInt(metrics.netGold),
      goldPerActiveUser: metrics.goldPerActiveUser,
      marketGmv: BigInt(metrics.marketGmv),
      marketFees: BigInt(metrics.marketFees),
      breedCount: metrics.breedCount,
      eggCount: metrics.eggCount,
      captureCount: metrics.captureCount,
      creaturesCreated: metrics.creaturesCreated,
      catalystsGenerated: metrics.catalystsGenerated,
      catalystsConsumed: metrics.catalystsConsumed,
      nexOrbsPurchased: metrics.nexOrbsPurchased,
    };
    const row = await this.prisma.client.economyDailySnapshot.upsert({
      where: { date },
      create: { date, ...data },
      update: data,
    });
    return {
      date: row.date,
      activeUsers: row.activeUsers,
      goldMinted: row.goldMinted.toString(),
      goldSunk: row.goldSunk.toString(),
      netGold: row.netGold.toString(),
      goldPerActiveUser: Number(row.goldPerActiveUser),
      marketGmv: row.marketGmv.toString(),
      marketFees: row.marketFees.toString(),
      breedCount: row.breedCount,
      eggCount: row.eggCount,
      captureCount: row.captureCount,
      creaturesCreated: row.creaturesCreated,
      catalystsGenerated: row.catalystsGenerated,
      catalystsConsumed: row.catalystsConsumed,
      nexOrbsPurchased: row.nexOrbsPurchased,
    };
  }
}

function catalystSafe(value: number | null | undefined) {
  return value ?? 0;
}
