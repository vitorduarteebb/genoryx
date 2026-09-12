import { activeEconomy, economyFaucetSources } from "@nexora/config";
import type { Prisma } from "@nexora/database";

type Tx = Prisma.TransactionClient;

export function utcDayStart(at = new Date()) {
  return new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()));
}

export async function dailyGoldRewardMinted(tx: Tx, from: Date = utcDayStart()) {
  const rows = await tx.currencyTransaction.aggregate({
    where: {
      currency: "GOLD",
      type: "CREDIT",
      source: { in: [...economyFaucetSources] },
      createdAt: { gte: from },
    },
    _sum: { amount: true },
  });
  return rows._sum.amount ?? 0n;
}

export async function dailyGoldRewardRemaining(tx: Tx, from: Date = utcDayStart()) {
  const budget = BigInt(activeEconomy().dailyGoldRewardBudget);
  const minted = await dailyGoldRewardMinted(tx, from);
  const left = budget - minted;
  return left > 0n ? left : 0n;
}
