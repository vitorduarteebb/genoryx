import type { GeneKey, GeneRank } from "@nexora/types";
import { isCardKitManifest, kitCardsToDefinitions, type CardKitManifest, type CreatureCardKit } from "./kit";
import { generateCreatureBlueprint, type CreatureBlueprint } from "../genes/generate";
import { kitRoleCoverage, type RefinedCardContent } from "./content-pass";

export type ShowcaseCreature = {
  codename: "Kyrum" | "Brynix" | "Doron";
  archetype: string;
  blueprint: CreatureBlueprint;
  kit: CreatureCardKit;
  refined: ReturnType<typeof kitCardsToDefinitions>;
  coverage: ReturnType<typeof kitRoleCoverage>;
};

const GENE_PATCH: Record<ShowcaseCreature["codename"], Partial<Record<GeneKey, GeneRank>>> = {
  Kyrum: {
    ATK: "S",
    MAG: "C",
    DEF: "B",
    RES: "C",
    HP: "B",
    SPD: "B",
    PRECISION: "A",
    EVASION: "C",
    CRIT: "B",
    CRIT_DAMAGE: "A",
    STATUS: "B",
  },
  Brynix: {
    ATK: "E",
    MAG: "A",
    DEF: "D",
    RES: "B",
    HP: "C",
    SPD: "A",
    PRECISION: "B",
    EVASION: "C",
    CRIT: "C",
    CRIT_DAMAGE: "C",
    STATUS: "A",
  },
  Doron: {
    ATK: "A",
    MAG: "D",
    DEF: "S",
    RES: "B",
    HP: "S",
    SPD: "D",
    PRECISION: "C",
    EVASION: "E",
    CRIT: "C",
    CRIT_DAMAGE: "C",
    STATUS: "B",
  },
};

const SHOWCASE_SEEDS: Record<ShowcaseCreature["codename"], { species: string; seed: number; archetype: string }> = {
  Kyrum: { species: "sparkyn", seed: 71_103, archetype: "PRECISION / FINISHER" },
  Brynix: { species: "pyron", seed: 42_007, archetype: "BURN / MAGIC PRESSURE" },
  Doron: { species: "terranox", seed: 88_221, archetype: "FRONTLINE / BRUISER" },
};

function sealedCards(blueprint: CreatureBlueprint): CardKitManifest[] {
  return blueprint.loci
    .map((locus) => locus.expressed)
    .filter((row): row is CardKitManifest => isCardKitManifest(row));
}

/** Showcase com kit selado do genesis; só patcha genes para o content-pass/Genome. Sem reroll. */
export function buildShowcaseCreature(codename: ShowcaseCreature["codename"]): ShowcaseCreature {
  const spec = SHOWCASE_SEEDS[codename];
  const blueprint = generateCreatureBlueprint({
    seed: spec.seed,
    speciesKey: spec.species,
    origin: "STARTER",
    name: codename,
    lifeStage: "ADULT",
  });
  blueprint.genes = { ...blueprint.genes, ...GENE_PATCH[codename] };
  const cards = sealedCards(blueprint);
  const combat = blueprint.combatManifest;
  const kit: CreatureCardKit = {
    version: combat?.engineVersion ?? "sealed",
    cards,
    combat: combat ?? undefined,
  };
  const refined = kitCardsToDefinitions(cards, {
    genes: blueprint.genes,
    quirks: combat?.identity.quirks.map((row) => row.key) ?? [],
    verbs: combat?.identity.verbs ?? [],
  });

  return {
    codename,
    archetype: spec.archetype,
    blueprint,
    kit,
    refined,
    coverage: kitRoleCoverage(
      refined.map(
        (row) =>
          ({
            effects: row.effects,
            domain: row.contentPass.domain,
            speed: row.contentPass.speed,
            roles: row.contentPass.roles,
            tags: [...row.tags],
            changes: row.contentPass.changes,
          }) satisfies RefinedCardContent,
      ),
    ),
  };
}

export function buildShowcaseTrio() {
  return {
    Kyrum: buildShowcaseCreature("Kyrum"),
    Brynix: buildShowcaseCreature("Brynix"),
    Doron: buildShowcaseCreature("Doron"),
  } as const;
}

export function compositionChecklist(trio: ReturnType<typeof buildShowcaseTrio>) {
  const all = [...trio.Doron.refined, ...trio.Brynix.refined, ...trio.Kyrum.refined];
  const statuses = new Set(
    all.flatMap((row) =>
      row.effects.flatMap((effect) => [effect.status, effect.condition?.targetHas].filter((value): value is string => Boolean(value))),
    ),
  );
  const counters = all.filter((row) => row.effects.some((effect) => effect.op === "REMOVE_STATUS") || row.tags.includes("GUARD_BREAK"));
  const synergies = all.filter((row) => row.effects.some((effect) => Boolean(effect.condition?.targetHas)));
  return {
    frontline: trio.Doron.coverage.hasFoundation && trio.Doron.coverage.hasReaction,
    setup: trio.Brynix.coverage.hasSetup || trio.Kyrum.coverage.hasSetup,
    pressure: trio.Brynix.coverage.hasPressure && trio.Kyrum.coverage.hasPressure,
    finisher: trio.Kyrum.coverage.hasFinisher || trio.Brynix.coverage.hasFinisher,
    reaction: [trio.Doron, trio.Brynix, trio.Kyrum].some((row) => row.coverage.hasReaction),
    allyCombo: statuses.has("BURN") && (statuses.has("MARKED") || statuses.has("SHOCK")),
    adversaryAnswer: counters.length > 0,
    timing: [trio.Doron, trio.Brynix, trio.Kyrum].every((row) => row.coverage.hasTiming),
    targeting: all.some((row) => row.effects.some((effect) => effect.condition?.targetHas || effect.condition?.selfPosition)),
    resource: [trio.Doron, trio.Brynix, trio.Kyrum].some((row) => row.coverage.hasResource),
    sharedStates: [...statuses],
    synergyCards: synergies.length,
    counterCards: counters.length,
  };
}
