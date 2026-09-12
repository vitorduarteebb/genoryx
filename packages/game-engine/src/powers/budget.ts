import { effectBudgetWeights } from "@nexora/config";

export type BudgetEffect = { op: string; value?: number; status?: string; duration?: number };

export function budgetUsed(effects: readonly BudgetEffect[]): number {
  return effects.reduce((sum, effect) => {
    const weight = (effectBudgetWeights as Record<string, number>)[effect.op] ?? 1;
    const magnitude = effect.value ?? (effect.status ? 1 : 1);
    return sum + weight * magnitude;
  }, 0);
}

export function clampEffectsToBudget(effects: readonly BudgetEffect[], budget: number): BudgetEffect[] {
  const next = effects.map((row) => ({ ...row }));
  while (budgetUsed(next) > budget && next.length > 1) {
    next.pop();
  }
  if (budgetUsed(next) > budget && next[0]?.value) {
    next[0] = { ...next[0], value: Math.max(1, Math.floor((next[0].value ?? 1) * (budget / budgetUsed(next)))) };
  }
  return next;
}

export function withinBudget(effects: readonly BudgetEffect[], budget: number): boolean {
  return budgetUsed(effects) <= budget;
}
