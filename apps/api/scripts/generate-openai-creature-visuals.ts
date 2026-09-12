/**
 * Enfileira arte OpenAI sem apagar MOCK READY.
 * Não cria Creature e não altera geneticHash / genes / visualSeed.
 *
 *   npx tsx apps/api/scripts/generate-openai-creature-visuals.ts --proof --process
 */
process.env.SKIP_VISUAL_WORKER = "1";

import { NestFactory } from "@nestjs/core";
import { AppModule } from "../src/app.module";
import { CreatureVisualsService } from "../src/modules/creature-visuals/creature-visuals.service";

async function main() {
  const processNow = process.argv.includes("--process");
  const proof = process.argv.includes("--proof");
  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.slice("--limit=".length)) : 8;
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ["error", "warn", "log"] });
  try {
    const visuals = app.get(CreatureVisualsService);
    const first = await visuals.generateOpenAi({
      proof,
      limit: Number.isFinite(limit) ? limit : 8,
    });
    console.log(JSON.stringify({ phase: "enqueue", ...first }));
    if (!processNow) {
      return;
    }
    let processed = 0;
    let rounds = 0;
    while (rounds < 12) {
      const n = await visuals.processDue(2, { provider: "OPENAI" });
      processed += n;
      rounds += 1;
      if (n === 0) {
        break;
      }
    }
    const report = await visuals.describeOfficialAssets(first.jobs.map((job) => job.creatureId));
    console.log(
      JSON.stringify({
        phase: "process",
        processed,
        rounds,
        success: report.filter((row) => row.status === "READY").length,
        failure: report.filter((row) => row.status === "FAILED" || row.status === "FAILED_REVIEW").length,
        retry: report.filter((row) => row.status === "PENDING" || row.status === "GENERATING" || row.status === "VALIDATING").length,
        report,
      }),
    );
  } finally {
    await app.close();
  }
}

void main();
