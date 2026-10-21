import { Injectable, Logger, NotFoundException, StreamableFile } from "@nestjs/common";
import { visualGenerationConfig } from "@nexora/config";
import type { CreatureVisualGenome } from "@nexora/game-engine";
import { assembleVisualGenome, buildCreatureImagePrompt, deriveVisualSeed, growthFromLifeStage, visualSpecFromGenome } from "@nexora/game-engine";
import type { LifeStage, VisualImageProvider } from "@nexora/types";
import type { CreatureRecord } from "../../common/creature-io";
import { revealStatusOf } from "../../common/creature-visual-present";
import { PrismaService } from "../../prisma/prisma.service";
import { generationConcurrency, staggerMs } from "./concurrency";
import {
  buildGenerationKey,
  currentVisualProvider,
  imageHashFromBytes,
  isImageProviderOutage,
  resolveCreatureImageModel,
  sha256Hex,
} from "./generation-key";
import { needsOpenAiVisual, pickProofCreatures } from "./openai-backfill";
import { qaAccepted } from "./qa";
import { CardArtService } from "../card-art/card-art.service";
import { LocalCreatureImageStore, storageKeyFor, type CreatureImageStore } from "./storage";
import { MockCreatureImageProvider } from "./providers/mock.provider";
import { OpenAICreatureImageProvider } from "./providers/openai.provider";
import type { CreatureImageProvider, GeneratedCreatureImage } from "./providers/types";

export function resolveCreatureImageProviderName(): "mock" | "openai" {
  return currentVisualProvider() === "OPENAI" ? "openai" : "mock";
}

