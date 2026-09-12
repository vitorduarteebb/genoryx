import "reflect-metadata";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { Element, InventoryCategory, ItemRarity, prisma } from "@nexora/database";
import { getCardDefinition } from "@nexora/config";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configure-app";

const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
const password = "correct-horse-1";

async function ensureCatalog() {
  await prisma.creatureSpecies.upsert({
    where: { key: "pyron" },
    update: {},
    create: {
      key: "pyron",
      name: "Pyron",
      elementPrimary: Element.FIRE,
      baseHp: 90,
      baseAtk: 120,
      baseDef: 80,
      baseMag: 85,
      baseRes: 75,
      baseSpd: 100,
      isStarter: true,
    },
  });
  await prisma.creatureSpecies.upsert({
    where: { key: "nympha" },
    update: {},
    create: {
      key: "nympha",
      name: "Nympha",
      elementPrimary: Element.WATER,
      baseHp: 100,
      baseAtk: 95,
      baseDef: 95,
      baseMag: 100,
      baseRes: 100,
      baseSpd: 95,
      isStarter: true,
    },
  });
  await prisma.creatureSpecies.upsert({
    where: { key: "terranox" },
    update: {},
    create: {
      key: "terranox",
      name: "Terranox",
      elementPrimary: Element.EARTH,
      baseHp: 130,
      baseAtk: 100,
      baseDef: 120,
      baseMag: 70,
      baseRes: 100,
      baseSpd: 70,
      isStarter: false,
    },
  });
  await prisma.creatureSpecies.upsert({
    where: { key: "florune" },
    update: {},
    create: {
      key: "florune",
      name: "Florune",
      elementPrimary: Element.NATURE,
      baseHp: 95,
      baseAtk: 80,
      baseDef: 85,
      baseMag: 110,
      baseRes: 115,
      baseSpd: 90,
      isStarter: true,
    },
  });
  for (const row of [
    { key: "nexorb", name: "NexOrb", category: InventoryCategory.CONSUMABLES },
    { key: "nexorb_plus", name: "NexOrb+", category: InventoryCategory.CONSUMABLES },
    { key: "nexorb_ultra", name: "NexOrb Ultra", category: InventoryCategory.CONSUMABLES },
    { key: "nexorb_ancient", name: "NexOrb Ancient", category: InventoryCategory.CONSUMABLES },
    { key: "tonic", name: "Tônico menor", category: InventoryCategory.CONSUMABLES },
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
  await prisma.quest.upsert({
    where: { key: "first-hunt" },
    update: {},
    create: { key: "first-hunt", name: "First Hunt", type: "CAPTURE" },
  });
}

describe("Alpha playable loop", () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    await ensureCatalog();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configureApp(moduleRef.createNestApplication());
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it("starter, 10 loci, shop ledger, wild battle, market transfer", async () => {
    const emailA = `loop-a-${suffix}@nexora.test`;
    const emailB = `loop-b-${suffix}@nexora.test`;

    await request(app.getHttpServer()).post("/auth/register").send({ email: emailA, password }).expect(201);
    await request(app.getHttpServer()).post("/auth/register").send({ email: emailB, password }).expect(201);
    const loginA = await request(app.getHttpServer()).post("/auth/login").send({ email: emailA, password }).expect(201);
    const loginB = await request(app.getHttpServer()).post("/auth/login").send({ email: emailB, password }).expect(201);
    const tokenA = loginA.body.accessToken as string;
    const tokenB = loginB.body.accessToken as string;

    await request(app.getHttpServer())
      .post("/characters")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ name: `AlphaA${suffix.slice(-5)}` })
      .expect(201);
    await request(app.getHttpServer())
      .post("/characters")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ name: `AlphaB${suffix.slice(-5)}` })
      .expect(201);

    const starter = await request(app.getHttpServer())
      .post("/creatures/starter")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ speciesKey: "pyron" })
      .expect(201);
    expect(starter.body.loci).toHaveLength(10);
    expect(starter.body.bodyPlan).toBe("QUADRUPED");

    const again = await request(app.getHttpServer())
      .post("/creatures/starter")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ speciesKey: "nympha" })
      .expect(409);
    expect(again.body.error.code).toBe("STARTER_ALREADY_CHOSEN");

    await request(app.getHttpServer())
      .post("/quests/first-spark/complete")
      .set("Authorization", `Bearer ${tokenA}`)
      .expect(201);

    const shop = await request(app.getHttpServer())
      .post("/shop/buy")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ itemKey: "nexorb", quantity: 1 })
      .expect(201);
    expect(shop.body.items.some((item: { key: string }) => item.key === "nexorb")).toBe(true);

    const userA = await prisma.user.findUniqueOrThrow({ where: { email: emailA }, include: { character: true } });
    await prisma.character.update({ where: { id: userA.character!.id }, data: { mapKey: "verdantis" } });

    const battle = await request(app.getHttpServer())
      .post("/battles/wild")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({})
      .expect(201);
    expect(battle.body.state.sides[0].hand.length).toBeGreaterThan(0);

    // No round 1 a energia e 1, e a mao e sorteada: pegar hand[0] as cegas quebrava o
    // teste sempre que a primeira carta custava 2, com "Energia insuficiente". Um cliente
    // de verdade tambem escolhe pelo custo.
    // Pegar hand[0] as cegas quebrava o teste sempre que a primeira carta custava mais
    // que a energia do round. Pior: no round 1 a energia e 1 e a mao inicial pode nao
    // trazer nenhuma carta de custo 1, entao o unico lance legal e passar o turno — que e
    // o que um cliente de verdade faz. Ver o TODO de balanceamento no ROADMAP.
    const playable = (view: { state: { sides: [{ hand: { instanceId: string; definitionKey: string }[]; energy: number }] } }) => {
      const side = view.state.sides[0];
      return side.hand.find((row) => (getCardDefinition(row.definitionKey)?.cost ?? 99) <= side.energy);
    };

    let current = battle.body;
    let card = playable(current);
    for (let turn = 0; !card && turn < 3; turn += 1) {
      const passed = await request(app.getHttpServer())
        .post(`/battles/${current.battleId}/actions`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ type: "END_TURN" })
        .expect(201);
      current = passed.body;
      if (current.state.status !== "ACTIVE") {
        break;
      }
      card = playable(current);
    }
    expect(card, "nenhuma carta jogavel em 4 rounds de energia crescente").toBeTruthy();

    const played = await request(app.getHttpServer())
      .post(`/battles/${current.battleId}/actions`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ type: "PLAY_CARD", cardInstanceId: card!.instanceId })
      .expect(201);
    expect(played.body.state.log.length).toBeGreaterThan(0);
    if (played.body.state.status === "ACTIVE") {
      await request(app.getHttpServer())
        .post(`/battles/${battle.body.battleId}/actions`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ type: "FLEE" })
        .expect(201);
    }

    await request(app.getHttpServer())
      .post("/creatures/starter")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ speciesKey: "florune" })
      .expect(201);
    const rosterB = await request(app.getHttpServer()).get("/creatures").set("Authorization", `Bearer ${tokenB}`).expect(200);
    expect(rosterB.body).toHaveLength(5);

    const listA = await request(app.getHttpServer()).get("/creatures").set("Authorization", `Bearer ${tokenA}`).expect(200);
    expect(listA.body).toHaveLength(5);
    expect(listA.body.some((row: { gender: string }) => row.gender === "MALE")).toBe(true);
    expect(listA.body.some((row: { gender: string }) => row.gender === "FEMALE")).toBe(true);
    const partyA = await request(app.getHttpServer()).get("/party").set("Authorization", `Bearer ${tokenA}`).expect(200);
    expect(partyA.body.creatures).toHaveLength(3);
    const chassisLooks = listA.body.map((row: { chassis?: { head?: { d?: string }; core?: { d?: string }; primaryColorId?: string } }) =>
      [row.chassis?.head?.d, row.chassis?.core?.d, row.chassis?.primaryColorId].join("/"),
    );
    expect(chassisLooks.every((row: string) => row !== "//")).toBe(true);
    expect(new Set(chassisLooks).size).toBe(5);
    const extraId = listA.body[0].id as string;
    const listed = await request(app.getHttpServer())
      .post("/market/listings")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ creatureId: extraId, priceGold: 50 })
      .expect(201);

    await request(app.getHttpServer())
      .post("/quests/first-spark/complete")
      .set("Authorization", `Bearer ${tokenB}`)
      .expect(201);

    const buy = await request(app.getHttpServer())
      .post(`/market/listings/${listed.body.id}/buy`)
      .set("Authorization", `Bearer ${tokenB}`)
      .expect(201);
    expect(buy.body.creatureId).toBe(extraId);

    const listB = await request(app.getHttpServer()).get("/creatures").set("Authorization", `Bearer ${tokenB}`).expect(200);
    expect(listB.body.some((row: { id: string }) => row.id === extraId)).toBe(true);
  });

  it("renomeia criatura do dono e recusa nome curto", async () => {
    const email = `rename-${suffix}@nexora.test`;
    await request(app.getHttpServer()).post("/auth/register").send({ email, password }).expect(201);
    const login = await request(app.getHttpServer()).post("/auth/login").send({ email, password }).expect(201);
    const token = login.body.accessToken as string;
    await request(app.getHttpServer())
      .post("/characters")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: `Ren${suffix.slice(-5)}` })
      .expect(201);
    await request(app.getHttpServer())
      .post("/creatures/starter")
      .set("Authorization", `Bearer ${token}`)
      .send({ speciesKey: "nympha" })
      .expect(201);
    const roster = await request(app.getHttpServer()).get("/creatures").set("Authorization", `Bearer ${token}`).expect(200);
    const creatureId = roster.body[0].id as string;
    expect(roster.body[0].phenotype.body).toBeTruthy();

    const bad = await request(app.getHttpServer())
      .patch(`/creatures/${creatureId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "ab" })
      .expect(400);
    expect(bad.body.error.code).toBe("VALIDATION_ERROR");

    const renamed = await request(app.getHttpServer())
      .patch(`/creatures/${creatureId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Maré" })
      .expect(200);
    expect(renamed.body.name).toBe("Maré");
    expect(renamed.body.speciesName).toBe("Nympha");

    const detail = await request(app.getHttpServer())
      .get(`/creatures/${creatureId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(detail.body.name).toBe("Maré");
  });
});
