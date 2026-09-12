import {
  cardLabel,
  describeCardEffects,
  describeEffects,
  effectBudgetByLocus,
  existingCardsForSpecies,
  getCardDefinition,
  type CardEffectDef,
  type GeneticPowerGenome,
} from "@nexora/config";
import { GENETIC_CARD_LOCI, POWER_LOCUS_ROLES, type CardEffectOp, type CardTargetType, type GeneticCardLocusKey } from "@nexora/types";
import { budgetUsed, clampEffectsToBudget } from "./budget";

export type GeneticCardManifestation = {
  locus: GeneticCardLocusKey;
  role: (typeof POWER_LOCUS_ROLES)[number]["role"];
  name: string;
  namePt: string;
  catalogKey: string | null;
  cost: number;
  targetType: CardTargetType;
  effects: CardEffectDef[];
  text: string;
  budgetUsed: number;
};

export function generatePowerCards(input: {
  power: GeneticPowerGenome;
  speciesKey?: string;
  mutation?: string | null;
  seed: number;
}): GeneticCardManifestation[] {
  return POWER_LOCUS_ROLES.map((locus, index) => {
    const catalog = existingCardsForSpecies(input.speciesKey ?? "").find(
      (card) => card.locusRole === GENETIC_CARD_LOCI[index]?.role,
    );
    const definition = catalog ? getCardDefinition(catalog.key) : undefined;
    const budget = effectBudgetByLocus[locus.key];
    const effects = (
      definition
        ? definition.effects.map((row) => ({ op: row.op, value: row.value, status: row.status, duration: row.duration }))
        : clampEffectsToBudget(effectsFor(input.power, locus.key), budget.budget)
    ) as CardEffectDef[];
    return {
      locus: locus.key,
      role: locus.role,
      name: definition?.name ?? nameFor(input.power, locus.key),
      namePt: definition ? cardLabel(definition.key) : namePtFor(input.power, locus.key),
      catalogKey: definition?.key ?? null,
      cost: definition?.cost ?? budget.cost,
      targetType: (definition?.targetType ?? targetFor(input.power, locus.key)) as CardTargetType,
      effects,
      text: definition ? describeCardEffects(definition) : describeEffects(effects),
      budgetUsed: budgetUsed(effects),
    };
  });
}

function effectsFor(
  power: GeneticPowerGenome,
  locus: GeneticCardLocusKey,
  catalog?: readonly { op: string; value?: number; status?: string; duration?: number }[],
): GeneticCardManifestation["effects"] {
  if (catalog && catalog.length > 0) {
    return catalog.map((row) => ({
      op: row.op as CardEffectOp,
      value: row.value,
      status: row.status,
      duration: row.duration,
    }));
  }
  const burn = power.typology === "BURN";
  const heal = power.typology === "HEAL";
  const tank = power.typology === "TANK";
  switch (locus) {
    case "G1":
      return burn
        ? [{ op: "DAMAGE", value: 10 }, { op: "APPLY_STATUS", status: "BURN", duration: 2 }]
        : [{ op: "DAMAGE", value: 12 }];
    case "G2":
      return burn ? [{ op: "APPLY_STATUS", status: "BURN", duration: 3 }] : [{ op: "DAMAGE", value: 14 }];
    case "G3":
      return [{ op: "DAMAGE", value: 16 }];
    case "G4":
      return tank || heal ? [{ op: "SHIELD", value: 14 }] : [{ op: "SHIELD", value: 10 }];
    case "G5":
      return heal ? [{ op: "GAIN_ENERGY", value: 1 }] : [{ op: "GAIN_MOMENTUM", value: 1 }];
    case "G6":
      return burn
        ? [{ op: "APPLY_STATUS", status: "BURN", duration: 2 }]
        : [{ op: "APPLY_STATUS", status: "SLOW", duration: 2 }];
    case "G7":
      return [{ op: "SHIELD", value: 8 }];
    case "G8":
      return [{ op: "GAIN_MOMENTUM", value: 2 }];
    case "G9":
      return burn
        ? [{ op: "DAMAGE", value: 18 }, { op: "APPLY_STATUS", status: "BURN", duration: 3 }]
        : heal
          ? [{ op: "HEAL", value: 16 }]
          : [{ op: "DAMAGE", value: 20 }];
    case "G10":
      return [
        { op: "DAMAGE", value: 22 },
        heal ? { op: "HEAL", value: 12 } : { op: "SHIELD", value: 10 },
      ];
    default:
      return [{ op: "DAMAGE", value: 8 }];
  }
}

function targetFor(power: GeneticPowerGenome, locus: GeneticCardLocusKey): CardTargetType {
  if (locus === "G4" || locus === "G5" || locus === "G7" || locus === "G8") {
    return "SELF";
  }
  if (locus === "G10" && power.typology === "HEAL") {
    return "ALL_ALLIES";
  }
  return "ENEMY";
}

function nameFor(power: GeneticPowerGenome, locus: GeneticCardLocusKey): string {
  return `${power.name} ${locus}`;
}

function namePtFor(power: GeneticPowerGenome, locus: GeneticCardLocusKey): string {
  const labels: Record<GeneticCardLocusKey, string> = {
    G1: "Núcleo",
    G2: "Eco",
    G3: "Elemento",
    G4: "Casca",
    G5: "Pulso",
    G6: "Pressão",
    G7: "Reflexo",
    G8: "Sinergia",
    G9: "Assinatura",
    G10: "Suprema",
  };
  return `${power.namePt} · ${labels[locus]}`;
}
