import "reflect-metadata";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { Element, InventoryCategory, ItemRarity, prisma } from "@nexora/database";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configure-app";
import { CreatureVisualsService } from "../src/modules/creature-visuals/creature-visuals.service";

const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
const password = "correct-horse-1";

async function ensureCatalog() {
  for (const row of [
    { key: "pyron", name: "Pyron", elementPrimary: Element.FIRE, isStarter: true },
    { key: "nympha", name: "Nympha", elementPrimary: Element.WATER, isStarter: true },
    { key: "florune", name: "Florune", elementPrimary: Element.NATURE, isStarter: true },
  ]) {
    await prisma.creatureSpecies.upsert({
      where: { key: row.key },
      update: {},
      create: {
        ...row,
        baseHp: 90,
        baseAtk: 100,
        baseDef: 80,
        baseMag: 80,
        baseRes: 80,
        baseSpd: 90,
      },
    });
  }
  for (const row of [
    { key: "nexorb", name: "NexOrb", category: InventoryCategory.CONSUMABLES },
    { key: "nexorb_plus", name: "NexOrb+", category: InventoryCategory.CONSUMABLES },
    { key: "genome_catalyst", name: "Genome Catalyst", category: InventoryCategory.MATERIALS },
  ]) {
    await prisma.itemTemplate.upsert({
      where: { key: row.key },
      update: {},
      create: { ...row, rarity: ItemRarity.COMMON, stackable: true },
    });
  }
  await prisma.quest.upsert({
    where: { key: "first-spark" },
    update: {},
    create: { key: "first-spark", name: "First Spark", type: "TUTORIAL" },
  });
}

describe("Genesis reveal + visual canônico", () => {
  let app: INestApplication;
  let visuals: CreatureVisualsService;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.CREATURE_IMAGE_PROVIDER = "mock";
    await ensureCatalog();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configureApp(moduleRef.createNestApplication());
    await app.init();
    visuals = app.get(CreatureVisualsService);
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it("hatch espera reveal, não muda DNA e recusa market", async () => {
    const email = `genesis-${suffix}@nexora.test`;
    await request(app.getHttpServer()).post("/auth/register").send({ email, password }).expect(201);
    const login = await request(app.getHttpServer()).post("/auth/login").send({ email, password }).expect(201);
    const token = login.body.accessToken as string;
    await request(app.getHttpServer())
      .post("/characters")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: `Gen${suffix.slice(-5)}` })
      .expect(201);
    await request(app.getHttpServer())
      .post("/creatures/starter")
      .set("Authorization", `Bearer ${token}`)
      .send({ speciesKey: "pyron" })
      .expect(201);
    await request(app.getHttpServer())
      .post("/quests/first-spark/complete")
      .set("Authorization", `Bearer ${token}`)
      .expect(201);

    const roster = await request(app.getHttpServer()).get("/creatures").set("Authorization", `Bearer ${token}`).expect(200);
    const revealed = roster.body.find((row: { visual?: { status: string } }) => row.visual?.status === "READY" || row.revealStatus === "NOT_REQUIRED");
    if (revealed?.visual?.url) {
      expect(revealed.visual.url).toContain("/creature-visuals/");
    }
    const father = roster.body.find((row: { gender: string }) => row.gender === "MALE");
    const mother = roster.body.find((row: { gender: string }) => row.gender === "FEMALE");
    expect(father && mother).toBeTruthy();

    await request(app.getHttpServer())
      .post("/breeding")
      .set("Authorization", `Bearer ${token}`)
      .send({ parentAId: father.id, parentBId: mother.id })
      .expect(201);
    const eggs = await request(app.getHttpServer()).get("/eggs").set("Authorization", `Bearer ${token}`).expect(200);
    const egg = eggs.body[0];
    await prisma.egg.update({ where: { id: egg.id }, data: { hatchesAt: new Date(Date.now() - 1000) } });

    const hatch = await request(app.getHttpServer())
      .post(`/eggs/${egg.id}/hatch`)
      .set("Authorization", `Bearer ${token}`)
      .expect(201);
    expect(hatch.body.status).toBe("AWAITING_GENESIS_REVEAL");
    expect(hatch.body.revealStatus).toBe("PENDING_VISUAL");
    expect(hatch.body.visual.url).toBeNull();

    const bornId = hatch.body.creatureId as string;
    const before = await prisma.creature.findUniqueOrThrow({ where: { id: bornId } });
    expect(before.revealStatus).toBe("PENDING_VISUAL");

    const hidden = await request(app.getHttpServer()).get("/creatures").set("Authorization", `Bearer ${token}`).expect(200);
    const secret = hidden.body.find((row: { id: string }) => row.id === bornId);
    expect(secret.name).toBe("???");
    expect(secret.visual.url).toBeNull();

    const market = await request(app.getHttpServer())
      .post("/market/listings")
      .set("Authorization", `Bearer ${token}`)
      .send({ creatureId: bornId, priceGold: 50 })
      .expect(400);
    expect(market.body.error.message).toMatch(/Revele/);

    const firstBackfill = await visuals.backfillMissing(8);
    const secondBackfill = await visuals.backfillMissing(8);
    const createdTwice = secondBackfill.jobs.filter((job) => job.created && job.creatureId === bornId);
    expect(createdTwice).toHaveLength(0);

    const pendingAssets = await prisma.creatureVisualAsset.findMany({ where: { creatureId: bornId } });
    for (const asset of pendingAssets) {
      await visuals.processAsset(asset.id);
    }
    const afterVisual = await prisma.creature.findUniqueOrThrow({
      where: { id: bornId },
      include: { visualAssets: true },
    });
    expect(afterVisual.geneticHash).toBe(before.geneticHash);
    expect(afterVisual.revealStatus).toBe("READY_TO_REVEAL");
    const readyAsset = afterVisual.visualAssets.find((row) => row.lifeStage === afterVisual.lifeStage && row.status === "READY");
    expect(readyAsset?.imageHash).toBeTruthy();

    const genesis = await request(app.getHttpServer())
      .get(`/creatures/${bornId}/genesis`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(genesis.body.visual.url).toBeTruthy();
    expect(JSON.stringify(genesis.body)).not.toMatch(/recessive/i);

    const queue = await request(app.getHttpServer())
      .get("/creatures/genesis-queue")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(queue.body.items.some((row: { creatureId: string }) => row.creatureId === bornId)).toBe(true);

    const revealedBorn = await request(app.getHttpServer())
      .post(`/creatures/${bornId}/reveal`)
      .set("Authorization", `Bearer ${token}`)
      .expect(201);
    expect(revealedBorn.body.revealStatus).toBe("REVEALED");
    expect(revealedBorn.body.geneticHash).toBe(before.geneticHash);
    expect(revealedBorn.body.imageHash).toBe(readyAsset?.imageHash);
    expect(revealedBorn.body.visual.url).toContain("v=");

    const afterReveal = await prisma.creature.findUniqueOrThrow({ where: { id: bornId } });
    expect(afterReveal.geneticHash).toBe(before.geneticHash);
    expect(afterReveal.visualGenomeJson).toEqual(before.visualGenomeJson);

    const queueAfter = await request(app.getHttpServer())
      .get("/creatures/genesis-queue")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(queueAfter.body.items.some((row: { creatureId: string }) => row.creatureId === bornId)).toBe(false);
  });
});
