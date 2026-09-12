import { describe, expect, it } from "vitest";
import { createSeededRandom } from "../random/random-service";
import { generateCreatureBlueprint } from "../genes/generate";
import { buildBattleDeck, collectCreatureManifestations, dealOpeningHand } from "./deck";

const TERRANOX_ID = "d9d89416-50c2-4a45-8224-2bcfd1132178";
const NYMPHA_ID = "fd21ee01-c56a-44fd-a278-55944f1f7c32";
const PYRON_ID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

describe("battle deck source attribution", () => {
  it("marca cada carta genética com a criatura dona", () => {
    const terranox = generateCreatureBlueprint({ seed: 20260903, speciesKey: "terranox", origin: "WILD" });
    const nympha = generateCreatureBlueprint({ seed: 7, speciesKey: "nympha", origin: "WILD" });
    const deck = buildBattleDeck(
      [
        { blueprint: terranox, creatureId: TERRANOX_ID, typology: "TANK" },
        { blueprint: nympha, creatureId: NYMPHA_ID, typology: "HEAL" },
      ],
      createSeededRandom(99),
      "a",
    );
    expect(deck).toHaveLength(20);
    expect(deck.filter((row) => row.sourceCreatureId === TERRANOX_ID)).toHaveLength(10);
    expect(deck.filter((row) => row.sourceCreatureId === NYMPHA_ID)).toHaveLength(10);
    expect(deck.every((row) => row.locus)).toBe(true);
  });

  it("não mistura sinergia no deck de manifestações", () => {
    const terranox = generateCreatureBlueprint({ seed: 1, speciesKey: "terranox", origin: "WILD" });
    const rows = collectCreatureManifestations([{ blueprint: terranox, creatureId: TERRANOX_ID }]);
    expect(rows).toHaveLength(10);
    expect(rows.every((row) => row.sourceCreatureId === TERRANOX_ID)).toBe(true);
  });

  it("mesmo seed gera a mesma ordem", () => {
    const pyron = generateCreatureBlueprint({ seed: 11, speciesKey: "pyron", origin: "STARTER" });
    const a = buildBattleDeck([{ blueprint: pyron, creatureId: PYRON_ID }], createSeededRandom(44), "a");
    const b = buildBattleDeck([{ blueprint: pyron, creatureId: PYRON_ID }], createSeededRandom(44), "a");
    expect(a.map((row) => row.definitionKey)).toEqual(b.map((row) => row.definitionKey));
  });

  it("mão inicial representa as três criaturas vivas", () => {
    const a = generateCreatureBlueprint({ seed: 1, speciesKey: "pyron", origin: "STARTER" });
    const b = generateCreatureBlueprint({ seed: 2, speciesKey: "florune", origin: "STARTER" });
    const c = generateCreatureBlueprint({ seed: 3, speciesKey: "terranox", origin: "STARTER" });
    const deck = buildBattleDeck(
      [
        { blueprint: a, creatureId: "ca" },
        { blueprint: b, creatureId: "cb" },
        { blueprint: c, creatureId: "cc" },
      ],
      createSeededRandom(8),
      "a",
    );
    const dealt = dealOpeningHand(deck, ["ca", "cb", "cc"], 5, createSeededRandom(9));
    const owners = new Set(dealt.hand.map((row) => row.sourceCreatureId));
    expect(owners.has("ca")).toBe(true);
    expect(owners.has("cb")).toBe(true);
    expect(owners.has("cc")).toBe(true);
    expect(dealt.hand).toHaveLength(5);
    expect(dealt.deck).toHaveLength(25);
  });
});
