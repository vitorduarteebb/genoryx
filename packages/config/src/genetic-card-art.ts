import type { GeneticCardLocusKey } from "@nexora/types";

export type GeneticCardArtPolicyMode = "SHARED" | "SIGNATURE_ONLY" | "FULL_CREATURE";
export type CardArtScope = "SHARED" | "CREATURE";

export function geneticCardArtPolicy(): GeneticCardArtPolicyMode {
  return (process.env.GENETIC_CARD_ART_POLICY ?? "FULL_CREATURE") as GeneticCardArtPolicyMode;
}

export function geneticCardArtAllowlist(): string[] {
  return (process.env.GENETIC_CARD_ART_CREATURE_IDS ?? "")
    .split(",")
    .map((row) => row.trim())
    .filter(Boolean);
}

export const geneticCardArtConfig = {
  promptVersion: 1,
  cardArtVersion: 1,
  /** Vazio: toda criatura com retrato READY enfileira G1–G10. */
  blockedProofSpecies: [] as const,
  enqueueOnVisualReady: true,
  backfillBatch: 4,
} as const;

export function isCreatureCardArtAllowed(creatureId: string, locus?: GeneticCardLocusKey): boolean {
  const policy = geneticCardArtPolicy();
  if (policy === "SHARED") {
    return false;
  }
  const allow = geneticCardArtAllowlist();
  if (allow.length > 0 && !allow.includes(creatureId)) {
    return false;
  }
  if (policy === "SIGNATURE_ONLY") {
    return locus === "G9" || locus === "G10";
  }
  return policy === "FULL_CREATURE";
}

export const terranoxProofCardKeys = [
  "quake_stomp",
  "boulder_toss",
  "tremor_pulse",
  "stone_guard",
  "stone_brace",
  "dust_cloud",
  "rumble_guard",
  "bedrock_pact",
  "titan_growl",
  "mountain_crash",
] as const;

export function creatureLocusArtDirection(locus: GeneticCardLocusKey, element = "EARTH"): string {
  const language = element.toLowerCase();
  const byLocus: Record<GeneticCardLocusKey, string> = {
    G1: `The exact reference creature performs its basic attack with ${language} force. Dynamic, readable impact. The creature stays fully recognizable.`,
    G2: `The exact reference creature delivers a secondary strike using ${language} energy. The individual remains the focus.`,
    G3: `The exact reference creature at the center of an elemental pulse. Concentric ${language} energy, pressure, territorial control.`,
    G4: `The exact reference creature in a defensive stance. A ${language} barrier rises around it without hiding the body.`,
    G5: `The exact reference creature reinforcing itself. Protective ${language} structures lock onto the body. No playing-card symbols.`,
    G6: `The exact reference creature releases a control effect toward an unseen foe. The individual stays readable.`,
    G7: `Reaction. The exact reference creature answers instantly. A ${language} barrier or counter erupts. Immediate response.`,
    G8: `The exact reference creature linked to ${language} synergy. Energy lines connect creature and field. No diagrams.`,
    G9: `SIGNATURE. Strongest presence of this individual. The exact reference creature assumes lineage presence. ${language} energy radiates from the body.`,
    G10: `ULTIMATE. The exact reference creature is the focus. Greater ${language} manifestation. Epic but still readable as a card. Do not bury the creature in effects.`,
  };
  return byLocus[locus];
}

export const terranoxCreatureArtDirections: Record<GeneticCardLocusKey, string> = {
  G1: "The exact reference creature stomps the ground with force. Soil ruptures. Seismic waves radiate from the paws. Stones lift. Dynamic EARTH composition. Stone Core language — mineral plates and weight — even in this offensive beat.",
  G2: "The exact reference creature hurls a large rock fragment using terrestrial force or earth energy. The creature remains fully recognizable. Stone Core mineral identity.",
  G3: "The exact reference creature at the center. Concentric seismic waves cross the soil. Mineral energy, dust, small fragments. Pressure and territorial control. Stone Core.",
  G4: "The exact reference creature in a defensive stance. Mineral plates rise around it as a barrier. Do not fully hide the creature. Tank identity of Stone Core is obvious.",
  G5: "The exact reference creature reinforcing its own body. Mineral structures lock onto it as genetic protection. Shield and readiness. Do not draw a playing card or a draw symbol.",
  G6: "The exact reference creature produces a controlled dust burst spreading toward an unseen foe. Eyes or opponent partly obscured. Blind as visual dust, never the word Blind.",
  G7: "Reaction. The exact reference creature anticipates an impact. The soil answers instantly. A mineral barrier erupts. Immediate response. Strong Tank / Stone Core.",
  G8: "The exact reference creature connected to deep bedrock. Energy lines travel through stones, soil, and the creature's core. Synergy, momentum, earth resonance. No diagrams.",
  G9: "SIGNATURE. Strongest Stone Core presence. The exact Baby Terranox assumes titanic presence. Terrestrial energy radiates from the body. A pressure roar, not literal sound waves. Lineage manifestation.",
  G10: "ULTIMATE. The exact reference creature is the focus. Greater terrestrial manifestation. Rocks and mineral mass collapse toward a target. Epic but still readable as a card. Do not bury the creature in effects.",
};
