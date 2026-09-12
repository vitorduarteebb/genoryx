import {
  ELEMENT_ADVANTAGE,
  ELEMENT_MULTIPLIER_NEUTRAL,
  ELEMENT_MULTIPLIER_STRONG,
  ELEMENT_MULTIPLIER_WEAK,
} from "@nexora/config";
import type { Element } from "@nexora/types";

export function calculateElementMultiplier(
  attacker: Element,
  defender: Element,
): number {
  const attackerWins = ELEMENT_ADVANTAGE[attacker]?.includes(defender) ?? false;
  if (attackerWins) {
    return ELEMENT_MULTIPLIER_STRONG;
  }

  const defenderWins = ELEMENT_ADVANTAGE[defender]?.includes(attacker) ?? false;
  if (defenderWins) {
    return ELEMENT_MULTIPLIER_WEAK;
  }

  return ELEMENT_MULTIPLIER_NEUTRAL;
}
