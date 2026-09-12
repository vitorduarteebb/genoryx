import { blueprintFromParents, generateCreatureBlueprint, type CreatureBlueprint } from "../genes/generate";
import { partySynergyLinks, type SynergyLink } from "./synergy";
import type { GeneticCombatManifest } from "./types";

const SPECIES = ["pyron", "terranox", "florune", "sparkyn", "nympha", "voltaris"] as const;

export type CombatSample = {
  label: string;
  species: string;
  origin: string;
  genome: CreatureBlueprint["genes"];
  element: string;
  secondary?: string | null;
  mutation?: string;
  expression: GeneticCombatManifest["expression"];
  rolls: GeneticCombatManifest["rolls"];
  quirks: GeneticCombatManifest["identity"]["quirks"];
  identity: GeneticCombatManifest["identity"];
  resource: GeneticCombatManifest["identity"]["resource"];
  cards: Array<{ locus: string; namePt: string; cost: number; text: string; function: string }>;
  signature: string;
  supreme: string;
  synergies: string[];
  weaknesses: string[];
  fingerprint: string;
};

export type CombatTeamSample = {
  label: string;
  members: string[];
  links: SynergyLink[];
};

function snapshot(label: string, blueprint: CreatureBlueprint): CombatSample {
  const manifest = blueprint.combatManifest!;
  const g9 = manifest.cards.find((row) => row.locus === "G9")!;
  const g10 = manifest.cards.find((row) => row.locus === "G10")!;
  return {
    label,
    species: blueprint.speciesKey,
    origin: blueprint.origin,
    genome: blueprint.genes,
    element: blueprint.elementPrimary,
    secondary: blueprint.elementSecondary,
    mutation: blueprint.mutationKey,
    expression: manifest.expression,
    rolls: manifest.rolls,
    quirks: manifest.identity.quirks,
    identity: manifest.identity,
    resource: manifest.identity.resource,
    cards: manifest.cards.map((row) => ({
      locus: row.locus,
      namePt: row.namePt,
      cost: row.cost,
      text: row.text,
      function: row.function,
    })),
    signature: `${g9.namePt} — ${g9.text}`,
    supreme: `${g10.namePt} — ${g10.text}`,
    synergies: manifest.identity.synergyTags,
    weaknesses: manifest.identity.weaknesses,
    fingerprint: manifest.fingerprint,
  };
}

export function collectCombatGallery(poolSize = 400): {
  samples: CombatSample[];
  teams: CombatTeamSample[];
} {
  const pool: CreatureBlueprint[] = [];
  for (let i = 0; i < poolSize; i += 1) {
    const species = SPECIES[i % SPECIES.length]!;
    const origin = i % 13 === 0 ? "STARTER" : "WILD";
    pool.push(generateCreatureBlueprint({ seed: 50_000 + i * 19, speciesKey: species, origin }));
  }
  const father = generateCreatureBlueprint({ seed: 77, speciesKey: "pyron", origin: "STARTER" });
  const mother = generateCreatureBlueprint({ seed: 88, speciesKey: "terranox", origin: "WILD" });
  const sibA = blueprintFromParents(901, father, mother, 0.35, 0.25, 0.15);
  const sibB = blueprintFromParents(902, father, mother, 0.35, 0.25, 0.15);

  const pick = (label: string, pred: (row: CreatureBlueprint) => boolean) => {
    const hit = pool.find(pred);
    return snapshot(label, hit ?? pool[0]!);
  };

  const samples = [
    pick("excelente", (row) => row.combatManifest!.rolls.coherence >= 80 && row.combatManifest!.rolls.efficiency >= 60 && row.combatManifest!.rolls.potency >= 70),
    pick("boa", (row) => row.combatManifest!.rolls.coherence >= 65 && row.combatManifest!.rolls.efficiency >= 55 && row.combatManifest!.rolls.coherence < 80),
    pick("mediana", (row) => row.combatManifest!.rolls.coherence >= 45 && row.combatManifest!.rolls.coherence < 65),
    pick("ruim", (row) => row.origin === "WILD" && (row.combatManifest!.rolls.coherence < 45 || row.combatManifest!.rolls.efficiency < 40)),
    pick("estranha", (row) => row.combatManifest!.identity.quirks.length > 0 && row.combatManifest!.rolls.coherence >= 40 && row.combatManifest!.rolls.coherence < 70),
    pick("rara-ruim", (row) => Boolean(row.combatManifest!.identity.anomaly || row.combatManifest!.identity.quirks.some((q) => q.key === "RARE_MUTATION")) && row.combatManifest!.rolls.coherence < 55),
    pick("comum-excelente", (row) => row.origin === "STARTER" && row.combatManifest!.rolls.coherence >= 70),
    pick("mutacao-positiva", (row) => row.combatManifest!.identity.quirks.some((q) => q.key === "RARE_MUTATION") && row.combatManifest!.rolls.coherence >= 50),
    pick("mutacao-negativa", (row) => row.combatManifest!.identity.quirks.some((q) => q.key === "NEGATIVE_MUTATION")),
    pick("anomaly", (row) => Boolean(row.combatManifest!.identity.anomaly)),
    snapshot("irmao-a", sibA),
    snapshot("irmao-b", sibB),
    ...pool.slice(0, 8).map((row, index) => snapshot(`campo-${index + 1}`, row)),
  ];

  const teams: CombatTeamSample[] = [];
  for (let i = 0; i < pool.length - 2 && teams.length < 5; i += 1) {
    const members = [pool[i]!, pool[i + 1]!, pool[i + 2]!];
    const links = partySynergyLinks(
      members.map((row, index) => ({
        creatureId: `${teams.length}:${index}`,
        name: row.combatManifest!.identity.namePt,
        manifest: row.combatManifest!,
      })),
    );
    if (links.length === 0 && teams.length < 3) {
      continue;
    }
    teams.push({
      label: `time-${teams.length + 1}`,
      members: members.map((row) => `${row.speciesKey}/${row.combatManifest!.identity.namePt}`),
      links,
    });
  }
  while (teams.length < 5) {
    const offset = teams.length * 7;
    const members = [pool[offset]!, pool[offset + 1]!, pool[offset + 2]!];
    teams.push({
      label: `time-${teams.length + 1}`,
      members: members.map((row) => `${row.speciesKey}/${row.combatManifest!.identity.namePt}`),
      links: partySynergyLinks(
        members.map((row, index) => ({
          creatureId: `fill:${index}`,
          name: row.combatManifest!.identity.namePt,
          manifest: row.combatManifest!,
        })),
      ),
    });
  }

  return { samples, teams };
}
