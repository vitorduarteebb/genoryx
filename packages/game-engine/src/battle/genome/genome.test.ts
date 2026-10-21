import { genomeV2 } from "@nexora/config";
import { describe, expect, it } from "vitest";
import { detectCombatArchetype } from "./archetype";
import { anatomicalAffordances } from "./affordances";
import { hydrateGenomeProfile } from "./profile";
import { hitChance, initiativeOf } from "./resolve";
import { analyzeCardSynergy } from "./synergy";
import { simulateGenomeMatchups } from "./simulate";
import type { Combatant } from "../types";

function unit(genes: Record<string, string>, extra: Partial<Combatant> = {}): Combatant {
  return {
    id: "u",
    name: "U",
    speciesKey: "sim",
    element: "ELECTRIC",
    hp: 100,
    maxHp: 100,
    shield: 0,
    atk: 40,
    def: 20,
    mag: 40,
    res: 20,
    spd: 80,
    crit: 0.05,
    tags: [],
    statuses: [],
    slot: "FRONT",
    genes,
    ...extra,
  };
}

describe("combat genome v2", () => {
  it("SPD C + Rápida age antes de SPD A + Pesada na mesma base", () => {
    const slow = unit({ SPD: "C" }, { spd: 80 });
    const fast = unit({ SPD: "A" }, { spd: 100 });
    const a = initiativeOf({ actor: slow, speed: "FAST", tags: [], seed: 1, instanceId: "a" });
    const b = initiativeOf({ actor: fast, speed: "HEAVY", tags: [], seed: 1, instanceId: "b" });
    expect(a.initiative).toBeGreaterThan(b.initiative);
  });

  it("Normal segue o SPD e não cria segunda ação", () => {
    const a = initiativeOf({ actor: unit({ SPD: "A" }, { spd: 100 }), speed: "NORMAL", tags: [], seed: 3, instanceId: "a" });
    const c = initiativeOf({ actor: unit({ SPD: "C" }, { spd: 80 }), speed: "NORMAL", tags: [], seed: 3, instanceId: "c" });
    expect(a.initiative).toBeGreaterThan(c.initiative);
    expect(genomeV2.cardSpeedBonus.FAST).toBe(20);
    expect(genomeV2.cardSpeedBonus.HEAVY).toBe(-25);
  });

  it("acerto fica na faixa estreita", () => {
    const equal = hitChance(unit({ PRECISION: "C" }), unit({ EVASION: "C" }), hydrateGenomeProfile({ key: "x", name: "x", type: "ATTACK", cost: 1, element: "EARTH", targetType: "ENEMY", tags: ["PHYSICAL"], effects: [{ op: "DAMAGE", value: 8 }] }));
    const sniper = hitChance(unit({ PRECISION: "S" }), unit({ EVASION: "C" }), hydrateGenomeProfile({ key: "x", name: "x", type: "ATTACK", cost: 1, element: "EARTH", targetType: "ENEMY", tags: ["PHYSICAL"], effects: [{ op: "DAMAGE", value: 8 }] }));
    const blind = hitChance(unit({ PRECISION: "D" }), unit({ EVASION: "S" }), hydrateGenomeProfile({ key: "x", name: "x", type: "ATTACK", cost: 1, element: "EARTH", targetType: "ENEMY", tags: ["PHYSICAL"], effects: [{ op: "DAMAGE", value: 8 }] }));
    const sure = hitChance(unit({ PRECISION: "F" }), unit({ EVASION: "SS" }), hydrateGenomeProfile({ key: "x", name: "x", type: "ATTACK", cost: 1, element: "EARTH", targetType: "ENEMY", tags: ["INEVITABLE", "PHYSICAL"], effects: [{ op: "DAMAGE", value: 8 }] }));
    expect(equal).toBe(0.9);
    expect(sniper).toBeGreaterThanOrEqual(0.97);
    expect(blind).toBe(0.8);
    expect(sure).toBe(1);
  });

  it("identidade crítica com CRIT E vira bruiser e cita a fraqueza", () => {
    const build = detectCombatArchetype(
      { HP: "A", ATK: "S", DEF: "B", MAG: "D", RES: "B", SPD: "C", CRIT: "E", CRIT_DAMAGE: "C", PRECISION: "C", EVASION: "C", STATUS: "S" },
      "CRITICAL",
      "ELECTRIC",
    );
    expect(build.archetype).toContain("Bruiser");
    expect(build.limitation).toContain("CRIT E");
    expect(build.identityTypology).toBe("CRITICAL");
  });

  it("kit hidratado não troca a chave da carta e não infere híbrido", () => {
    const card = { key: "ember_strike", name: "Brasa", type: "ATTACK" as const, cost: 1, element: "FIRE" as const, targetType: "ENEMY", tags: ["BURN"], effects: [{ op: "DAMAGE", value: 10 }] };
    const profile = hydrateGenomeProfile(card, "G3");
    expect(profile.cardKey).toBe("ember_strike");
    expect(profile.domain).toBe("MAGIC");
    expect(profile.domain).not.toBe("HYBRID");
    expect(profile.rulesText).toContain("MAG");
  });

  it("anatomia cria vocabulário, não atributo", () => {
    const rows = anatomicalAffordances({ back: "DRACONIC_WINGS", tail: "PREDATOR", horns: "NONE", head: "BEAST" });
    expect(rows.some((row) => row.tags.includes("FLIGHT"))).toBe(true);
    expect(rows.some((row) => row.tags.includes("HUNT"))).toBe(true);
    expect(rows.every((row) => row.note.toLowerCase().includes("não") || row.note.includes("Vocabulário"))).toBe(true);
  });

  it("sinergia explica o motivo", () => {
    const notes = analyzeCardSynergy({ STATUS: "S", ATK: "S", MAG: "D", SPD: "C", DEF: "C", CRIT: "E", CRIT_DAMAGE: "C", PRECISION: "C", EVASION: "C", HP: "A", RES: "C" }, [
      hydrateGenomeProfile({ key: "a", name: "a", type: "ATTACK", cost: 1, element: "EARTH", targetType: "ENEMY", tags: ["PHYSICAL", "BURN"], effects: [{ op: "DAMAGE", value: 8 }] }),
    ]);
    expect(notes.find((row) => row.key === "physical")?.reason).toContain("ATK S");
    expect(notes.find((row) => row.key === "crit")?.reason).toContain("CRIT E");
  });

  it("simulador não ajusta balance e registra seeds", () => {
    const report = simulateGenomeMatchups(12, 42);
    expect(report.seeds).toHaveLength(12);
    expect(report.notes[0]).toContain("humana");
    expect(report.magicVsRes).toBeGreaterThan(report.physicalVsDef);
  });
});
