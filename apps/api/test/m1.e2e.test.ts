import "reflect-metadata";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configure-app";

const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
const email = `m1-${suffix}@nexora.test`;
const password = "correct-horse-1";
const otherEmail = `m1b-${suffix}@nexora.test`;

describe("Milestone 1", () => {
  let app: INestApplication;
  let accessToken = "";
  let refreshToken = "";
  let characterName = `Kael${suffix.slice(-6)}`;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = configureApp(moduleRef.createNestApplication());
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it("registra conta com wallets GOLD e NEX em zero", async () => {
    const res = await request(app.getHttpServer())
      .post("/auth/register")
      .send({ email, password })
      .expect(201);

    expect(res.body.email).toBe(email);
    expect(res.body.passwordHash).toBeUndefined();
    expect(res.body.role).toBe("PLAYER");
    const gold = res.body.wallets.find((w: { currency: string }) => w.currency === "GOLD");
    const nex = res.body.wallets.find((w: { currency: string }) => w.currency === "NEX");
    expect(gold.balance).toBe("100000");
    expect(nex.balance).toBe("0");
  });

  it("rejeita email duplicado", async () => {
    const res = await request(app.getHttpServer())
      .post("/auth/register")
      .send({ email: email.toUpperCase(), password })
      .expect(409);
    expect(res.body.error.code).toBe("EMAIL_ALREADY_EXISTS");
  });

  it("rejeita senha inválida", async () => {
    const res = await request(app.getHttpServer())
      .post("/auth/register")
      .send({ email: `short-${suffix}@nexora.test`, password: "123" })
      .expect(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejeita tentativa de enviar gold no registro", async () => {
    const res = await request(app.getHttpServer())
      .post("/auth/register")
      .send({ email: `gold-${suffix}@nexora.test`, password, gold: 9999, role: "ADMIN" })
      .expect(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("faz login com credenciais corretas", async () => {
    const res = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email, password })
      .expect(201);

    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
    expect(res.body.user.passwordHash).toBeUndefined();
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it("rejeita login incorreto", async () => {
    const res = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email, password: "wrong-password-9" })
      .expect(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("renova o refresh token", async () => {
    const res = await request(app.getHttpServer())
      .post("/auth/refresh")
      .send({ refreshToken })
      .expect(201);

    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).not.toBe(refreshToken);
    accessToken = res.body.accessToken;
    const previous = refreshToken;
    refreshToken = res.body.refreshToken;

    const reuse = await request(app.getHttpServer())
      .post("/auth/refresh")
      .send({ refreshToken: previous })
      .expect(401);
    expect(reuse.body.error.code).toBe("INVALID_REFRESH_TOKEN");

    const afterReuse = await request(app.getHttpServer())
      .post("/auth/refresh")
      .send({ refreshToken })
      .expect(401);
    expect(["INVALID_REFRESH_TOKEN", "SESSION_EXPIRED"]).toContain(afterReuse.body.error.code);
  });

  it("emite nova sessão após reuse e permite fluxo seguinte", async () => {
    const login = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email, password })
      .expect(201);
    accessToken = login.body.accessToken;
    refreshToken = login.body.refreshToken;
  });

  it("bloqueia rota protegida sem token", async () => {
    const res = await request(app.getHttpServer()).get("/auth/me").expect(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("consulta a própria conta", async () => {
    const res = await request(app.getHttpServer())
      .get("/auth/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.email).toBe(email);
    expect(res.body.hasCharacter).toBe(false);
    expect(res.body.wallets).toHaveLength(2);
  });

  it("cria o personagem principal", async () => {
    const res = await request(app.getHttpServer())
      .post("/characters")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: characterName })
      .expect(201);

    expect(res.body.name).toBe(characterName);
    expect(res.body.level).toBe(1);
    expect(res.body.xp).toBe(0);
    expect(res.body.class).toBe("HUNTER");
  });

  it("recusa segundo personagem", async () => {
    const res = await request(app.getHttpServer())
      .post("/characters")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: `${characterName}X` })
      .expect(409);
    expect(res.body.error.code).toBe("CHARACTER_ALREADY_EXISTS");
  });

  it("recusa gold no body da criação", async () => {
    const res = await request(app.getHttpServer())
      .post("/characters")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Hacker", gold: 5000, level: 99 })
      .expect(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("consulta o personagem e confirma GOLD de teste", async () => {
    const res = await request(app.getHttpServer())
      .get("/characters/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.name).toBe(characterName);
    const gold = res.body.wallets.find((w: { currency: string }) => w.currency === "GOLD");
    const nex = res.body.wallets.find((w: { currency: string }) => w.currency === "NEX");
    expect(gold.balance).toBe("100000");
    expect(nex.balance).toBe("0");
  });

  it("recusa nome de personagem duplicado", async () => {
    await request(app.getHttpServer())
      .post("/auth/register")
      .send({ email: otherEmail, password })
      .expect(201);
    const login = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: otherEmail, password })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post("/characters")
      .set("Authorization", `Bearer ${login.body.accessToken}`)
      .send({ name: characterName.toLowerCase() })
      .expect(409);
    expect(res.body.error.code).toBe("CHARACTER_NAME_TAKEN");
  });

  it("faz logout e invalida o refresh", async () => {
    await request(app.getHttpServer()).post("/auth/logout").send({ refreshToken }).expect(201);

    const res = await request(app.getHttpServer())
      .post("/auth/refresh")
      .send({ refreshToken })
      .expect(401);
    expect(["INVALID_REFRESH_TOKEN", "SESSION_EXPIRED"]).toContain(res.body.error.code);
  });
});
