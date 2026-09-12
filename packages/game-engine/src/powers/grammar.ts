import type { GeneticPowerGenome, PowerMechanic } from "@nexora/config";
import type { Element, Typology } from "@nexora/types";

export const mechanicPool: readonly PowerMechanic[] = [
  "APPLY_BURN",
  "AMPLIFY_BURN",
  "APPLY_SHIELD",
  "FORTIFY",
  "HEAL",
  "REGENERATE",
  "APPLY_SLOW",
  "LOCK_STATUS",
  "CRIT_WINDOW",
  "SPREAD_STATUS",
  "GAIN_ENERGY",
  "GAIN_MOMENTUM",
];

const typologyDefault: Record<string, PowerMechanic> = {
  BURN: "APPLY_BURN",
  TANK: "APPLY_SHIELD",
  HEAL: "HEAL",
  CONTROL: "APPLY_SLOW",
  CRITICAL: "CRIT_WINDOW",
};

const themeByTypology: Record<string, string> = {
  BURN: "furnace",
  TANK: "bedrock",
  HEAL: "grove",
  CONTROL: "tide",
  CRITICAL: "edge",
};

export function defaultMechanicFor(typology: Typology): PowerMechanic {
  return typologyDefault[typology] ?? "GAIN_MOMENTUM";
}

export function themeFor(typology: Typology, element: Element): string {
  return `${themeByTypology[typology] ?? "spark"}-${element.toLowerCase()}`;
}

export function composePowerKey(theme: string, primary: PowerMechanic, secondary: PowerMechanic): string {
  return `${theme}_${primary}_${secondary}`.replace(/[^A-Z0-9_]/gi, "_").toUpperCase();
}

export function namePower(genome: Pick<GeneticPowerGenome, "typology" | "element" | "primaryMechanic" | "signatureModifier">): { name: string; namePt: string } {
  const table: Record<string, { name: string; namePt: string }> = {
    BURN: { name: "Unstable Furnace", namePt: "Fornalha Instável" },
    TANK: { name: "Living Bastion", namePt: "Bastião Vivo" },
    HEAL: { name: "Eternal Garden", namePt: "Jardim Eterno" },
    CONTROL: { name: "Abyssal Mind", namePt: "Mente Abissal" },
    CRITICAL: { name: "Volcanic Core", namePt: "Núcleo Vulcânico" },
  };
  const row = table[genome.typology] ?? { name: `${genome.element} Legacy`, namePt: `Legado de ${genome.element}` };
  return {
    name: `${row.name}`,
    namePt: `${row.namePt}`,
  };
}
