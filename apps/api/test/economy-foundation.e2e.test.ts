import "reflect-metadata";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { economySystemEmail } from "@nexora/config";
import { Element, InventoryCategory, ItemRarity, prisma } from "@nexora/database";
import { createSeededRandom, seedFromParts } from "@nexora/game-engine";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configure-app";

const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
const password = "correct-horse-1";

type LedgerRow = {
  source: string;
  type: string;
  amount: bigint;
  referenceId: string | null;
};

async function ensureCatalog() {
  for (const row of [
    { key: "pyron", name: "Pyron", elementPrimary: Element.FIRE, baseHp: 90, baseAtk: 120, baseDef: 80, baseMag: 85, baseRes: 75, baseSpd: 100, isStarter: true },
    { key: "nympha", name: "Nympha", elementPrimary: Element.WATER, baseHp: 100, baseAtk: 95, baseDef: 95, baseMag: 100, baseRes: 100, baseSpd: 95, isStarter: true },
    { key: "florune", name: "Florune", elementPrimary: Element.NATURE, baseHp: 95, baseAtk: 80, baseDef: 85, baseMag: 110, baseRes: 115, baseSpd: 90, isStarter: true },
  ]) {
    await prisma.creatureSpecies.upsert({
      where: { key: row.key },
      update: {},
      create: row,
    });
  }
  for (const row of [
    { key: "nexorb", name: "NexOrb", category: InventoryCategory.CONSUMABLES },
    { key: "nexorb_plus", name: "NexOrb+", category: InventoryCategory.CONSUMABLES },
    { key: "nexorb_ultra", name: "NexOrb Ultra", category: InventoryCategory.CONSUMABLES },
    { key: "nexorb_ancient", name: "NexOrb Ancient", category: InventoryCategory.CONSUMABLES },
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
  await prisma.user.upsert({
    where: { email: economySystemEmail },
    update: {},
    create: {
      email: economySystemEmail,
      passwordHash: "SYSTEM_NO_LOGIN",
      wallets: { create: [{ currency: "GOLD", balance: 0n }, { currency: "NEX", balance: 0n }] },
    },
  });
}

async function registerPlay(app: INestApplication, email: string, name: string) {
  await request(app.getHttpServer()).post("/auth/register").send({ email, password }).expect(201);
  const login = await request(app.getHttpServer()).post("/auth/login").send({ email, password }).expect(201);
  const token = login.body.accessToken as string;
  await request(app.getHttpServer()).post("/characters").set("Authorization", `Bearer ${token}`).send({ name }).expect(201);
  return token;
}

async function goldOf(userId: string) {
  const wallet = await prisma.wallet.findUniqueOrThrow({
    where: { userId_currency: { userId, currency: "GOLD" } },
  });
  return wallet.balance;
}

async function ledgerOf(userId: string): Promise<LedgerRow[]> {
  return prisma.currencyTransaction.findMany({
    where: { userId, currency: "GOLD" },
    orderBy: { createdAt: "asc" },
  });
}

function sumLedger(rows: LedgerRow[]) {
  return rows.reduce((acc, row) => acc + row.amount, 0n);
}

async function winWild(app: INestApplication, token: string) {
  const started = await request(app.getHttpServer()).post("/battles/wild").set("Authorization", `Bearer ${token}`).send({}).expect(201);
  const battleId = started.body.battleId as string;
  const row = await prisma.battle.findUniqueOrThrow({ where: { id: battleId } });
  const state = row.stateJson as {
    sides: Array<{ creatures: Array<{ hp: number }>; hand: Array<{ instanceId: string }> }>;
    status: string;
    winnerSide: number | null;
    activeSide: number;
  };
  for (const unit of state.sides[1]?.creatures ?? []) {
    unit.hp = 1;
  }
  await prisma.battle.update({ where: { id: battleId }, data: { stateJson: state as object } });

  let view = started.body;
  for (let step = 0; step < 24; step += 1) {
    if (view.state.status !== "ACTIVE") {
      break;
    }
    const hand = view.state.sides[0].hand as Array<{ instanceId: string }>;
    const action = hand[0]
      ? { type: "PLAY_CARD", cardInstanceId: hand[0].instanceId }
      : { type: "END_TURN" };
    const played = await request(app.getHttpServer())
      .post(`/battles/${battleId}/actions`)
      .set("Authorization", `Bearer ${token}`)
      .send(action);
    if (played.status !== 201) {
      const end = await request(app.getHttpServer())
        .post(`/battles/${battleId}/actions`)
        .set("Authorization", `Bearer ${token}`)
        .send({ type: "END_TURN" });
      if (end.status !== 201) {
        break;
      }
      view = end.body;
      continue;
    }
    view = played.body;
  }
  return { battleId, state: view.state as { status: string; winnerSide: number | null } };
}

describe("Economy Foundation V2", () => {
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

  it("prova GOLD: tutorial, PvE, shop, catalyst, breed, market sink", async () => {
    await prisma.currencyTransaction.deleteMany({
      where: { source: "PVE_REWARD", referenceId: { startsWith: "budget-" } },
    });
    const emailA = `eco-a-${suffix}@nexora.test`;
    const emailB = `eco-b-${suffix}@nexora.test`;
    const tokenA = await registerPlay(app, emailA, `EcoA${suffix.slice(-5)}`);
    const tokenB = await registerPlay(app, emailB, `EcoB${suffix.slice(-5)}`);
    const userA = await prisma.user.findUniqueOrThrow({ where: { email: emailA }, include: { character: true } });
    const userB = await prisma.user.findUniqueOrThrow({ where: { email: emailB }, include: { character: true } });

    expect(await goldOf(userA.id)).toBe(0n);
    const nex = await prisma.wallet.findUniqueOrThrow({
      where: { userId_currency: { userId: userA.id, currency: "NEX" } },
    });
    expect(nex.balance).toBe(0n);

    await request(app.getHttpServer())
      .post("/creatures/starter")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ speciesKey: "pyron" })
      .expect(201);
    expect(await goldOf(userA.id)).toBe(0n);

    const tutorial = await request(app.getHttpServer())
      .post("/quests/first-spark/complete")
      .set("Authorization", `Bearer ${tokenA}`)
      .expect(201);
    expect(tutorial.body.gold).toBe(300);
    expect(await goldOf(userA.id)).toBe(300n);

    const again = await request(app.getHttpServer())
      .post("/quests/first-spark/complete")
      .set("Authorization", `Bearer ${tokenA}`)
      .expect(201);
    expect(again.body.alreadyClaimed).toBe(true);
    expect(await goldOf(userA.id)).toBe(300n);

    const forbidden = await request(app.getHttpServer())
      .post("/shop/buy")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ itemKey: "nexorb", quantity: 1, gold: 9999 });
    expect(forbidden.status).toBe(400);

    await request(app.getHttpServer()).post("/wallets/credit").set("Authorization", `Bearer ${tokenA}`).send({ gold: 50 }).expect(404);

    await request(app.getHttpServer())
      .post("/creatures/starter")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ speciesKey: "florune" })
      .expect(201);

    const asPlayer = await request(app.getHttpServer())
      .post("/admin/economy/adjust")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ userId: userB.id, amount: 1000, currency: "GOLD", reason: "buyer" });
    expect(asPlayer.status).toBe(403);

    await prisma.user.update({ where: { id: userB.id }, data: { role: "ADMIN" } });
    const loginAdmin = await request(app.getHttpServer()).post("/auth/login").send({ email: emailB, password }).expect(201);
    const adminToken = loginAdmin.body.accessToken as string;
    await request(app.getHttpServer())
      .post("/admin/economy/adjust")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ userId: userB.id, amount: 1000, currency: "NEX", reason: "não emitir" })
      .expect(400);
    await request(app.getHttpServer())
      .post("/admin/economy/adjust")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ userId: userB.id, amount: 1000, currency: "GOLD", reason: "e2e buyer funding" })
      .expect(201);
    expect(await goldOf(userB.id)).toBe(1000n);

    await prisma.character.update({ where: { id: userA.character!.id }, data: { mapKey: "verdantis" } });
    const pve = await winWild(app, tokenA);
    expect(pve.state.status).toBe("FINISHED");
    expect(pve.state.winnerSide).toBe(0);

    const pveTx = await prisma.currencyTransaction.findFirst({
      where: { userId: userA.id, source: "PVE_REWARD", referenceId: pve.battleId },
    });
    expect(pveTx).toBeTruthy();
    const pveGold = pveTx!.amount;
    expect(pveGold).toBeGreaterThanOrEqual(12n);
    expect(pveGold).toBeLessThanOrEqual(25n);
    expect(await goldOf(userA.id)).toBe(300n + pveGold);

    const replay = await request(app.getHttpServer())
      .post(`/battles/${pve.battleId}/actions`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ type: "END_TURN" });
    expect(replay.status).toBe(400);
    const pveCount = await prisma.currencyTransaction.count({
      where: { userId: userA.id, source: "PVE_REWARD", referenceId: pve.battleId },
    });
    expect(pveCount).toBe(1);
    expect(await goldOf(userA.id)).toBe(300n + pveGold);

    await request(app.getHttpServer())
      .post("/shop/buy")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ itemKey: "nexorb", quantity: 1 })
      .expect(201);
    expect(await goldOf(userA.id)).toBe(260n + pveGold);

    const inv = await request(app.getHttpServer()).get("/inventory").set("Authorization", `Bearer ${tokenA}`).expect(200);
    const catalyst = inv.body.items.find((item: { key: string }) => item.key === "genome_catalyst");
    expect(catalyst?.quantity).toBeGreaterThanOrEqual(1);

    const roster = await request(app.getHttpServer()).get("/creatures").set("Authorization", `Bearer ${tokenA}`).expect(200);
    const father = roster.body.find((row: { gender: string }) => row.gender === "MALE");
    const mother = roster.body.find((row: { gender: string }) => row.gender === "FEMALE");
    expect(father && mother).toBeTruthy();

    const preview = await request(app.getHttpServer())
      .post("/breeding/preview")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ parentAId: father.id, parentBId: mother.id })
      .expect(201);
    expect(preview.body.costGold).toBe("250");
    expect(preview.body.catalystRequired).toBe(1);

    const noGoldBreed = await registerPlay(app, `eco-broke-${suffix}@nexora.test`, `EcoZ${suffix.slice(-5)}`);
    await request(app.getHttpServer())
      .post("/creatures/starter")
      .set("Authorization", `Bearer ${noGoldBreed}`)
      .send({ speciesKey: "nympha" })
      .expect(201);
    await request(app.getHttpServer())
      .post("/quests/first-spark/complete")
      .set("Authorization", `Bearer ${noGoldBreed}`)
      .expect(201);
    const brokeUser = await prisma.user.findUniqueOrThrow({
      where: { email: `eco-broke-${suffix}@nexora.test` },
      include: { character: true },
    });
    await prisma.inventorySlot.deleteMany({
      where: { characterId: brokeUser.character!.id, item: { template: { key: "genome_catalyst" } } },
    });
    const brokeRoster = await request(app.getHttpServer()).get("/creatures").set("Authorization", `Bearer ${noGoldBreed}`).expect(200);
    const brokeFather = brokeRoster.body.find((row: { gender: string }) => row.gender === "MALE");
    const brokeMother = brokeRoster.body.find((row: { gender: string }) => row.gender === "FEMALE");
    const failedBreed = await request(app.getHttpServer())
      .post("/breeding")
      .set("Authorization", `Bearer ${noGoldBreed}`)
      .send({ parentAId: brokeFather.id, parentBId: brokeMother.id });
    expect(failedBreed.status).toBe(409);
    expect(failedBreed.body.error.code).toBe("INSUFFICIENT_ITEMS");
    expect(await goldOf(brokeUser.id)).toBe(300n);
    expect((await prisma.creature.findUniqueOrThrow({ where: { id: brokeFather.id } })).fertility).toBe(5);

    const bred = await request(app.getHttpServer())
      .post("/breeding")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ parentAId: father.id, parentBId: mother.id })
      .expect(201);
    expect(bred.body.costGold).toBe("250");
    expect(await goldOf(userA.id)).toBe(10n + pveGold);
    expect((await prisma.creature.findUniqueOrThrow({ where: { id: father.id } })).fertility).toBe(4);
    expect((await prisma.creature.findUniqueOrThrow({ where: { id: mother.id } })).fertility).toBe(4);
    const afterInv = await request(app.getHttpServer()).get("/inventory").set("Authorization", `Bearer ${tokenA}`).expect(200);
    const catalystLeft = afterInv.body.items.find((item: { key: string }) => item.key === "genome_catalyst");
    expect((catalystLeft?.quantity ?? 0) < catalyst.quantity || !catalystLeft).toBe(true);

    await prisma.egg.update({
      where: { id: bred.body.eggId },
      data: { hatchesAt: new Date(Date.now() - 1000) },
    });
    const hatched = await request(app.getHttpServer())
      .post(`/eggs/${bred.body.eggId}/hatch`)
      .set("Authorization", `Bearer ${tokenA}`)
      .expect(201);
    const childId = hatched.body.creatureId as string;
    await prisma.creature.update({ where: { id: childId }, data: { revealStatus: "REVEALED", lock: "NONE" } });

    const listed = await request(app.getHttpServer())
      .post("/market/listings")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ creatureId: childId, priceGold: 1000 })
      .expect(201);
    expect(listed.body.listingFeeGold).toBe("10");
    expect(await goldOf(userA.id)).toBe(pveGold);

    const emptyBuy = await request(app.getHttpServer())
      .post(`/market/listings/${listed.body.id}/buy`)
      .set("Authorization", `Bearer ${noGoldBreed}`);
    expect(emptyBuy.status).toBe(409);
    expect((await prisma.creature.findUniqueOrThrow({ where: { id: childId } })).ownerCharacterId).toBe(userA.character!.id);
    expect((await prisma.marketListing.findUniqueOrThrow({ where: { id: listed.body.id } })).status).toBe("ACTIVE");

    await request(app.getHttpServer())
      .post(`/market/listings/${listed.body.id}/buy`)
      .set("Authorization", `Bearer ${tokenB}`)
      .expect(201);

    expect(await goldOf(userB.id)).toBe(0n);
    expect(await goldOf(userA.id)).toBe(950n + pveGold);
    expect((await prisma.creature.findUniqueOrThrow({ where: { id: childId } })).ownerCharacterId).toBe(userB.character!.id);

    const system = await prisma.user.findUniqueOrThrow({ where: { email: economySystemEmail } });
    const listingId = listed.body.id as string;
    const sinkRows = await prisma.currencyTransaction.findMany({
      where: {
        userId: system.id,
        source: "SYSTEM_SINK",
        referenceId: { in: [`list:${listingId}`, `sale:${listingId}`] },
      },
    });
    expect(sinkRows.map((row) => row.amount).sort((a, b) => (a < b ? -1 : 1))).toEqual([10n, 50n]);
    expect(sinkRows.reduce((acc, row) => acc + row.amount, 0n)).toBe(60n);

    const ledA = await ledgerOf(userA.id);
    expect(sumLedger(ledA)).toBe(await goldOf(userA.id));
    expect(ledA.map((row) => ({ source: row.source, amount: row.amount.toString() }))).toEqual(
      expect.arrayContaining([
        { source: "QUEST_REWARD", amount: "300" },
        { source: "PVE_REWARD", amount: pveGold.toString() },
        { source: "SHOP_PURCHASE", amount: "-40" },
        { source: "BREEDING_COST", amount: "-250" },
        { source: "MARKET_LISTING_FEE", amount: "-10" },
        { source: "MARKET_SALE", amount: "950" },
      ]),
    );

    const ledB = await ledgerOf(userB.id);
    expect(sumLedger(ledB)).toBe(0n);
    expect(ledB.some((row) => row.source === "ADMIN_ADJUSTMENT" && row.amount === 1000n)).toBe(true);
    expect(ledB.some((row) => row.source === "MARKET_SALE" && row.amount === -1000n)).toBe(true);

    expect(sinkRows).toHaveLength(2);

    const adminLog = await prisma.adminActionLog.findFirst({
      where: { targetId: userB.id, action: "GOLD_ADJUSTMENT" },
    });
    expect(adminLog?.reason).toBe("e2e buyer funding");

    const dash = await request(app.getHttpServer())
      .get("/admin/economy/dashboard?window=24h")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(dash.body.nex.emission).toBe(0);
    expect(Number(dash.body.breedCount)).toBeGreaterThanOrEqual(1);

    const rng = createSeededRandom(seedFromParts([pve.battleId, "pve-gold"]));
    const predicted = rng.nextInt(12, 25);
    expect(pveGold).toBe(BigInt(predicted));
  });

  it("budget diário corta Gold e mantém XP; PvP casual não minta", async () => {
    const email = `eco-bud-${suffix}@nexora.test`;
    const emailR = `eco-pvp-${suffix}@nexora.test`;
    const token = await registerPlay(app, email, `EcoC${suffix.slice(-5)}`);
    const tokenR = await registerPlay(app, emailR, `EcoD${suffix.slice(-5)}`);
    await request(app.getHttpServer()).post("/creatures/starter").set("Authorization", `Bearer ${token}`).send({ speciesKey: "pyron" }).expect(201);
    await request(app.getHttpServer()).post("/creatures/starter").set("Authorization", `Bearer ${tokenR}`).send({ speciesKey: "florune" }).expect(201);
    const user = await prisma.user.findUniqueOrThrow({ where: { email }, include: { character: true } });
    const rival = await prisma.user.findUniqueOrThrow({ where: { email: emailR }, include: { character: true } });
    await prisma.character.update({ where: { id: user.character!.id }, data: { mapKey: "verdantis" } });

    await prisma.currencyTransaction.create({
      data: {
        userId: user.id,
        currency: "GOLD",
        amount: 800n,
        type: "CREDIT",
        source: "PVE_REWARD",
        referenceId: `budget-${suffix}`,
        balanceBefore: 0n,
        balanceAfter: 0n,
      },
    });

    const xpBefore = (await prisma.character.findUniqueOrThrow({ where: { id: user.character!.id } })).xp;
    const goldBefore = await goldOf(user.id);
    const pve = await winWild(app, token);
    expect(pve.state.winnerSide).toBe(0);
    const reward = await prisma.currencyTransaction.findFirst({
      where: { userId: user.id, source: "PVE_REWARD", referenceId: pve.battleId },
    });
    expect(reward).toBeNull();
    expect(await goldOf(user.id)).toBe(goldBefore);
    const xpAfter = (await prisma.character.findUniqueOrThrow({ where: { id: user.character!.id } })).xp;
    expect(xpAfter).toBeGreaterThan(xpBefore);

    const goldA = await goldOf(user.id);
    const goldB = await goldOf(rival.id);
    await request(app.getHttpServer()).post("/pvp/queue").set("Authorization", `Bearer ${token}`).expect(201);
    await request(app.getHttpServer()).post("/pvp/queue").set("Authorization", `Bearer ${tokenR}`).expect(201);
    expect(await goldOf(user.id)).toBe(goldA);
    expect(await goldOf(rival.id)).toBe(goldB);
    const pvpRewards = await prisma.currencyTransaction.count({
      where: { source: "PVP_REWARD", userId: { in: [user.id, rival.id] } },
    });
    expect(pvpRewards).toBe(0);
    await prisma.currencyTransaction.deleteMany({
      where: { source: "PVE_REWARD", referenceId: { startsWith: "budget-" } },
    });
  });
});
