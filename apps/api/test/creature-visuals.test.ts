import { visualGenerationConfig } from "@nexora/config";
import { assembleVisualGenome, buildCreatureImagePrompt, visualSpecFromGenome } from "@nexora/game-engine";
import { describe, expect, it } from "vitest";
import { buildGenerationKey, imageHashFromBytes } from "../src/modules/creature-visuals/generation-key";
import { qaAccepted } from "../src/modules/creature-visuals/qa";
import { needsOpenAiVisual, pickProofCreatures } from "../src/modules/creature-visuals/openai-backfill";
import { MockCreatureImageProvider } from "../src/modules/creature-visuals/providers/mock.provider";
import { sanitizeOpenAiError } from "../src/modules/creature-visuals/providers/openai.provider";

describe("generationKey", () => {
  it("é idempotente para o mesmo indivíduo e estágio", () => {
    const a = buildGenerationKey({
      creatureId: "c1",
      lifeStage: "BABY",
      modelVersion: visualGenerationConfig.productionSnapshot,
    });
    const b = buildGenerationKey({
      creatureId: "c1",
      lifeStage: "BABY",
      modelVersion: visualGenerationConfig.productionSnapshot,
    });
    expect(a).toBe(b);
  });

  it("estágio diferente não reutiliza a chave", () => {
    const baby = buildGenerationKey({ creatureId: "c1", lifeStage: "BABY", modelVersion: "m" });
    const young = buildGenerationKey({ creatureId: "c1", lifeStage: "YOUNG", modelVersion: "m" });
    expect(baby).not.toBe(young);
  });

  it("MOCK e OPENAI não colidem", () => {
    const mock = buildGenerationKey({
      creatureId: "c1",
      lifeStage: "BABY",
      geneticHash: "abc",
      visualSeed: "seed",
      provider: "MOCK",
      modelVersion: "mock",
    });
    const openai = buildGenerationKey({
      creatureId: "c1",
      lifeStage: "BABY",
      geneticHash: "abc",
      visualSeed: "seed",
      provider: "OPENAI",
      modelVersion: visualGenerationConfig.productionSnapshot,
    });
    expect(mock).not.toBe(openai);
  });

  it("geneticHash e visualSeed entram na chave sem alterar o DNA", () => {
    const hash = "deadbeef";
    const seed = "visual-1";
    buildGenerationKey({
      creatureId: "c1",
      lifeStage: "BABY",
      geneticHash: hash,
      visualSeed: seed,
      provider: "OPENAI",
      modelVersion: "m",
    });
    expect(hash).toBe("deadbeef");
    expect(seed).toBe("visual-1");
  });
});

describe("imageHash e QA", () => {
  it("imageHash muda com o arquivo, não com o DNA", () => {
    expect(imageHashFromBytes(Buffer.from("a"))).not.toBe(imageHashFromBytes(Buffer.from("b")));
  });

  it("recusa QA abaixo do limiar ou com erro crítico", () => {
    expect(
      qaAccepted({
        bodyPlanMatch: true,
        headMatch: true,
        eyeMatch: true,
        hornMatch: true,
        limbsMatch: true,
        tailMatch: true,
        backMatch: true,
        patternMatch: true,
        colorsMatch: true,
        temperamentMatch: true,
        mutationMatch: true,
        lifeStageMatch: true,
        extraUnexpectedTraits: [],
        missingTraits: [],
        overallScore: 0.89,
        criticalErrors: [],
      }),
    ).toBe(false);
    expect(
      qaAccepted({
        bodyPlanMatch: false,
        headMatch: true,
        eyeMatch: true,
        hornMatch: true,
        limbsMatch: true,
        tailMatch: true,
        backMatch: true,
        patternMatch: true,
        colorsMatch: true,
        temperamentMatch: true,
        mutationMatch: true,
        lifeStageMatch: true,
        extraUnexpectedTraits: [],
        missingTraits: [],
        overallScore: 0.99,
        criticalErrors: ["wrong body plan"],
      }),
    ).toBe(false);
  });
});

describe("MockCreatureImageProvider", () => {
  it("gera placeholder sem chamar OpenAI e o evolve usa referência", async () => {
    const provider = new MockCreatureImageProvider();
    const genome = assembleVisualGenome({
      creatureId: "proof-a",
      speciesKey: "pyron",
      bodyPlanExpressed: "BIPED",
      bodyPlanRecessive: "QUADRUPED",
      headExpressed: "DRACONIC",
      headRecessive: "BEAST",
      geneticHash: "deadbeef",
      genesisSeed: 7,
      lifeStage: "BABY",
      temperament: "FRIENDLY",
    });
    const spec = visualSpecFromGenome("proof-a", genome);
    const prompt = buildCreatureImagePrompt(spec);
    const baby = await provider.generateInitialCreature(spec, prompt);
    const young = await provider.evolveCreatureVisual({ ...spec, lifeStage: "YOUNG" }, prompt, [baby.bytes]);
    expect(baby.model).toBe("mock");
    expect(young.bytes.equals(baby.bytes)).toBe(false);
    const qa = await provider.validateCreatureVisual(spec, baby.bytes);
    expect(qaAccepted(qa)).toBe(true);
  });
});

describe("backfill OpenAI", () => {
  it("MOCK READY não impede gerar OpenAI", () => {
    expect(
      needsOpenAiVisual({
        id: "c1",
        lifeStage: "BABY",
        temperament: "FERAL",
        name: "florune",
        geneticHash: "e85b6a94abcd",
        species: { key: "florune" },
        visualAssets: [{ lifeStage: "BABY", status: "READY", provider: "MOCK" }],
      }),
    ).toBe(true);
    expect(
      needsOpenAiVisual({
        id: "c1",
        lifeStage: "BABY",
        temperament: "FERAL",
        name: "florune",
        geneticHash: "e85b6a94abcd",
        species: { key: "florune" },
        visualAssets: [{ lifeStage: "BABY", status: "READY", provider: "OPENAI" }],
      }),
    ).toBe(false);
  });

  it("prova escolhe 1 de cada espécie e prefere Florune FERAL BABY", () => {
    const picked = pickProofCreatures([
      {
        id: "p1",
        lifeStage: "BABY",
        temperament: "WILD",
        name: "pyron",
        geneticHash: "aa",
        species: { key: "pyron" },
        visualAssets: [{ lifeStage: "BABY", status: "READY", provider: "MOCK" }],
      },
      {
        id: "n1",
        lifeStage: "BABY",
        temperament: "FRIENDLY",
        name: "nympha",
        geneticHash: "bb",
        species: { key: "nympha" },
        visualAssets: [{ lifeStage: "BABY", status: "READY", provider: "MOCK" }],
      },
      {
        id: "f-soft",
        lifeStage: "BABY",
        temperament: "FRIENDLY",
        name: "flor",
        geneticHash: "cc",
        species: { key: "florune" },
        visualAssets: [{ lifeStage: "BABY", status: "READY", provider: "MOCK" }],
      },
      {
        id: "f-feral",
        lifeStage: "BABY",
        temperament: "FERAL",
        name: "florune",
        geneticHash: "e85b6a94ffff",
        species: { key: "florune" },
        visualAssets: [{ lifeStage: "BABY", status: "READY", provider: "MOCK" }],
      },
    ]);
    expect(picked.map((row) => row.id)).toEqual(["p1", "n1", "f-feral"]);
  });

  it("não vaza chave em erro OpenAI", () => {
    expect(sanitizeOpenAiError("Incorrect API key provided: sk-proj-ABC123_def")).toBe(
      "Incorrect API key provided: sk-***",
    );
  });
});
