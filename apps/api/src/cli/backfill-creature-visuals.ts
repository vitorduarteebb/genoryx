/**
 * Enfileira arte canônica para criaturas já existentes.
 * Não cria Creature, não altera geneticHash/genes, não duplica generationKey.
 */
process.env.SKIP_VISUAL_WORKER = "1";

import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { CreatureVisualsService } from "../modules/creature-visuals/creature-visuals.service";

async function main() {
  const processNow = process.argv.includes("--process");
  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.slice("--limit=".length)) : 24;
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ["error", "warn", "log"] });
  try {
    const visuals = app.get(CreatureVisualsService);
    const first = await visuals.backfillMissing(Number.isFinite(limit) ? limit : 24);
    console.log(JSON.stringify({ phase: "enqueue", ...first }));
    if (processNow && first.enqueued > 0) {
      const processed = await visuals.processDue();
      console.log(JSON.stringify({ phase: "process", processed }));
    }
  } finally {
    await app.close();
  }
}

void main();
