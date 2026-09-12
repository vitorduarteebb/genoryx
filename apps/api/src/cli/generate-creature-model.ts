/**
 * POC 3D: turnaround GPT + Meshy GLB. Não altera DNA nem imageHash do retrato.
 *   node dist/cli/generate-creature-model.js --creatureId=84ae443c-a1e8-41eb-afe1-aff5763eaf01
 */
process.env.SKIP_VISUAL_WORKER = "1";

import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { CreatureModelsService, FLORUNE_POC_ID } from "../modules/creature-models/creature-models.service";

async function main() {
  const proof = process.argv.includes("--proof");
  const idArg = process.argv.find((arg) => arg.startsWith("--creatureId="));
  const creatureId = proof ? FLORUNE_POC_ID : idArg?.slice("--creatureId=".length);
  if (!creatureId) {
    throw new Error("Informe --proof ou --creatureId=");
  }
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ["error", "warn", "log"] });
  try {
    const models = app.get(CreatureModelsService);
    const row = await models.prepare(creatureId);
    console.log(
      JSON.stringify({
        creatureId,
        modelId: row.id,
        status: row.status,
        publicUrl: row.publicUrl,
        modelHash: row.modelHash,
        sourceVisualAssetId: row.sourceVisualAssetId,
      }),
    );
  } finally {
    await app.close();
  }
}

void main();
