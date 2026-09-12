import { resolveCardFrameSrc, resolveElementPresentation } from "@nexora/config";

export type GeneticCardState =
  | "NORMAL"
  | "HOVER"
  | "SELECTABLE"
  | "SELECTED"
  | "DISABLED"
  | "INSUFFICIENT_ENERGY"
  | "REACTION_AVAILABLE"
  | "PLAYING";

export type GeneticCardSize = "sheet" | "battle" | "proof" | "detail" | "hand";

export function cardTreatment(input: { type: string; locus?: string | null }): "ULTIMATE" | "SIGNATURE" | "REACTION" | "ATTACK" | "SKILL" {
  if (input.locus === "G10" || input.type === "ULTIMATE") {
    return "ULTIMATE";
  }
  if (input.locus === "G9") {
    return "SIGNATURE";
  }
  if (input.type === "REACTION") {
    return "REACTION";
  }
  if (input.type === "ATTACK") {
    return "ATTACK";
  }
  return "SKILL";
}

export function typeIconSrc(treatment: ReturnType<typeof cardTreatment>): string {
  if (treatment === "ULTIMATE" || treatment === "SIGNATURE") {
    return "/card-icons/ultimate.svg";
  }
  if (treatment === "REACTION") {
    return "/card-icons/reaction.svg";
  }
  if (treatment === "ATTACK") {
    return "/card-icons/attack.svg";
  }
  return "/card-icons/skill.svg";
}

export function elementIconSrc(element: string): string {
  return resolveElementPresentation(element).iconSrc;
}

export function frameSrc(element: string, treatment: ReturnType<typeof cardTreatment>): string {
  return resolveCardFrameSrc(element, treatment);
}
