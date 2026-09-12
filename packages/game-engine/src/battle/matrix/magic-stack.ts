import { combatEngineConfig } from "@nexora/config";
import type { CardRange } from "@nexora/types";

export type StackIntent = {
  id: string;
  side: 0 | 1;
  cardKey: string;
  cardName: string;
  typology?: string;
  manaCost: number;
  momentumAltCost?: number | null;
  range: CardRange;
  targetId?: string;
  targetName?: string;
  /** 1 = primeira intervenção (defensor), 2 = rebate do atacante, 3 = segundo rebate. */
  interventionIndex: number;
};

export type PaidStackEntry = StackIntent & {
  surcharge: number;
  paidMana: number;
  paidMomentum: number;
};

export type Wallet = {
  mana: number;
  momentum: number;
};

export function interventionSurcharge(interventionIndex: number): number {
  const table = combatEngineConfig.interventionSurcharge;
  if (interventionIndex <= 1) {
    return table[0];
  }
  if (interventionIndex === 2) {
    return table[1];
  }
  return table[2] + Math.max(0, interventionIndex - 3);
}

export function stackPayCost(cardCost: number, interventionIndex: number): number {
  return Math.max(0, Math.floor(cardCost)) + interventionSurcharge(interventionIndex);
}

/**
 * Mana primeiro. Momentum só cobre defesa emergencial (intervenção do defensor)
 * quando a mana do turno acabou — nunca paga o lance inicial do atacante.
 */
export function tryPayStack(input: {
  wallet: Wallet;
  cardCost: number;
  interventionIndex: number;
  momentumAltCost?: number | null;
  isOpeningPlay: boolean;
}): { ok: true; wallet: Wallet; paidMana: number; paidMomentum: number; surcharge: number } | { ok: false; reason: string } {
  const surcharge = interventionSurcharge(input.interventionIndex);
  const manaNeed = stackPayCost(input.cardCost, input.interventionIndex);
  if (input.wallet.mana >= manaNeed) {
    return {
      ok: true,
      wallet: { mana: input.wallet.mana - manaNeed, momentum: input.wallet.momentum },
      paidMana: manaNeed,
      paidMomentum: 0,
      surcharge,
    };
  }
  const alt = input.momentumAltCost;
  const emergency = !input.isOpeningPlay && alt != null && alt > 0 && input.wallet.mana < manaNeed;
  if (emergency && input.wallet.momentum >= alt) {
    return {
      ok: true,
      wallet: { mana: input.wallet.mana, momentum: input.wallet.momentum - alt },
      paidMana: 0,
      paidMomentum: alt,
      surcharge,
    };
  }
  return { ok: false, reason: "recursos insuficientes para a pilha" };
}

export function pushStack(
  stack: readonly PaidStackEntry[],
  entry: PaidStackEntry,
): PaidStackEntry[] | { ok: false; reason: string } {
  if (stack.length >= combatEngineConfig.maxStackDepth) {
    return { ok: false, reason: "pilha no teto" };
  }
  return [...stack, entry];
}

export type ResolvedStackEvent = {
  order: number;
  entry: PaidStackEntry;
  text: string;
};

/** LIFO: o último lance resolve primeiro. Não aplica dano — devolve a ordem canônica. */
export function resolveStackLifo(stack: readonly PaidStackEntry[]): ResolvedStackEvent[] {
  const events: ResolvedStackEvent[] = [];
  for (let i = stack.length - 1; i >= 0; i -= 1) {
    const entry = stack[i]!;
    events.push({
      order: stack.length - i,
      entry,
      text: `[${stack.length - i}] ${entry.cardName} resolve · alcance ${entry.range}${
        entry.targetName ? ` → ${entry.targetName}` : ""
      } · mana ${entry.paidMana}${entry.surcharge ? ` (fadiga +${entry.surcharge})` : ""}`,
    });
  }
  return events;
}
