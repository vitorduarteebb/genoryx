export type WorldRenderer = "web" | "unity";
export type BattleRenderer = "web" | "unity";

function envFlag(name: string, fallback: string): string {
  const raw = process.env[name]?.trim().toLowerCase();
  return raw && raw.length > 0 ? raw : fallback;
}

export const presentationConfig = {
  worldRenderer: (envFlag("NEXT_PUBLIC_WORLD_RENDERER", envFlag("WORLD_RENDERER", "web")) === "unity"
    ? "unity"
    : "web") as WorldRenderer,
  battleRenderer: (envFlag("NEXT_PUBLIC_BATTLE_RENDERER", envFlag("BATTLE_RENDERER", "web")) === "unity"
    ? "unity"
    : "web") as BattleRenderer,
} as const;

export function isUnityWorld(): boolean {
  return presentationConfig.worldRenderer === "unity";
}

export function isUnityBattle(): boolean {
  return presentationConfig.battleRenderer === "unity";
}
