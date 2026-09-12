import { describe, expect, it } from "vitest";
import { presentBattle } from "../src/modules/battles/present-battle";
import type { BattleState } from "@nexora/game-engine";

function side(id: string, characterId: string) {
  return {
    id,
    characterId,
    displayName: id,
    energy: 3,
    momentum: 0,
    deck: [{ instanceId: `${id}-d`, definitionKey: "ember_strike" }],
    hand: [{ instanceId: `${id}-h`, definitionKey: "ember_strike" }],
    discard: [],
    exile: [],
    creatures: [],
  };
}

describe("presentBattle", () => {
  const state = {
    id: "b1",
    type: "PVP",
    status: "ACTIVE",
    seed: 1,
    rngIndex: 1,
    round: 1,
    activeSide: 1,
    sides: [side("a", "char-a"), side("b", "char-b")],
    log: [],
  } as BattleState;

  it("mostra a mão do jogador B e esconde a do oponente", () => {
    const view = presentBattle("b1", state, "char-b");
    expect(view.yourSide).toBe(1);
    expect(view.yourTurn).toBe(true);
    expect(view.state.sides[1].hand).toHaveLength(1);
    expect(view.state.sides[0].hand).toHaveLength(0);
    expect(view.state.sides[0].handCount).toBe(1);
    expect(view.events).toEqual([]);
    expect(view.state.sides[1].hand[0]?.artUrl).toBeNull();
  });

  it("resolve arte CREATURE pela criatura dona da carta, não só pelo cardKey", () => {
    const withOwner = {
      ...state,
      sides: [
        {
          ...state.sides[0],
          hand: [
            {
              instanceId: "h1",
              definitionKey: "quake_stomp",
              sourceCreatureId: "d9d89416-50c2-4a45-8224-2bcfd1132178",
              locus: "G1",
            },
          ],
        },
        state.sides[1],
      ],
    } as BattleState;
    const view = presentBattle("b1", withOwner, "char-a", {
      cardArt: new Map([
        [
          "d9d89416-50c2-4a45-8224-2bcfd1132178:quake_stomp",
          {
            cardDefinitionId: "quake_stomp",
            variant: "BASE",
            status: "READY",
            source: "openai",
            artUrl: "/card-art/g1/image?v=abc",
            imageHash: "abc",
          },
        ],
      ]),
    });
    expect(view.state.sides[0].hand[0]?.artUrl).toBe("/card-art/g1/image?v=abc");
    expect(view.state.sides[0].hand[0]?.name).toBe("Pisada Sísmica");
    expect(view.state.sides[1].discardCount).toBe(0);
    expect(view.renderer).toBe("web");
  });

  it("wild sem creatureId usa visual da espécie, nunca some a identidade", () => {
    const wild = {
      ...state,
      type: "PVE",
      sides: [
        {
          ...state.sides[0],
          creatures: [
            {
              id: "w1",
              name: "Terranox",
              speciesKey: "terranox",
              element: "EARTH",
              hp: 40,
              maxHp: 40,
              shield: 0,
              atk: 8,
              def: 8,
              mag: 4,
              res: 4,
              spd: 6,
              crit: 5,
              tags: [],
              statuses: [],
              slot: "FRONT",
            },
          ],
        },
        state.sides[1],
      ],
    } as BattleState;
    const view = presentBattle("b1", wild, "char-a", {
      visuals: new Map([
        [
          "species:terranox",
          {
            renderMode: "SPECIES_MASTER",
            modelUrl: null,
            portraitUrl: "/creature-visuals/x/image",
            imageHash: "abc",
            lifeStage: "BABY",
            temperament: "WILD",
            bodyPlan: null,
            mutation: null,
            aura: null,
            visualSeed: null,
            source: "species-master",
            provider: "OPENAI",
            forming: false,
          },
        ],
      ]),
    });
    expect(view.state.sides[0].creatures[0]?.visual.portraitUrl).toContain("creature-visuals");
    expect(view.state.sides[0].creatures[0]?.visual.renderMode).toBe("SPECIES_MASTER");
  });
});
