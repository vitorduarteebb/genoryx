import { describe, expect, it } from "vitest";
import { createSeededRandom } from "../../random/random-service";
import {
  drawWeighted,
  presenceDrawCount,
  refreshDraftWeights,
  typologyDraftWeight,
} from "./draft-weights";
import { fusionEnergyCost, fusionPower } from "./fusion-formula";
import {
  interventionSurcharge,
  pushStack,
  resolveStackLifo,
  stackPayCost,
  tryPayStack,
  type PaidStackEntry,
  type Wallet,
} from "./magic-stack";
import type { BattleUsageEntry } from "./usage";

function play(round: number, typology: string, sequence: number): BattleUsageEntry {
  return {
    sequence,
    round,
    side: 0,
    cardKey: typology.toLowerCase(),
    typology,
    mechanicTags: [typology],
  };
}

describe("memória tática (pesos de draft)", () => {
  it("tipo não usado pesa 1; T soma +3; T-1 soma +1; acúmulo é aditivo", () => {
    const history = [play(5, "BURN", 1), play(5, "BURN", 2), play(4, "BURN", 3), play(4, "TANK", 4)];
    expect(typologyDraftWeight("CONTROL", history, 0, 5).weight).toBe(1);
    expect(typologyDraftWeight("BURN", history, 0, 5)).toMatchObject({
      sameTurnPlays: 2,
      previousTurnPlays: 1,
      weight: 1 + 3 + 3 + 1,
    });
    expect(typologyDraftWeight("TANK", history, 0, 5).weight).toBe(1 + 1);
  });

  it("presença saca 1 por criatura viva até 3", () => {
    expect(presenceDrawCount(0)).toBe(0);
    expect(presenceDrawCount(2)).toBe(2);
    expect(presenceDrawCount(3)).toBe(3);
    expect(presenceDrawCount(5)).toBe(3);
  });

  it("compra ponderada favorece o tipo jogado neste turno", () => {
    const history = [play(5, "SPEED", 1)];
    const deck = [
      { instanceId: "a", typology: "CONTROL" },
      { instanceId: "b", typology: "SPEED" },
      { instanceId: "c", typology: "HEAL" },
    ];
    const hits = { a: 0, b: 0, c: 0 };
    for (let seed = 1; seed <= 80; seed += 1) {
      const rng = createSeededRandom(seed);
      const { drawn } = drawWeighted(deck, 1, history, 0, 5, rng);
      hits[drawn[0]!.instanceId as "a" | "b" | "c"] += 1;
    }
    expect(hits.b).toBeGreaterThan(hits.a);
    expect(hits.b).toBeGreaterThan(hits.c);
  });

  it("refresh lista os 15 tipos sem inventar peso", () => {
    const rows = refreshDraftWeights(["BURN", "SPEED"], [play(3, "SPEED", 1)], 0, 4);
    expect(rows).toHaveLength(2);
    expect(rows[1]?.weight).toBe(2);
  });
});

describe("pilha de embate e fadiga", () => {
  it("sobretaxa: 1ª=0, 2ª=+1, 3ª=+2", () => {
    expect(interventionSurcharge(1)).toBe(0);
    expect(interventionSurcharge(2)).toBe(1);
    expect(interventionSurcharge(3)).toBe(2);
    expect(stackPayCost(2, 2)).toBe(3);
    expect(stackPayCost(1, 3)).toBe(3);
  });

  it("momentum só paga intervenção, nunca o lance de abertura", () => {
    const poor: Wallet = { mana: 0, momentum: 4 };
    const open = tryPayStack({
      wallet: poor,
      cardCost: 2,
      interventionIndex: 1,
      momentumAltCost: 2,
      isOpeningPlay: true,
    });
    expect(open.ok).toBe(false);
    const defend = tryPayStack({
      wallet: poor,
      cardCost: 2,
      interventionIndex: 1,
      momentumAltCost: 2,
      isOpeningPlay: false,
    });
    expect(defend).toMatchObject({ ok: true, paidMomentum: 2, paidMana: 0 });
  });

  it("resolve LIFO e recusa pilha acima do teto", () => {
    const a: PaidStackEntry = {
      id: "1",
      side: 0,
      cardKey: "fusion_furnace",
      cardName: "Fornalha Viva",
      manaCost: 4,
      range: "LONG",
      targetName: "Nympha",
      interventionIndex: 0,
      surcharge: 0,
      paidMana: 4,
      paidMomentum: 0,
    };
    const b: PaidStackEntry = {
      id: "2",
      side: 1,
      cardKey: "tide_lock",
      cardName: "Trava da Maré",
      manaCost: 2,
      range: "MEDIUM",
      targetName: "Pyron",
      interventionIndex: 1,
      surcharge: 0,
      paidMana: 2,
      paidMomentum: 0,
    };
    const c: PaidStackEntry = {
      id: "3",
      side: 0,
      cardKey: "spark_dash",
      cardName: "Ímpeto Elétrico",
      manaCost: 1,
      range: "SHORT",
      targetName: "Nympha",
      interventionIndex: 2,
      surcharge: 1,
      paidMana: 2,
      paidMomentum: 0,
    };
    const events = resolveStackLifo([a, b, c]);
    expect(events.map((row) => row.entry.cardKey)).toEqual(["spark_dash", "tide_lock", "fusion_furnace"]);
    const overflow = pushStack(Array.from({ length: 8 }, (_, i) => ({ ...a, id: String(i) })), c);
    expect(overflow).toEqual({ ok: false, reason: "pilha no teto" });
  });
});

