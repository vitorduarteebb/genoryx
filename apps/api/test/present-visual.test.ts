import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assembleVisualGenome, visualSpecFromGenome } from "@nexora/game-engine";
import { describe, expect, it } from "vitest";
import { presentCreature, type CreatureRecord } from "../src/common/creature-io";
import { genesisPayloadHasNoSecrets, presentGenesisReveal } from "../src/common/creature-visual-present";
import { solidPng } from "../src/modules/creature-visuals/encode-png";
import { MockCreatureImageProvider } from "../src/modules/creature-visuals/providers/mock.provider";
import { LocalCreatureImageStore } from "../src/modules/creature-visuals/storage";

function fakeRow(overrides: Partial<CreatureRecord> = {}): CreatureRecord {
  return {
    id: "c-ready",
    species: { key: "pyron", name: "Pyron" },
    mutation: null,
    loci: [
      { locusKey: "G1", expressedCardKey: "ember", recessiveCardKey: "hidden-recessive" },
    ],
    visualAssets: [
      {
        lifeStage: "BABY",
        status: "READY",
        publicUrl: "/creature-visuals/asset-1/image",
        imageHash: "deadbeefdeadbeef",
      },
    ],
    name: "Pyron",
    genesisSeed: 7,
    gender: "MALE",
    level: 1,
    xp: 0,
    generation: 1,
    fertility: 5,
    origin: "STARTER",
    lock: "NONE",
    bodyPlanExpressed: "QUADRUPED",
    bodyPlanRecessive: "BIPED",
    headExpressed: "DRACONIC",
    headRecessive: "BEAST",
    elementPrimary: "FIRE",
    elementSecondary: null,
    geneticHash: "abcd1234",
    lifeStage: "BABY",
    temperament: "WILD",
    visualStatus: "READY",
    visualSeed: "seed",
    revealStatus: "REVEALED",
    hpGene: "C",
    attackGene: "C",
    defenseGene: "C",
    magicGene: "C",
    resistanceGene: "C",
    speedGene: "C",
    critGene: "C",
    evasionGene: "C",
    statusGene: "C",
    fatherId: null,
    motherId: null,
    breederId: null,
    birthDate: new Date(),
    geneticPurity: 0.5,
    visualGenomeJson: { auraType: { expressed: "NONE" } },
    ...overrides,
  } as unknown as CreatureRecord;
}

describe("presentCreature visual canônico", () => {
  it("READY do estágio atual devolve URL versionada", () => {
    const presented = presentCreature(fakeRow());
    expect(presented.visual.status).toBe("READY");
    expect(presented.visual.url).toContain("/creature-visuals/asset-1/image");
    expect(presented.visual.url).toContain("v=deadbeefdeadbeef");
    expect(presented.visual.imageHash).toBe("deadbeefdeadbeef");
    expect(presented.portraitUrl).toBe(presented.visual.url);
    expect(presented.physical).toEqual(
      expect.objectContaining({
        body: "QUADRUPED",
        head: "DRACONIC",
        aura: "NONE",
        temperament: "WILD",
      }),
    );
  });

  it("BABY não usa asset YOUNG", () => {
    const presented = presentCreature(
      fakeRow({
        visualAssets: [
          {
            lifeStage: "YOUNG",
            status: "READY",
            publicUrl: "/young.png",
            imageHash: "yyyy",
          },
        ] as CreatureRecord["visualAssets"],
      }),
    );
    expect(presented.visual.url).toBeNull();
    expect(presented.visual.source).toBe("legacy");
  });

  it("sem visual cai no fallback, sem URL quebrada", () => {
    const presented = presentCreature(fakeRow({ visualAssets: [] }));
    expect(presented.visual.url).toBeNull();
    expect(presented.visual.source).toBe("legacy");
  });

  it("OPENAI READY substitui MOCK READY na coleção", () => {
    const prevNode = process.env.NODE_ENV;
    const prevProvider = process.env.CREATURE_IMAGE_PROVIDER;
    process.env.NODE_ENV = "production";
    process.env.CREATURE_IMAGE_PROVIDER = "openai";
    try {
      const presented = presentCreature(
        fakeRow({
          visualAssets: [
            {
              lifeStage: "BABY",
              status: "READY",
              publicUrl: "/creature-visuals/mock/image",
              imageHash: "mockhashmockhash",
              provider: "MOCK",
            },
            {
              lifeStage: "BABY",
              status: "READY",
              publicUrl: "/creature-visuals/oa/image",
              imageHash: "openaihashopenai",
              provider: "OPENAI",
            },
          ] as CreatureRecord["visualAssets"],
        }),
      );
      expect(presented.visual.provider).toBe("OPENAI");
      expect(presented.visual.url).toContain("/creature-visuals/oa/image");
      expect(presented.geneticHash).toBe("abcd1234");
    } finally {
      process.env.NODE_ENV = prevNode;
      process.env.CREATURE_IMAGE_PROVIDER = prevProvider;
    }
  });

  it("PENDING_VISUAL esconde retrato, nome e recessivos", () => {
    const presented = presentCreature(fakeRow({ revealStatus: "PENDING_VISUAL" }));
    expect(presented.name).toBe("???");
    expect(presented.visual.url).toBeNull();
    expect(presented.loci).toEqual([]);
    expect(presented.geneticHash).toBeNull();
    expect(presented.physical).toBeNull();
    expect(JSON.stringify(presented)).not.toContain("hidden-recessive");
    expect(JSON.stringify(presented)).not.toContain("QUADRUPED");
  });
});

