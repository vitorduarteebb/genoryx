import { economyConfig, economySystemEmail } from "@nexora/config";
import type { Currency, Prisma } from "@nexora/database";
import { Errors } from "./errors/app-error";

type Tx = Prisma.TransactionClient;

export async function creditWallet(
  tx: Tx,
  input: { userId: string; currency: Currency; amount: bigint; source: string; referenceId?: string },
) {
  if (input.amount <= 0n) {
    throw Errors.validation("Crédito inválido.");
  }
  const wallet = await tx.wallet.findUniqueOrThrow({
    where: { userId_currency: { userId: input.userId, currency: input.currency } },
  });
  const after = wallet.balance + input.amount;
  await tx.wallet.update({
    where: { id: wallet.id },
    data: { balance: after },
  });
  await tx.currencyTransaction.create({
    data: {
      userId: input.userId,
      currency: input.currency,
      amount: input.amount,
      type: "CREDIT",
      source: input.source,
      referenceId: input.referenceId,
      balanceBefore: wallet.balance,
      balanceAfter: after,
    },
  });
  return after;
}

export async function debitWallet(
  tx: Tx,
  input: { userId: string; currency: Currency; amount: bigint; source: string; referenceId?: string },
) {
  if (input.amount <= 0n) {
    throw Errors.validation("Débito inválido.");
  }
  const wallet = await tx.wallet.findUniqueOrThrow({
    where: { userId_currency: { userId: input.userId, currency: input.currency } },
  });
  if (wallet.balance < input.amount) {
    throw Errors.insufficientGold();
  }
  const after = wallet.balance - input.amount;
  await tx.wallet.update({
    where: { id: wallet.id },
    data: { balance: after },
  });
  await tx.currencyTransaction.create({
    data: {
      userId: input.userId,
      currency: input.currency,
      amount: -input.amount,
      type: "DEBIT",
      source: input.source,
      referenceId: input.referenceId,
      balanceBefore: wallet.balance,
      balanceAfter: after,
    },
  });
  return after;
}

export async function creditOnce(
  tx: Tx,
  input: { userId: string; currency: Currency; amount: bigint; source: string; referenceId: string },
): Promise<{ credited: boolean; balance: bigint }> {
  const existing = await tx.currencyTransaction.findFirst({
    where: {
      userId: input.userId,
      source: input.source,
      referenceId: input.referenceId,
      type: "CREDIT",
    },
  });
  if (existing) {
    const wallet = await tx.wallet.findUniqueOrThrow({
      where: { userId_currency: { userId: input.userId, currency: input.currency } },
    });
    return { credited: false, balance: wallet.balance };
  }
  try {
    const balance = await creditWallet(tx, input);
    return { credited: true, balance };
  } catch (error) {
    if (error instanceof Error && "code" in error && (error as { code: string }).code === "P2002") {
      const wallet = await tx.wallet.findUniqueOrThrow({
        where: { userId_currency: { userId: input.userId, currency: input.currency } },
      });
      return { credited: false, balance: wallet.balance };
    }
    throw error;
  }
}

export async function ensureSystemUserId(tx: Tx): Promise<string> {
  const email = economySystemEmail;
  const existing = await tx.user.findUnique({ where: { email } });
  if (existing) {
    await tx.wallet.upsert({
      where: { userId_currency: { userId: existing.id, currency: "GOLD" } },
      update: {},
      create: { userId: existing.id, currency: "GOLD", balance: 0n },
    });
    await tx.wallet.upsert({
      where: { userId_currency: { userId: existing.id, currency: "NEX" } },
      update: {},
      create: { userId: existing.id, currency: "NEX", balance: 0n },
    });
    return existing.id;
  }
  try {
    const created = await tx.user.create({
      data: {
        email,
        passwordHash: "SYSTEM_NO_LOGIN",
        role: "PLAYER",
        wallets: {
          create: [
            { currency: "GOLD", balance: 0n },
            { currency: "NEX", balance: 0n },
          ],
        },
      },
    });
    return created.id;
  } catch (error) {
    if (error instanceof Error && "code" in error && (error as { code: string }).code === "P2002") {
      const again = await tx.user.findUniqueOrThrow({ where: { email } });
      return again.id;
    }
    throw error;
  }
}

export async function creditSystemSink(
  tx: Tx,
  input: { amount: bigint; source: string; referenceId: string },
) {
  if (input.amount <= 0n) {
    return 0n;
  }
  const systemId = await ensureSystemUserId(tx);
  return creditWallet(tx, {
    userId: systemId,
    currency: "GOLD",
    amount: input.amount,
    source: input.source,
    referenceId: input.referenceId,
  });
}

export function ledgerSource(key: keyof typeof economyConfig.ledgerSources) {
  return economyConfig.ledgerSources[key];
}
