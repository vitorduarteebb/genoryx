#!/usr/bin/env node
/**
 * Gera artes CREATURE pendentes via MOCK (retrato canônico) — sem OpenAI.
 * Uso: docker exec -w /app nexora-alpha-api node drain-mock-card-art.mjs
 */
import { NestFactory } from "@nestjs/core";

process.env.SKIP_VISUAL_WORKER = "1";
process.env.CARD_ART_PROVIDER = "mock";
process.env.GENETIC_CARD_ART_POLICY = process.env.GENETIC_CARD_ART_POLICY || "FULL_CREATURE";
process.env.GENETIC_CARD_ART_CREATURE_IDS = process.env.GENETIC_CARD_ART_CREATURE_IDS || "";

const { AppModule } = await import("/app/apps/api/dist/app.module.js");
const { CardArtService } = await import("/app/apps/api/dist/modules/card-art/card-art.service.js");
const { PrismaService } = await import("/app/apps/api/dist/prisma/prisma.service.js");

const app = await NestFactory.createApplicationContext(AppModule, { logger: ["error", "warn"] });
const arts = app.get(CardArtService);
const prisma = app.get(PrismaService).client;

const reset = await prisma.$executeRaw`
  UPDATE card_art_assets
  SET provider = 'MOCK',
      status = 'PENDING',
      failure_reason = NULL,
      attempt_count = 0,
      next_attempt_at = NOW()
  WHERE scope = 'CREATURE'
    AND status IN ('PENDING', 'FAILED', 'FAILED_REVIEW', 'GENERATING', 'VALIDATING')
    AND creature_id IN (
      SELECT c.id
      FROM creatures c
      LEFT JOIN card_art_assets a ON a.creature_id = c.id AND a.scope = 'CREATURE' AND a.status = 'READY'
      WHERE c.visual_status = 'READY'
      GROUP BY c.id
      HAVING count(a.id) < 10
    )
`;
console.log(JSON.stringify({ event: "reset-mock-jobs", rows: Number(reset) }));

let processed = 0;
let rounds = 0;
while (rounds < 500) {
  rounds += 1;
  const n = await arts.processDue(25, { provider: "MOCK", scope: "CREATURE" });
  processed += n;
  console.log(JSON.stringify({ event: "process-round", round: rounds, batch: n, total: processed }));
  if (n === 0) {
    break;
  }
}

const summary = await prisma.$queryRaw`
  SELECT count(*) FILTER (WHERE status = 'READY')::int AS ready,
         count(*) FILTER (WHERE status = 'PENDING')::int AS pending,
         count(*) FILTER (WHERE status IN ('FAILED', 'FAILED_REVIEW'))::int AS failed
  FROM card_art_assets
  WHERE scope = 'CREATURE'
`;
const incomplete = await prisma.$queryRaw`
  SELECT count(*)::int AS n
  FROM (
    SELECT c.id
    FROM creatures c
    LEFT JOIN card_art_assets a ON a.creature_id = c.id AND a.scope = 'CREATURE' AND a.status = 'READY'
    WHERE c.visual_status = 'READY'
    GROUP BY c.id
    HAVING count(a.id) < 10
  ) x
`;
console.log(JSON.stringify({ event: "done", processed, rounds, summary: summary[0], incompleteCreatures: incomplete[0]?.n ?? 0 }));
await app.close();
