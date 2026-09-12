/**
 * Enfileira arte canônica para criaturas já existentes.
 * Não cria Creature, não altera geneticHash/genes, não duplica generationKey.
 *
 *   npx tsx apps/api/scripts/backfill-creature-visuals.ts
 *   npx tsx apps/api/scripts/backfill-creature-visuals.ts --process
 */
process.env.SKIP_VISUAL_WORKER = "1";

import { NestFactory } from "@nestjs/core";
import { AppModule } from "../src/app.module";
import { CreatureVisualsService } from "../src/modules/creature-visuals/creature-visuals.service";

async function main() {
  const processNow = process.argv.includes("--process");
  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.slice("--limit=".length)) : 24;
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ["error", "warn", "log"] });
  try {
    const visuals = app.get(CreatureVisualsService);
    const first = await visuals.backfillMissing(Number.isFinite(limit) ? limit : 24);
    console.log(JSON.stringify({ phase: "enqueue", ...first }, null, 2));
    if (processNow && first.enqueued > 0) {
      const processed = await visuals.processDue();
      console.log(JSON.stringify({ phase: "process", processed }, null, 2));
    }
  } finally {
    await app.close();
  }
}

void main();
