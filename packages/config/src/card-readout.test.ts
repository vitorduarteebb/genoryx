import { describe, expect, it } from "vitest";
import { buildCardReadout, resourceGateCopy } from "./card-readout";

describe("card readout", () => {
  it("Labareda vira efeito curto sem fórmula na face", () => {
    const row = buildCardReadout({
      name: "Labareda Incandescente",
      cost: 1,
      domain: "MAGIC",
      speed: "NORMAL",
      locus: "G3",
      effects: [
        { op: "DAMAGE", value: 11 },
        { op: "APPLY_STATUS", status: "BURN", duration: 3 },
      ],
    });
    expect(row.faceSummary).toContain("11 Dano Mágico");
    expect(row.faceSummary).toContain("Queimadura");
    expect(row.faceSummary).not.toContain("35%");
    expect(row.faceSummary).not.toContain("Enfrenta RES");
    expect(row.details.scaling).toContain("MAG");
    expect(row.details.defense).toBe("RES");
    expect(row.badges.map((b) => b.label)).toEqual(expect.arrayContaining(["Mágico", "Normal"]));
  });

  it("Pulso Ardente mostra consumo → energia sem texto de ferramenta", () => {
    const row = buildCardReadout({
      name: "Pulso Ardente",
      cost: 1,
      domain: "UTILITY",
      speed: "NORMAL",
      effects: [
        { op: "CONSUME_RESOURCE", value: 2, resource: "HEAT", condition: { resourceAtLeast: 2 } },
        { op: "GAIN_ENERGY", value: 1 },
      ],
    });
    expect(row.faceLines[0]?.label).toContain("Consuma 2");
    expect(row.faceLines.some((line) => line.label.includes("Energia +1"))).toBe(true);
    expect(row.faceSummary).not.toContain("Ferramenta");
  });

  it("gate explica mínimo diferente do consumo", () => {
    expect(resourceGateCopy({ need: 1, have: 0, name: "Calor", consumeAmount: 2 })).toContain("consome 2");
  });

  it("reação destaca o gatilho", () => {
    const row = buildCardReadout({
      name: "Retorno Ígneo",
      cost: 1,
      type: "REACTION",
      locus: "G7",
      domain: "MAGIC",
      speed: "VERY_FAST",
      effects: [
        { op: "DAMAGE", value: 9, condition: { targetHas: "BURN" } },
        { op: "SHIELD", value: 10, condition: { targetHas: "BURN" } },
      ],
    });
    expect(row.triggerLine).toContain("Queimadura");
    expect(row.badges.some((row) => row.label === "Reação")).toBe(true);
  });
});
