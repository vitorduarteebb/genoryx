/**
 * Enfileira arte de carta.
 *
 *   node dist/cli/generate-card-art.js --proof --process
 *   node dist/cli/generate-card-art.js --card=vine_tap --process
 *   node dist/cli/generate-card-art.js --creature=<id> --process
 *
 * --creature gera SOMENTE as 10 manifestações daquela Creature (policy FULL_CREATURE).
 * Não processa Florune, Nympha ou outras Terranox.
 */
process.env.SKIP_VISUAL_WORKER = "1";

import { NestFactory } from "@nestjs/core";
import { CARD_ART_BASE_VARIANT } from "@nexora/config";
import { AppModule } from "../app.module";
import { CardArtService } from "../modules/card-art/card-art.service";
import { currentCardArtProvider } from "../modules/card-art/generation-key";

async function main() {
  const processNow = process.argv.includes("--process");
  const proof = process.argv.includes("--proof");
  const creatureArg = process.argv.find((arg) => arg.startsWith("--creature="));
  const importArg = process.argv.find((arg) => arg.startsWith("--import="));
  const cardArg = process.argv.find((arg) => arg.startsWith("--card="));
  const variantArg = process.argv.find((arg) => arg.startsWith("--variant="));
  const creatureId = creatureArg?.slice("--creature=".length);
  const importDir = importArg?.slice("--import=".length);
  const cardKey = cardArg?.slice("--card=".length);
  const variant = variantArg?.slice("--variant=".length) || CARD_ART_BASE_VARIANT;

  if (creatureId) {
    process.env.GENETIC_CARD_ART_POLICY = "FULL_CREATURE";
    process.env.GENETIC_CARD_ART_CREATURE_IDS = creatureId;
  }

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ["error", "warn", "log"] });
  try {
    const arts = app.get(CardArtService);
    const provider = currentCardArtProvider();
    if (creatureId && proof) {
      throw new Error("Use --creature ou --proof, nunca os dois.");
    }
    if (creatureId && importDir) {
      const imported = await arts.importCreatureArtsFromDir(creatureId, importDir);
      const report = await arts.describeCreatureProof(creatureId);
      console.log(JSON.stringify({ phase: "import", provider, ...imported, report }));
      return;
    }
    const first = creatureId
      ? await arts.enqueueCreatureProof(creatureId, { provider })
      : proof
        ? await arts.enqueueFloruneProof({ provider })
        : cardKey
          ? { enqueued: 1, jobs: [{ cardKey, variant, assetId: (await arts.enqueue(cardKey, variant, { provider }))?.id }] }
          : { enqueued: 0, jobs: [] };
    console.log(JSON.stringify({ phase: "enqueue", provider, ...first }));
    if (!processNow || first.enqueued === 0) {
      return;
    }
    let processed = 0;
    let rounds = 0;
    while (rounds < 16) {
      const n = creatureId
        ? await arts.processDue(1, { provider, scope: "CREATURE", creatureId })
        : await arts.processDue(1, { provider, scope: "SHARED" });
      processed += n;
      rounds += 1;
      if (n === 0) {
        break;
      }
      if (provider === "OPENAI" && rounds < 16) {
        await new Promise((resolve) => setTimeout(resolve, 16_000));
      }
    }
    const report = creatureId ? await arts.describeCreatureProof(creatureId) : await arts.describeProof();
    console.log(
      JSON.stringify({
        phase: "process",
        processed,
        rounds,
        ready: report.cards.filter((row) => row.status === "READY").length,
        failed: report.cards.filter((row) => row.status === "FAILED" || row.status === "FAILED_REVIEW").length,
        stopped: Boolean(creatureId),
        otherCreaturesProcessed: 0,
        report,
      }),
    );
  } finally {
    await app.close();
  }
}

void main();
