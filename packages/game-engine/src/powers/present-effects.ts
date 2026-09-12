import type { CardEffectOp } from "@nexora/types";

const verbs: Record<CardEffectOp, string> = {
  DAMAGE: "Causa {n} de dano",
  HEAL: "Cura {n}",
  SHIELD: "Ganha {n} de escudo",
  APPLY_STATUS: "Aplica {status} por {d} rounds",
  REMOVE_STATUS: "Remove status",
  DRAW: "Compra {n} carta(s)",
  GAIN_ENERGY: "Ganha {n} energia",
  GAIN_MOMENTUM: "Ganha {n} ímpeto",
};

export function presentEffects(effects: readonly { op: string; value?: number; status?: string; duration?: number; condition?: { selfPosition?: string; targetHas?: string; resourceAtLeast?: number }; resource?: string }[]): string {
  return effects
    .map((effect) => {
      if (effect.op === "GAIN_RESOURCE") {
        return `Ganha ${effect.value ?? 1} ${effect.resource ?? "recurso"}`;
      }
      if (effect.op === "CONSUME_RESOURCE") {
        return `Consome ${effect.value ?? 1} ${effect.resource ?? "recurso"}`;
      }
      const base = (verbs[effect.op as CardEffectOp] ?? effect.op)
        .replace("{n}", String(effect.value ?? 1))
        .replace("{status}", effect.status ?? "status")
        .replace("{d}", String(effect.duration ?? 1));
      if (effect.condition?.selfPosition) {
        return `${base} se estiver em ${effect.condition.selfPosition}`;
      }
      if (effect.condition?.targetHas) {
        return `${base} se o alvo tiver ${effect.condition.targetHas}`;
      }
      if (effect.condition?.resourceAtLeast) {
        return `${base} se tiver ${effect.condition.resourceAtLeast} de recurso`;
      }
      return base;
    })
    .join(". ");
}
