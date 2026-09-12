import type { Element } from "@nexora/types";
import type { CardKitFunction } from "@nexora/config";

const ELEMENT_NOUN: Record<Element, readonly string[]> = {
  FIRE: ["Brasa", "Labareda", "Cinza", "Magma", "Fornalha"],
  WATER: ["Maré", "Corrente", "Espuma", "Abismo", "Orvalho"],
  NATURE: ["Vinhas", "Seiva", "Pólen", "Raiz", "Broto"],
  EARTH: ["Granito", "Pó", "Rocha", "Placa", "Sismo"],
  ELECTRIC: ["Voltagem", "Corrente", "Tempestade", "Arco", "Descarga"],
  ICE: ["Geada", "Gelo", "Nevasca", "Cristal", "Vento frio"],
  LIGHT: ["Halo", "Clarão", "Aurora", "Prisma", "Alvorada"],
  DARK: ["Sombra", "Véu", "Abismo", "Eclipse", "Umbral"],
  ARCANE: ["Runa", "Éter", "Nexus", "Sigilo", "Fluxo"],
};

const ELEMENT_ADJ: Record<Element, readonly string[]> = {
  FIRE: ["Ígnea", "Incandescente", "Ardente"],
  WATER: ["Líquida", "Marinha", "Fluida"],
  NATURE: ["Verde", "Viva", "Silvestre"],
  EARTH: ["Pétrea", "Telúrica", "Pesada"],
  ELECTRIC: ["Voltaica", "Elétrica", "Estática"],
  ICE: ["Gélida", "Ártica", "Cristalina"],
  LIGHT: ["Radiante", "Sagrada", "Clara"],
  DARK: ["Sombria", "Oculta", "Vazia"],
  ARCANE: ["Arcana", "Éterea", "Rúnica"],
};

const FUNCTION_NOUN: Record<CardKitFunction, readonly string[]> = {
  ATTACK: ["Golpe", "Descarga", "Investida", "Mordida"],
  DEFENSE: ["Guarda", "Muralha", "Casca"],
  BUFF: ["Pulso", "Ímpeto", "Foco"],
  DEBUFF: ["Laço", "Pressão", "Marca"],
  CONTROL: ["Campo", "Prisão", "Trava"],
  HEAL: ["Seiva", "Mend", "Restauração"],
  SHIELD: ["Égide", "Placa", "Véu"],
  UTILITY: ["Passo", "Troca", "Abertura"],
  COUNTER: ["Réplica", "Espinho", "Retorno"],
  MOBILITY: ["Passo", "Salto", "Rajada"],
  DOT: ["Queima", "Corrente", "Veneno"],
  AOE: ["Onda", "Colapso", "Tempestade"],
  EXECUTE: ["Sentença", "Caçada", "Ruptura"],
  SUSTAIN: ["Núcleo", "Reserva", "Fôlego"],
  SUPPORT: ["Pacto", "Elo", "Amparo"],
};

const ANATOMY_NOUN: Record<string, readonly string[]> = {
  predator: ["Predador", "Presa", "Caçada"],
  draconic: ["Dracônica", "Garras"],
  arcane: ["Orbe", "Olhar"],
  wings: ["Asa", "Voo"],
  tank: ["Couraça", "Baluarte"],
  agile: ["Relâmpago", "Ímpeto"],
  horns: ["Chifre", "Cornada"],
  tail: ["Cauda", "Flagelo"],
};

export function kitNameParts(element: Element, fn: CardKitFunction, tags: readonly string[]): {
  nouns: string[];
  adjs: string[];
} {
  const extra = tags.flatMap((tag) => ANATOMY_NOUN[tag] ?? []);
  return {
    nouns: [...FUNCTION_NOUN[fn], ...ELEMENT_NOUN[element], ...extra],
    adjs: [...ELEMENT_ADJ[element]],
  };
}

export const ELEMENT_STATUS: Record<Element, string> = {
  FIRE: "BURN",
  WATER: "SLOW",
  NATURE: "POISON",
  EARTH: "STUN",
  ELECTRIC: "SHOCK",
  ICE: "SLOW",
  LIGHT: "BLIND",
  DARK: "SLEEP",
  ARCANE: "SLOW",
};

export const MUTATION_STATUS: Record<string, { element: Element; status: string; label: string }> = {
  PLASMA: { element: "ELECTRIC", status: "SHOCK", label: "Plasma" },
  MAGMA: { element: "FIRE", status: "BURN", label: "Magma" },
  ANCIENT: { element: "ARCANE", status: "SLOW", label: "Ancestral" },
  VOID: { element: "DARK", status: "SLEEP", label: "Vazio" },
};
