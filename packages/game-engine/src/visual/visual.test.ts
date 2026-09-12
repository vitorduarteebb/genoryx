import { eyeLexicon, headLexicon, visualGenerationConfig } from "@nexora/config";
import { describe, expect, it } from "vitest";
import { assembleVisualGenome, type CreatureVisualGenome } from "./genome";
import { buildCreatureImagePrompt, buildTurnaroundPrompt, visualSpecFromGenome } from "./prompt";

function genome(overrides: Partial<Parameters<typeof assembleVisualGenome>[0]> = {}) {
  return assembleVisualGenome({
    creatureId: "creature-a",
    speciesKey: "pyron",
    bodyPlanExpressed: "BIPED",
    bodyPlanRecessive: "QUADRUPED",
    headExpressed: "DRACONIC",
    headRecessive: "BEAST",
    geneticHash: "abcd1234",
    genesisSeed: 42,
    lifeStage: "BABY",
    mutationKey: "PLASMA",
    expressedCardKeys: ["inferno_burst", "ember_strike"],
    temperament: "FRIENDLY",
    ...overrides,
  });
}

function promptOf(row: CreatureVisualGenome, includeRecessives = false) {
  return buildCreatureImagePrompt(
    visualSpecFromGenome("creature-a", row),
    { includeRecessives },
    includeRecessives ? row : undefined,
  );
}

describe("assembleVisualGenome", () => {
  it("é determinístico para o mesmo DNA", () => {
    expect(genome()).toEqual(genome());
  });

  it("arte/visual DNA não recalcula o geneticHash do nascimento", () => {
    const hash = "abcd1234";
    const row = genome({ geneticHash: hash });
    expect(row.visualSeed).toBeTruthy();
    expect(hash).toBe("abcd1234");
  });

  it("não muda o geneticHash e só usa visualTags declarados", () => {
    const row = genome();
    expect(row.visualTags).toEqual(["WARM_CORE_GLOW"]);
    expect(row.mutationType).toBe("PLASMA");
    expect(row.bodyPlan.expressed).toBe("BIPED");
    expect(row.bodyPlan.recessive).toBe("QUADRUPED");
  });

  it("temperamento explícito vence o sorteio visual", () => {
    expect(genome({ temperament: "FERAL" }).temperament).toBe("FERAL");
    expect(genome({ temperament: "ABYSSAL" }).temperament).toBe("ABYSSAL");
  });
});

describe("buildCreatureImagePrompt", () => {
  it("o mesmo genome produz o mesmo prompt", () => {
    const row = genome();
    expect(promptOf(row)).toBe(promptOf(row));
  });

  it("inclui traits expressos e cores obrigatórias", () => {
    const text = promptOf(genome());
    expect(text).toContain("BIPED");
    expect(text).toContain("compact fantasy biped");
    expect(text).toContain("stylized draconic head");
    expect(text).toContain("WARM_CORE_GLOW");
    expect(text).toContain("#D4513C");
    expect(text).toContain("FRIENDLY");
    expect(text).toContain("PLASMA");
    expect(text).toContain("BABY");
    expect(text).toContain(`Art bible version ${visualGenerationConfig.artBibleVersion}`);
    expect(text).toContain("Prompt version 5");
    expect(text).toContain("Original GENORYX fantasy creature collector");
    expect(text).toContain("Do not copy Axie Infinity");
  });

  it("turnaround trava identidade e não muda o geneticHash", () => {
    const row = genome();
    const hash = "abcd1234";
    const text = buildTurnaroundPrompt(visualSpecFromGenome("creature-a", row), "FRONT");
    expect(text).toContain("SECTION 13 TURNAROUND — FRONT");
    expect(text).toContain("Do not change horns, eyes, colors, tail, wings, pattern");
    expect(text).toContain("faces the camera");
    expect(hash).toBe("abcd1234");
    expect(text).not.toContain("ADMIN RECESSIVE");
  });

  it("não inclui genes recessivos por padrão", () => {
    const row = genome();
    const text = promptOf(row);
    expect(text).not.toContain("ADMIN RECESSIVE");
    expect(text).not.toContain(`head recessive ${row.headType.recessive}`);
    expect(text).not.toContain(`eyes recessive ${row.eyeType.recessive}`);
    expect(text).toContain("Do not display recessive traits");
    if (row.headType.expressed !== row.headType.recessive) {
      expect(text).not.toContain(headLexicon[row.headType.recessive]);
    }
    if (row.eyeType.expressed !== row.eyeType.recessive) {
      expect(text).not.toContain(eyeLexicon[row.eyeType.recessive]);
    }
  });

  it("modo admin explícito pode revelar recessivos", () => {
    const row = genome();
    const text = promptOf(row, true);
    expect(text).toContain("ADMIN RECESSIVE REVEAL");
    expect(text).toContain(`eyes recessive ${row.eyeType.recessive}`);
  });

  it("não interpreta nome de carta sem visualTag", () => {
    const text = promptOf(genome());
    expect(text).not.toContain("ember_strike");
    expect(text).not.toContain("Inferno Burst");
  });
});
