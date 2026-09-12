import { CHASSIS_ID, chassisCombinationCount } from "@nexora/config";
import { describe, expect, it } from "vitest";
import {
  breedChassisDna,
  chassisSignature,
  rollChassisDna,
  withUniqueChassis,
} from "./dna";

describe("chassis DNA", () => {
  it("é determinístico para o mesmo seed", () => {
    expect(rollChassisDna({ seed: 42 })).toEqual(rollChassisDna({ seed: 42 }));
  });

  it("seeds diferentes produzem assinaturas diferentes na prática", () => {
    const a = chassisSignature(rollChassisDna({ seed: 1 }));
    const b = chassisSignature(rollChassisDna({ seed: 2 }));
    expect(a).not.toBe(b);
    expect(a.startsWith(CHASSIS_ID)).toBe(true);
  });

  it("assinatura ignora o estágio de crescimento: é o mesmo indivíduo", () => {
    const baby = rollChassisDna({ seed: 99, lifeStage: "BABY" });
    const adult = { ...baby, growthStage: "Adult" as const };
    expect(chassisSignature(baby)).toBe(chassisSignature(adult));
  });

  it("recusa fenótipo já tomado e sorteia outro", () => {
    const first = rollChassisDna({ seed: 7 });
    const taken = new Set([chassisSignature(first)]);
    const next = withUniqueChassis(7, taken, "BABY", first);
    expect(chassisSignature(next)).not.toBe(chassisSignature(first));
  });

  it("filho do cruzamento não copia o fenótipo de um pai inteiro", () => {
    const a = rollChassisDna({ seed: 11 });
    const b = rollChassisDna({ seed: 22 });
    const child = breedChassisDna({ seed: 33, parentA: a, parentB: b });
    expect(chassisSignature(child)).not.toBe(chassisSignature(a));
    expect(chassisSignature(child)).not.toBe(chassisSignature(b));
  });

  it("o espaço de combinações é grande o bastante para unicidade Alpha", () => {
    expect(chassisCombinationCount()).toBeGreaterThan(1_000_000);
  });

  it("cerca de um terço das criaturas nasce sem chifres", () => {
    let none = 0;
    for (let seed = 1; seed <= 200; seed += 1) {
      if (rollChassisDna({ seed }).horns.d === "HORNS_NONE") {
        none += 1;
      }
    }
    expect(none).toBeGreaterThan(50);
    expect(none).toBeLessThan(110);
  });
});
