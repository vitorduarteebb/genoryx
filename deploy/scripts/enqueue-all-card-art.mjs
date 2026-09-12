#!/usr/bin/env node
/**
 * Enfileira G1-G10 para toda criatura com visual READY que ainda não tem 10 artes READY.
 * Uso no container: node /tmp/enqueue-all-card-art.mjs
 */
import { NestFactory } from "@nestjs/core";

process.env.SKIP_VISUAL_WORKER = "1";
process.env.GENETIC_CARD_ART_POLICY = process.env.GENETIC_CARD_ART_POLICY || "FULL_CREATURE";
process.env.GENETIC_CARD_ART_CREATURE_IDS = process.env.GENETIC_CARD_ART_CREATURE_IDS || "";

const { AppModule } = await import("/app/apps/api/dist/app.module.js");
const { CardArtService } = await import("/app/apps/api/dist/modules/card-art/card-art.service.js");
const { PrismaService } = await import("/app/apps/api/dist/prisma/prisma.service.js");

const app = await NestFactory.createApplicationContext(AppModule, { logger: ["error", "warn", "log"] });
const arts = app.get(CardArtService);
const prisma = app.get(PrismaService).client;

const rows = await prisma.$queryRaw`
  SELECT c.id::text AS id, s.key AS species, count(a.id) FILTER (WHERE a.status = 'READY' AND a.provider = 'OPENAI')::int AS ready
  FROM creatures c
  JOIN creature_species s ON s.id = c.species_id
  LEFT JOIN card_art_assets a ON a.creature_id = c.id AND a.scope = 'CREATURE'
  WHERE EXISTS (
    SELECT 1 FROM creature_visual_assets v
    WHERE v.creature_id = c.id AND v.provider = 'OPENAI' AND v.status = 'READY'
  )
  GROUP BY c.id, s.key
  HAVING count(a.id) FILTER (WHERE a.status = 'READY' AND a.provider = 'OPENAI') < 10
  ORDER BY ready ASC, s.key ASC
`;

let enqueuedCreatures = 0;
let newJobs = 0;
let errors = 0;

for (const row of rows) {
  try {
    const result = await arts.enqueueForCreature(row.id);
    enqueuedCreatures += 1;
    newJobs += result.jobs.filter((job) => job.created).length;
    console.log(JSON.stringify({ creatureId: row.id, species: row.species, ready: row.ready, jobs: result.jobs.length }));
  } catch (error) {
    errors += 1;
    console.error(JSON.stringify({ creatureId: row.id, species: row.species, error: error instanceof Error ? error.message : String(error) }));
  }
}

console.log(JSON.stringify({ summary: { incomplete: rows.length, enqueuedCreatures, newJobs, errors } }));
await app.close();
