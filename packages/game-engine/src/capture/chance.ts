import { captureConfig } from "@nexora/config";
import type { RandomService } from "../random/random-service";

export function calculateCaptureChance(input: {
  hp: number;
  maxHp: number;
  orbKey: string;
  difficultyMultiplier?: number;
}): number {
  const power = captureConfig.orbPower[input.orbKey as keyof typeof captureConfig.orbPower] ?? 1;
  const missing = 1 - Math.max(0, Math.min(1, input.hp / Math.max(1, input.maxHp)));
  const raw = captureConfig.baseRate * power * (0.35 + missing * 0.9) * Math.max(.1,Math.min(1,input.difficultyMultiplier??1));
  return Math.max(captureConfig.minChance, Math.min(captureConfig.maxChance, raw));
}

export function rollCapture(input: { hp: number; maxHp: number; orbKey: string; difficultyMultiplier?: number }, rng: RandomService): {
  chance: number;
  success: boolean;
} {
  const chance = calculateCaptureChance(input);
  return { chance, success: rng.chance(chance) };
}
