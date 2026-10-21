import { combatConfig, combatV23Config, energyForRound, matchRulesFor, seedPowerForSpecies, type MatchMode } from "@nexora/config";
import { hydratePersonalResource } from "../genetic-combat/resource";
import type { BattleRulesVersion, FormationSlot } from "@nexora/types";
import { createSeededRandom } from "../random/random-service";
import { buildBattleDeck, dealOpeningHand } from "../cards/deck";
import type { CreatureBlueprint } from "../genes/generate";
import { deriveCombatStats, type SpeciesBases } from "../stats/derive";
import { formationSlotFromIndex } from "./formation";
import { emptyFusion } from "./fusion-state";
import { defaultClock, emptyChain, emptyTeamResonance } from "./v15/match-rules";
import type { BattleSide, BattleState, Combatant } from "./types";

export type FighterInput = {
  id: string;
  characterId?: string;
  displayName: string;
  creatures: Array<{
    blueprint: CreatureBlueprint;
    bases: SpeciesBases;
    creatureId?: string;
    slot?: FormationSlot;
    typology?: string;
    powerId?: string;
    powerLineageId?: string;
  }>;
  rosterIds?: string[];
  bannedCreatureId?: string | null;
  selectedIds?: string[];
  benchedCreatureId?: string | null;
};

function toCombatant(
  row: FighterInput["creatures"][number],
  index: number,
  sideId: string,
  version: BattleRulesVersion,
): Combatant {
  const stats = deriveCombatStats(row.blueprint, row.bases);
  const resourceDef = row.blueprint.combatManifest
    ? hydratePersonalResource(row.blueprint.combatManifest.identity.resource)
    : null;
  return {
    id: `${sideId}-unit-${index}`,
    creatureId: row.creatureId,
    name: row.blueprint.name,
    speciesKey: row.blueprint.speciesKey,
    element: row.blueprint.elementPrimary,
    hp: stats.maxHp,
    maxHp: stats.maxHp,
    shield: 0,
    atk: stats.atk,
    def: stats.def,
    mag: stats.mag,
    res: stats.res,
    spd: stats.spd,
    crit: stats.crit,
    genes: { ...row.blueprint.genes },
    tags: [...row.blueprint.tags],
    statuses: [],
    slot: row.slot ?? formationSlotFromIndex(index, version),
    typology: row.typology ?? seedPowerForSpecies(row.blueprint.speciesKey)?.typology,
    powerId: row.powerId,
    powerLineageId: row.powerLineageId,
    resources: resourceDef ? { [resourceDef.id]: resourceDef.resetRule.battleStart } : undefined,
    resourceCap: resourceDef ? { [resourceDef.id]: resourceDef.maxStacks } : undefined,
    resourceDef: resourceDef ?? undefined,
    identityName: row.blueprint.combatManifest?.identity.namePt,
  };
}

export function createBattleState(input: {
  id: string;
  seed: number;
  type: "PVE" | "PVP";
  sideA: FighterInput;
  sideB: FighterInput;
  wildSpeciesKey?: string;
  rulesVersion?: BattleRulesVersion;
  matchMode?: MatchMode;
  mapKey?: string;
}): BattleState {
  const version = input.rulesVersion ?? "V1";
  const matchRules = matchRulesFor(input.matchMode ?? (input.type === "PVP" ? "CASUAL" : "PVE"));
  const rng = createSeededRandom(input.seed);
  const makeSide = (fighter: FighterInput, prefix: string): BattleSide => {
    const fighters = fighter.creatures.map((row, index) => ({
      ...row,
      creatureId: row.creatureId ?? `${fighter.id}-creature-${index}`,
      typology: row.typology ?? seedPowerForSpecies(row.blueprint.speciesKey)?.typology,
    }));
    const creatures = fighters.map((row, index) => toCombatant(row, index, fighter.id, version));
    const built = buildBattleDeck(
      fighters.map((row, index) => ({
        blueprint: row.blueprint,
        creatureId: row.creatureId,
        typology: row.typology,
        powerId: row.powerId,
        slot: creatures[index]?.slot,
      })),
      rng,
      prefix,
    );
    const livingIds = creatures.filter((row) => row.hp > 0).map((row) => row.creatureId).filter((row): row is string => Boolean(row));
    const dealt = dealOpeningHand(built, livingIds, combatConfig.startingHand, rng);
    const side: BattleSide = {
      id: fighter.id,
      characterId: fighter.characterId,
      displayName: fighter.displayName,
      energy: energyForRound(1),
      mana: combatV23Config.startingMana,
      maxMana: combatV23Config.maxMana,
      momentum: combatConfig.startingMomentum,
      deck: dealt.deck,
      hand: dealt.hand,
      discard: [],
      exile: [],
      creatures,
      rosterIds: fighter.rosterIds,
      bannedCreatureId: fighter.bannedCreatureId ?? null,
      selectedIds: fighter.selectedIds ?? creatures.map((row) => row.creatureId).filter((row): row is string => Boolean(row)),
      benchedCreatureId: fighter.benchedCreatureId ?? null,
      activeTypologies: creatures.filter((row) => row.hp > 0).map((row) => row.typology).filter((row): row is string => Boolean(row)),
      fusion: emptyFusion(),
      reservedEnergy: 0,
      actionQueue: [],
      reactionSlot: null,
      teamResonance: emptyTeamResonance(matchRules),
      geneticChain: emptyChain(),
      preparedEffects: [],
      channels: [],
      impetusUsed: {},
    };
    return side;
  };

  return {
    id: input.id,
    type: input.type,
    status: "ACTIVE",
    rulesVersion: version,
    phase: "ACTIVE",
    seed: input.seed,
    rngIndex: 1,
    round: 1,
    activeSide: 0,
    sides: [makeSide(input.sideA, "a"), makeSide(input.sideB, "b")],
    wildSpeciesKey: input.wildSpeciesKey,
    mapKey: input.mapKey,
    matchRules,
    clock: defaultClock(matchRules, 0),
    replay: { matchSeed: input.seed, rulesVersion: matchRules.rulesVersion, actions: [], eventSequence: 0 },
    eventSeq: 0,
    log: [{ type: "START", text: "A batalha começou." }],
    usageHistory: [],
    fusion: emptyFusion(),
  };
}

export function livingCreatures(side: BattleSide) {
  return side.creatures.filter((row) => row.hp > 0);
}