describe("presentGenesisReveal", () => {
  it("não inclui recessivos e não altera hashes", () => {
    const row = fakeRow({ revealStatus: "READY_TO_REVEAL", mutation: { key: "PLASMA" } as CreatureRecord["mutation"] });
    const payload = presentGenesisReveal(row);
    expect(genesisPayloadHasNoSecrets(payload)).toBe(true);
    expect(payload.visual.imageHash).toBe("deadbeefdeadbeef");
    expect(payload.mutation).toBe("PLASMA");
    expect(JSON.stringify(payload)).not.toContain("hidden-recessive");
  });

  it("Genesis com OpenAI habilitado não mostra MOCK", () => {
    const prevNode = process.env.NODE_ENV;
    const prevProvider = process.env.CREATURE_IMAGE_PROVIDER;
    process.env.NODE_ENV = "production";
    process.env.CREATURE_IMAGE_PROVIDER = "openai";
    try {
      const payload = presentGenesisReveal(
        fakeRow({
          revealStatus: "PENDING_VISUAL",
          visualAssets: [
            {
              lifeStage: "BABY",
              status: "READY",
              publicUrl: "/creature-visuals/mock/image",
              imageHash: "mockhashmockhash",
              provider: "MOCK",
            },
          ] as CreatureRecord["visualAssets"],
        }),
      );
      expect(payload.visual.url).toBeNull();
      expect(payload.visual.status).not.toBe("READY");
    } finally {
      process.env.NODE_ENV = prevNode;
      process.env.CREATURE_IMAGE_PROVIDER = prevProvider;
    }
  });
});

describe("mock PNG e storage persistente", () => {
  it("mock gera PNG válido", async () => {
    const genome = assembleVisualGenome({
      creatureId: "png",
      speciesKey: "pyron",
      bodyPlanExpressed: "BIPED",
      bodyPlanRecessive: "QUADRUPED",
      headExpressed: "DRACONIC",
      headRecessive: "BEAST",
      geneticHash: "hash",
      genesisSeed: 1,
      lifeStage: "BABY",
    });
    const spec = visualSpecFromGenome("png", genome);
    const png = await new MockCreatureImageProvider().generateInitialCreature(spec, "p");
    expect(png.bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(true);
  });

  it("arquivo sobrevive a nova instância do store", async () => {
    const dir = await mkdtemp(join(tmpdir(), "genesis-store-"));
    try {
      const bytes = solidPng(8, 8, [200, 40, 20]);
      const a = new LocalCreatureImageStore(dir);
      await a.put("c1/BABY/k.png", bytes);
      const b = new LocalCreatureImageStore(dir);
      expect(await b.exists("c1/BABY/k.png")).toBe(true);
      expect(await b.isValidPng("c1/BABY/k.png")).toBe(true);
      expect((await b.get("c1/BABY/k.png")).equals(bytes)).toBe(true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