@Injectable()
export class CreatureVisualsService {
  private readonly log = new Logger(CreatureVisualsService.name);
  private readonly store: CreatureImageStore;
  private readonly mockProvider = new MockCreatureImageProvider();
  private readonly openaiProvider = new OpenAICreatureImageProvider();
  private busy = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cardArt: CardArtService,
  ) {
    this.store = new LocalCreatureImageStore();
  }

  private providerFor(provider: VisualImageProvider | string | null | undefined): CreatureImageProvider {
    return provider === "OPENAI" ? this.openaiProvider : this.mockProvider;
  }

  async enqueueBorn(creatureIds: string[]) {
    for (const creatureId of creatureIds) {
      await this.enqueue(creatureId, "BABY");
    }
  }

  async enqueue(creatureId: string, lifeStage: LifeStage, options?: { provider?: VisualImageProvider }) {
    const creature = await this.prisma.client.creature.findUnique({
      where: { id: creatureId },
      include: { species: true, mutation: true, loci: true, visualAssets: true },
    });
    if (!creature) {
      return;
    }
    const genome = await this.ensureGenome(creature as CreatureRecord);
    const provider = options?.provider ?? currentVisualProvider();
    const { model, snapshot } =
      provider === "OPENAI" ? resolveCreatureImageModel() : { model: "mock", snapshot: "mock" };
    const generationKey = buildGenerationKey({
      creatureId,
      lifeStage,
      geneticHash: creature.geneticHash,
      visualSeed: genome.visualSeed,
      provider,
      modelVersion: snapshot,
    });
    const existing = await this.prisma.client.creatureVisualAsset.findUnique({
      where: { creatureId_lifeStage_generationKey: { creatureId, lifeStage, generationKey } },
    });
    if (existing?.status === "READY" && existing.storageKey && (await this.store.isValidPng(existing.storageKey))) {
      return existing;
    }
    if (existing?.status === "READY") {
      await this.prisma.client.creatureVisualAsset.update({
        where: { id: existing.id },
        data: { status: "PENDING", nextAttemptAt: new Date(), failureReason: "storage missing or invalid" },
      });
      return existing;
    }
    if (existing) {
      return existing;
    }
    try {
      return await this.prisma.client.creatureVisualAsset.create({
        data: {
          creatureId,
          lifeStage,
          status: "PENDING",
          generationKey,
          provider,
          model,
          modelSnapshot: snapshot,
          artBibleVersion: visualGenerationConfig.artBibleVersion,
          promptVersion: visualGenerationConfig.promptVersion,
          visualGenomeVersion: visualGenerationConfig.visualGenomeVersion,
          nextAttemptAt: new Date(),
        },
      });
    } catch {
      return this.prisma.client.creatureVisualAsset.findUnique({
        where: { creatureId_lifeStage_generationKey: { creatureId, lifeStage, generationKey } },
      });
    }
  }

  async evolve(creatureId: string, nextStage: "YOUNG" | "ADULT") {
    const creature = await this.prisma.client.creature.findUnique({
      where: { id: creatureId },
      include: { visualAssets: true, species: true, mutation: true, loci: true },
    });
    if (!creature) {
      throw new NotFoundException("Criatura não encontrada.");
    }
    const genome = (creature.visualGenomeJson ?? {}) as CreatureVisualGenome;
    const chassis = genome.chassis && typeof genome.chassis === "object"
      ? { ...genome.chassis, growthStage: growthFromLifeStage(nextStage) }
      : genome.chassis;
    const updated = { ...genome, lifeStage: nextStage, chassis };
    await this.prisma.client.creature.update({
      where: { id: creatureId },
      data: { lifeStage: nextStage, visualGenomeJson: updated as object },
    });
    try {
      return await this.enqueue(creatureId, nextStage);
    } catch (error) {
      this.log.warn(`Retrato ${nextStage} enfileirado com falha após o Despertar de ${creatureId}: ${error}`);
      return null;
    }
  }

  async backfillMissing(limit: number = visualGenerationConfig.backfillBatchSize) {
    const preferred = currentVisualProvider();
    const rows = await this.prisma.client.creature.findMany({
      include: { visualAssets: true, species: true, mutation: true, loci: true },
      orderBy: { birthDate: "asc" },
      take: Math.max(limit * 4, limit),
    });
    const jobs: Array<{ creatureId: string; lifeStage: string; assetId: string | undefined; created: boolean }> = [];
    for (const row of rows) {
      if (jobs.length >= limit) {
        break;
      }
      const currentReady = row.visualAssets.find(
        (asset) =>
          asset.lifeStage === row.lifeStage &&
          asset.provider === preferred &&
          asset.status === "READY" &&
          asset.storageKey,
      );
      if (currentReady && (await this.store.isValidPng(currentReady.storageKey!))) {
        continue;
      }
      const active = row.visualAssets.some(
        (asset) =>
          asset.lifeStage === row.lifeStage &&
          asset.provider === preferred &&
          (asset.status === "PENDING" || asset.status === "GENERATING" || asset.status === "VALIDATING"),
      );
      if (active && !currentReady) {
        continue;
      }
      await this.ensureGenome(row as CreatureRecord);
      const before = await this.prisma.client.creatureVisualAsset.count({
        where: { creatureId: row.id, lifeStage: row.lifeStage, provider: preferred },
      });
      const asset = await this.enqueue(row.id, row.lifeStage, { provider: preferred });
      const after = await this.prisma.client.creatureVisualAsset.count({
        where: { creatureId: row.id, lifeStage: row.lifeStage, provider: preferred },
      });
      jobs.push({
        creatureId: row.id,
        lifeStage: row.lifeStage,
        assetId: asset?.id,
        created: after > before,
      });
    }
    return { scanned: rows.length, enqueued: jobs.length, jobs };
  }

  async generateOpenAi(input: { proof?: boolean; speciesKeys?: string[]; limit?: number } = {}) {
    const limit = input.proof ? 3 : Math.max(1, Math.min(input.limit ?? 8, 80));
    const rows = await this.prisma.client.creature.findMany({
      include: { visualAssets: true, species: true, mutation: true, loci: true },
      orderBy: { birthDate: "asc" },
    });
    const selected = input.proof
      ? pickProofCreatures(rows)
      : rows.filter((row) => needsOpenAiVisual(row)).slice(0, limit);
    const jobs: Array<{
      creatureId: string;
      speciesKey: string;
      lifeStage: string;
      geneticHash: string;
      visualSeed: string | null;
      assetId: string | undefined;
      created: boolean;
    }> = [];
    for (const row of selected) {
      const geneticHash = row.geneticHash;
      const visualSeed = row.visualSeed;
      await this.ensureGenome(row as CreatureRecord);
      const beforeAssets = await this.prisma.client.creatureVisualAsset.count({
        where: { creatureId: row.id, lifeStage: row.lifeStage, provider: "OPENAI" },
      });
      const asset = await this.enqueue(row.id, row.lifeStage, { provider: "OPENAI" });
      const after = await this.prisma.client.creature.findUniqueOrThrow({ where: { id: row.id } });
      if (after.geneticHash !== geneticHash || (visualSeed && after.visualSeed !== visualSeed)) {
        throw new Error("generate-openai recusou alterar geneticHash/visualSeed.");
      }
      const afterAssets = await this.prisma.client.creatureVisualAsset.count({
        where: { creatureId: row.id, lifeStage: row.lifeStage, provider: "OPENAI" },
      });
      jobs.push({
        creatureId: row.id,
        speciesKey: row.species.key,
        lifeStage: row.lifeStage,
        geneticHash,
        visualSeed: after.visualSeed,
        assetId: asset?.id,
        created: afterAssets > beforeAssets,
      });
    }
    return { scanned: rows.length, selected: selected.length, enqueued: jobs.length, proof: Boolean(input.proof), jobs };
  }

  async describeOfficialAssets(creatureIds: string[]) {
    const rows = await this.prisma.client.creature.findMany({
      where: { id: { in: creatureIds } },
      include: { species: true, visualAssets: true },
    });
    return rows.map((row) => {
      const official =
        row.visualAssets.find(
          (asset) => asset.lifeStage === row.lifeStage && asset.provider === "OPENAI" && asset.status === "READY",
        ) ??
        row.visualAssets.find((asset) => asset.lifeStage === row.lifeStage && asset.provider === "OPENAI");
      const genome = (row.visualGenomeJson ?? {}) as CreatureVisualGenome;
      return {
        creatureId: row.id,
        speciesKey: row.species.key,
        speciesName: row.species.name,
        lifeStage: row.lifeStage,
        temperament: row.temperament,
        geneticHash: row.geneticHash,
        visualSeed: row.visualSeed,
        visualGenome: genome,
        provider: official?.provider ?? null,
        model: official?.model ?? null,
        modelSnapshot: official?.modelSnapshot ?? null,
        status: official?.status ?? null,
        promptHash: official?.promptHash ?? null,
        imageHash: official?.imageHash ?? null,
        imageUrl: official?.publicUrl && official.imageHash ? `${official.publicUrl}?v=${official.imageHash.slice(0, 16)}` : official?.publicUrl ?? null,
        failureReason: official?.failureReason ?? null,
        usage: (official?.qaJson as { usage?: unknown } | null)?.usage ?? null,
      };
    });
  }

  async processDue(limit = generationConcurrency(), options?: { provider?: VisualImageProvider }) {
    if (this.busy) {
      return 0;
    }
    this.busy = true;
    try {
      const provider = options?.provider ?? currentVisualProvider();
      const stale = new Date(Date.now() - 180_000);
      const due = await this.prisma.client.creatureVisualAsset.findMany({
        where: {
          provider,
          OR: [
            {
              status: { in: ["PENDING", "FAILED"] },
              AND: [{ OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: new Date() } }] }],
            },
            { status: { in: ["GENERATING", "VALIDATING"] }, updatedAt: { lte: stale } },
          ],
        },
        orderBy: { createdAt: "asc" },
        take: limit,
      });
      const gap = staggerMs();
      const results = await Promise.all(
        due.map(
          (row, index) =>
            new Promise<"success" | "failure" | "skipped">((resolve) => {
              setTimeout(() => {
                void this.processAsset(row.id)
                  .then((asset) => resolve(asset?.status === "READY" ? "success" : asset ? "skipped" : "failure"))
                  .catch(() => resolve("failure"));
              }, index * gap);
            }),
        ),
      );
      this.log.log(
        JSON.stringify({
          event: "visual-process-due",
          provider,
          processed: due.length,
          success: results.filter((row) => row === "success").length,
          failure: results.filter((row) => row === "failure").length,
          retry: results.filter((row) => row === "skipped").length,
        }),
      );
      return due.length;
    } finally {
      this.busy = false;
    }
  }

  async processAsset(assetId: string) {
    const asset = await this.prisma.client.creatureVisualAsset.findUnique({
      where: { id: assetId },
      include: { creature: { include: { species: true, mutation: true, loci: true } } },
    });
    if (!asset || asset.status === "READY" || asset.status === "FAILED_REVIEW") {
      return asset;
    }

    const started = Date.now();
    const claimed = await this.prisma.client.creatureVisualAsset.updateMany({
      where: {
        id: asset.id,
        status: { in: ["PENDING", "FAILED", "GENERATING", "VALIDATING"] },
      },
      data: { status: "GENERATING", attemptCount: { increment: 1 } },
    });
    if (claimed.count === 0) {
      return asset;
    }

    const imageProvider = this.providerFor(asset.provider);
    try {
      const genome = await this.ensureGenome(asset.creature as CreatureRecord);
      const stageGenome = { ...genome, lifeStage: asset.lifeStage };
      const references = await this.loadReferences(asset.creatureId, asset.lifeStage, asset.provider);
      const spec = visualSpecFromGenome(asset.creatureId, stageGenome, {
        hasPriorStageReference: references.length > 0,
      });
      const prompt = buildCreatureImagePrompt(spec);
      const promptHash = sha256Hex(prompt);

      const generated: GeneratedCreatureImage =
        asset.lifeStage === "BABY" || references.length === 0
          ? await imageProvider.generateInitialCreature(spec, prompt)
          : await imageProvider.evolveCreatureVisual(spec, prompt, references);

      await this.prisma.client.creatureVisualAsset.update({
        where: { id: asset.id },
        data: { status: "VALIDATING", promptHash, promptText: prompt },
      });

      const qa = await imageProvider.validateCreatureVisual(spec, generated.bytes);
      if (!qaAccepted(qa)) {
        throw Object.assign(new Error(`QA recusou a arte: ${qa.criticalErrors.join(",") || qa.overallScore}`), {
          qa,
        });
      }

      const key = storageKeyFor(asset.creatureId, asset.lifeStage, asset.generationKey);
      await this.store.put(key, generated.bytes);
      const hash = imageHashFromBytes(generated.bytes);
      const ready = await this.prisma.client.creatureVisualAsset.update({
        where: { id: asset.id },
        data: {
          status: "READY",
          storageKey: key,
          publicUrl: `/creature-visuals/${asset.id}/image`,
          imageHash: hash,
          promptHash,
          promptText: prompt,
          generatedAt: new Date(),
          qaScore: qa.overallScore,
          qaJson: { ...qa, usage: generated.usage ?? null },
          failureReason: null,
          model: generated.model,
          modelSnapshot: generated.modelSnapshot,
        },
      });
      await this.refreshCreatureVisualStatus(asset.creatureId);
      const owner = await this.prisma.client.creature.findUnique({
        where: { id: asset.creatureId },
        select: { lifeStage: true },
      });
      if (owner?.lifeStage === asset.lifeStage) {
        await this.cardArt.enqueueForCreature(asset.creatureId).catch((error: unknown) => {
          this.log.warn(error instanceof Error ? error.message : "enqueue card-art após visual READY falhou");
        });
      }
      this.log.log(
        JSON.stringify({
          creatureId: asset.creatureId,
          lifeStage: asset.lifeStage,
          jobId: asset.id,
          provider: asset.provider,
          model: generated.model,
          duration: Date.now() - started,
          retries: asset.attemptCount,
          status: "READY",
          usage: generated.usage ?? null,
        }),
      );
      return ready;
    } catch (error) {
      const message = error instanceof Error ? error.message : "falha visual";
      const attempts = asset.attemptCount + 1;
      const review = attempts >= visualGenerationConfig.maxJobAttempts || isImageProviderOutage(message);
      const delay =
        visualGenerationConfig.retryDelaysMs[
          Math.min(attempts - 1, visualGenerationConfig.retryDelaysMs.length - 1)
        ] ?? 900_000;
      await this.prisma.client.creatureVisualAsset.update({
        where: { id: asset.id },
        data: {
          status: review ? "FAILED_REVIEW" : "FAILED",
          failureReason: message,
          nextAttemptAt: review ? null : new Date(Date.now() + delay),
        },
      });
      await this.refreshCreatureVisualStatus(asset.creatureId);
      this.log.warn(
        JSON.stringify({
          creatureId: asset.creatureId,
          lifeStage: asset.lifeStage,
          jobId: asset.id,
          provider: asset.provider,
          duration: Date.now() - started,
          retries: attempts,
          status: review ? "FAILED_REVIEW" : "FAILED",
        }),
      );
      return null;
    }
  }

  async streamImage(assetId: string) {
    const asset = await this.prisma.client.creatureVisualAsset.findUnique({ where: { id: assetId } });
    if (!asset?.storageKey || asset.status !== "READY") {
      throw new NotFoundException("Arte ainda não está pronta.");
    }
    if (!(await this.store.isValidPng(asset.storageKey))) {
      throw new NotFoundException("Arte canônica ausente no storage.");
    }
    const bytes = await this.store.get(asset.storageKey);
    return new StreamableFile(bytes, { type: "image/png", disposition: "inline" });
  }

  async ensureGenome(row: CreatureRecord): Promise<CreatureVisualGenome> {
    const existing = row.visualGenomeJson as CreatureVisualGenome | null;
    if (existing?.visualSeed && existing.bodyPlan?.expressed) {
      return existing;
    }
    const visualSeed = row.visualSeed || deriveVisualSeed(row.id, row.geneticHash);
    const genome = assembleVisualGenome({
      creatureId: row.id,
      speciesKey: row.species.key,
      bodyPlanExpressed: row.bodyPlanExpressed,
      bodyPlanRecessive: row.bodyPlanRecessive,
      headExpressed: row.headExpressed,
      headRecessive: row.headRecessive,
      geneticHash: row.geneticHash,
      genesisSeed: row.genesisSeed,
      lifeStage: (row as CreatureRecord & { lifeStage?: LifeStage }).lifeStage ?? "BABY",
      mutationKey: row.mutation?.key,
      expressedCardKeys: row.loci.map((locus) => locus.expressedCardKey),
      temperament: row.visualSeed ? row.temperament : undefined,
      visualSeed,
    });
    await this.prisma.client.creature.update({
      where: { id: row.id },
      data: {
        visualSeed,
        temperament: genome.temperament,
        visualGenomeJson: genome,
      },
    });
    (row as CreatureRecord & { visualGenomeJson?: CreatureVisualGenome }).visualGenomeJson = genome;
    return genome;
  }

  private async loadReferences(
    creatureId: string,
    lifeStage: LifeStage,
    provider: VisualImageProvider,
  ): Promise<Buffer[]> {
    if (lifeStage === "BABY" || lifeStage === "EGG") {
      return [];
    }
    const wanted: LifeStage[] = lifeStage === "YOUNG" ? ["BABY"] : ["YOUNG", "BABY"];
    const refs: Buffer[] = [];
    for (const stage of wanted) {
      const row =
        (await this.prisma.client.creatureVisualAsset.findFirst({
          where: { creatureId, lifeStage: stage, provider, status: "READY", storageKey: { not: null } },
          orderBy: { generatedAt: "desc" },
        })) ??
        (await this.prisma.client.creatureVisualAsset.findFirst({
          where: { creatureId, lifeStage: stage, status: "READY", storageKey: { not: null } },
          orderBy: { generatedAt: "desc" },
        }));
      if (row?.storageKey) {
        refs.push(await this.store.get(row.storageKey));
      }
    }
    return refs;
  }

  private async refreshCreatureVisualStatus(creatureId: string) {
    const creature = await this.prisma.client.creature.findUnique({
      where: { id: creatureId },
      include: { visualAssets: true },
    });
    if (!creature) {
      return;
    }
    const preferred = currentVisualProvider();
    const currentStage = creature.visualAssets.filter((row) => row.lifeStage === creature.lifeStage);
    const officialReady = currentStage.some((row) => row.provider === preferred && row.status === "READY");
    const anyReady = currentStage.some((row) => row.status === "READY");
    const officialFailed = currentStage.some(
      (row) =>
        row.provider === preferred &&
        (row.status === "FAILED_REVIEW" || (row.status === "FAILED" && isImageProviderOutage(row.failureReason))),
    );
    const status = officialReady || anyReady ? "READY" : officialFailed ? "FAILED" : "PENDING";
    const revealStatus = revealStatusOf(creature);
    const nextReveal =
      revealStatus === "PENDING_VISUAL" && (officialReady || officialFailed) ? "READY_TO_REVEAL" : undefined;
    await this.prisma.client.creature.update({
      where: { id: creatureId },
      data: {
        visualStatus: status,
        ...(nextReveal ? { revealStatus: nextReveal } : {}),
      },
    });
  }
}
