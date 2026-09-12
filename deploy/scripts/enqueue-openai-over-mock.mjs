#!/usr/bin/env node
/**
 * Enfileira CardArt OPENAI mesmo quando já existe MOCK READY.
 * Só cria job se a criatura tem retrato OPENAI READY.
 */
import { NestFactory } from "@nestjs/core";

process.env.SKIP_VISUAL_WORKER = "1";
process.env.GENETIC_CARD_ART_POLICY = "FULL_CREATURE";
process.env.GENETIC_CARD_ART_CREATURE_IDS = "";

const { AppModule } = await import("/app/apps/api/dist/app.module.js");
const { PrismaService } = await import("/app/apps/api/dist/prisma/prisma.service.js");
const { buildCreatureCardArtGenerationKey, resolveCardArtModel } = await import(
  "/app/apps/api/dist/modules/card-art/generation-key.js"
);
const { generatePowerCards, backfillGeneticPower, cardArtSpecFromCatalog } = await import("@nexora/game-engine");
const { cardArtGenerationConfig, geneticCardArtConfig } = await import("@nexora/config");

const app = await NestFactory.createApplicationContext(AppModule, { logger: ["error", "warn", "log"] });
const prisma = app.get(PrismaService).client;
const { model, snapshot } = resolveCardArtModel();

const creatures = await prisma.creature.findMany({
  include: {
    species: true,
    geneticPower: { include: { power: true } },
    visualAssets: true,
  },
  orderBy: { birthDate: "asc" },
});

let scanned = 0;
let created = 0;
let skipped = 0;

for (const creature of creatures) {
  const visual = creature.visualAssets.find(
    (row) => row.lifeStage === creature.lifeStage && row.provider === "OPENAI" && row.status === "READY" && row.imageHash,
  );
  if (!visual) {
    continue;
  }
  scanned += 1;
  const genome =
    creature.geneticPower?.power.definitionJson ??
    backfillGeneticPower({
      creatureId: creature.id,
      speciesKey: creature.species.key,
      element: creature.elementPrimary,
      geneticHash: creature.geneticHash,
    }).genome;
  const cards = generatePowerCards({ power: genome, speciesKey: creature.species.key, seed: 1 });
  for (const card of cards) {
    if (!card.catalogKey) {
      skipped += 1;
      continue;
    }
    const official = await prisma.cardArtAsset.findFirst({
      where: {
        creatureId: creature.id,
        scope: "CREATURE",
        geneticCardManifestationId: card.locus,
        provider: "OPENAI",
        status: { in: ["READY", "PENDING", "GENERATING", "VALIDATING"] },
      },
    });
    if (official) {
      skipped += 1;
      continue;
    }
    const spec = cardArtSpecFromCatalog(card.catalogKey);
    const generationKey = buildCreatureCardArtGenerationKey({
      creatureId: creature.id,
      manifestationId: card.locus,
      canonicalVisualImageHash: visual.imageHash,
      lifeStage: creature.lifeStage,
      modelSnapshot: snapshot,
    });
    try {
      await prisma.cardArtAsset.create({
        data: {
          cardDefinitionId: card.catalogKey,
          variantKey: "BASE",
          element: spec?.element ?? creature.elementPrimary,
          scope: "CREATURE",
          creatureId: creature.id,
          geneticCardManifestationId: card.locus,
          lifeStage: creature.lifeStage,
          cardArtLifeStage: creature.lifeStage,
          sourceCreatureVisualAssetId: visual.id,
          status: "PENDING",
          generationKey,
          provider: "OPENAI",
          model,
          modelSnapshot: snapshot,
          artBibleVersion: cardArtGenerationConfig.artBibleVersion,
          cardArtVersion: geneticCardArtConfig.cardArtVersion,
          promptVersion: geneticCardArtConfig.promptVersion,
          nextAttemptAt: new Date(),
        },
      });
      created += 1;
    } catch {
      skipped += 1;
    }
  }
}

console.log(JSON.stringify({ scanned, created, skipped }));
await app.close();