describe("fórmulas de fusão", () => {
  it("P_F e C_F são determinísticos", () => {
    expect(fusionPower({ basePower: 40, rarity: "GENESIS", geneticValue: 80, fieldBonus: 5 })).toBe(
      Math.floor(40 * 1.7 + 80 * 0.15 + 5),
    );
    expect(fusionEnergyCost({ costs: [2, 3], rarity: "RARE" })).toBe(Math.max(1, Math.ceil(5 / 2) + 1));
    expect(fusionEnergyCost({ costs: [1, 1, 1], rarity: "COMMON" })).toBe(2);
  });
});

describe("Turno 5 — log narrativo da Guerra Mágica", () => {
  it("fusão lendária, control, speed com fadiga +1, LIFO e alcance", () => {
    const log: string[] = [];
    const history = [
      play(1, "BURN", 1),
      play(2, "TANK", 2),
      play(3, "BURN", 3),
      play(4, "TANK", 4),
    ];
    const weights = refreshDraftWeights(["BURN", "TANK", "CONTROL", "SPEED"], history, 0, 5);
    expect(weights.find((row) => row.typology === "BURN")?.weight).toBe(1);
    expect(weights.find((row) => row.typology === "TANK")?.weight).toBe(2);

    const power = fusionPower({ basePower: 36, rarity: "GENESIS", geneticValue: 92, fieldBonus: 4 });
    const cost = fusionEnergyCost({ costs: [1, 1], rarity: "GENESIS" });
    log.push(`T5 · Mana restaurada até 5. Presença: 3 cartas (3 criaturas vivas).`);
    log.push(`Slot tático projeta FORNALHA VIVA (BURN+TANK dos turnos 1–4). P_F=${power} C_F=${cost}.`);

    let a: Wallet = { mana: 5, momentum: 2 };
    let b: Wallet = { mana: 5, momentum: 1 };
    const open = tryPayStack({ wallet: a, cardCost: cost, interventionIndex: 0, isOpeningPlay: true });
    expect(open.ok).toBe(true);
    if (open.ok) {
      a = open.wallet;
    }
    log.push(`A joga FORNALHA VIVA (LONG) em Nympha · paga ${cost} mana. Janela de intervenção abre.`);

    const control = tryPayStack({
      wallet: b,
      cardCost: 2,
      interventionIndex: 1,
      isOpeningPlay: false,
    });
    expect(control.ok).toBe(true);
    if (control.ok) {
      b = control.wallet;
      expect(control.surcharge).toBe(0);
    }
    log.push(`B intervém com TRAVA DA MARÉ (CONTROL, MEDIUM) · custo normal 2. Sem fadiga.`);

    const speed = tryPayStack({
      wallet: a,
      cardCost: 1,
      interventionIndex: 2,
      isOpeningPlay: false,
    });
    expect(speed.ok).toBe(true);
    if (speed.ok) {
      a = speed.wallet;
      expect(speed.surcharge).toBe(1);
      expect(speed.paidMana).toBe(2);
    }
    log.push(`A rebate com ÍMPETO ELÉTRICO (SPEED, SHORT) · custo 1 + fadiga +1 = 2 mana.`);

    const stack: PaidStackEntry[] = [
      {
        id: "fuse",
        side: 0,
        cardKey: "living_furnace",
        cardName: "Fornalha Viva",
        typology: "BURN",
        manaCost: cost,
        range: "LONG",
        targetId: "nympha",
        targetName: "Nympha",
        interventionIndex: 0,
        surcharge: 0,
        paidMana: cost,
        paidMomentum: 0,
      },
      {
        id: "lock",
        side: 1,
        cardKey: "tide_lock",
        cardName: "Trava da Maré",
        typology: "CONTROL",
        manaCost: 2,
        range: "MEDIUM",
        targetId: "pyron",
        targetName: "Pyron (FRONT)",
        interventionIndex: 1,
        surcharge: 0,
        paidMana: 2,
        paidMomentum: 0,
      },
      {
        id: "dash",
        side: 0,
        cardKey: "spark_dash",
        cardName: "Ímpeto Elétrico",
        typology: "SPEED",
        manaCost: 1,
        range: "SHORT",
        targetId: "nympha",
        targetName: "Nympha (FRONT)",
        interventionIndex: 2,
        surcharge: 1,
        paidMana: 2,
        paidMomentum: 0,
      },
    ];
    const resolved = resolveStackLifo(stack);
    expect(resolved.map((row) => row.entry.cardKey)).toEqual(["spark_dash", "tide_lock", "living_furnace"]);
    for (const event of resolved) {
      log.push(event.text);
    }
    log.push(
      "SHORT do Ímpeto só legal em FRONT: Nympha é vanguarda, dano aplica. MEDIUM da Trava pega Pyron (FRONT sempre exposto). LONG da Fornalha ignora bloqueio e fecha em Nympha.",
    );
    expect(a.mana).toBe(5 - cost - 2);
    expect(b.mana).toBe(3);
    expect(log.join("\n")).toContain("FORNALHA VIVA");
    expect(log.join("\n")).toContain("fadiga +1");
  });
});
