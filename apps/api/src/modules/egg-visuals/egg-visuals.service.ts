import { Injectable, Logger, StreamableFile } from "@nestjs/common";
import { eggAiArtEnabled, eggVisualGenerationConfig } from "@nexora/config";
import { buildEggImagePrompt, eggPromptExposesSecrets, eggSpecFromGenome, type EggVisualGenome } from "@nexora/game-engine";
import type { VisualImageProvider } from "@nexora/types";
import { PrismaService } from "../../prisma/prisma.service";
import { generationConcurrency, staggerMs } from "../creature-visuals/concurrency";
import {
  currentVisualProvider,
  imageHashFromBytes,
  isImageProviderOutage,
  resolveCreatureImageModel,
  sha256Hex,
} from "../creature-visuals/generation-key";
import { eggStorageKey, LocalEggImageStore } from "./storage";
import { MockEggImageProvider } from "./providers/mock.provider";
import { OpenAIEggImageProvider } from "./providers/openai.provider";
import type { EggImageProvider } from "./providers/types";

export function currentEggProvider(): VisualImageProvider {
  if (!eggAiArtEnabled()) {
    return "MOCK";
  }
  return currentVisualProvider();
}

export function buildEggGenerationKey(input: {
  eggId: string;
  visualSeed: string;
  provider: VisualImageProvider | string;
  modelVersion: string;
}): string {
  return sha256Hex(
    [
      input.eggId,
      input.visualSeed,
      String(eggVisualGenerationConfig.visualGenomeVersion),
      String(eggVisualGenerationConfig.artBibleVersion),
      String(eggVisualGenerationConfig.promptVersion),
      input.provider.toString().toUpperCase(),
      input.modelVersion,
    ].join("|"),
  );
}

@Injectable()
export class EggVisualsService {
  private readonly log = new Logger(EggVisualsService.name);
  private readonly store = new LocalEggImageStore();
  private readonly mock = new MockEggImageProvider();
  private readonly openai = new OpenAIEggImageProvider();
  private busy = false;

  constructor(private readonly prisma: PrismaService) {}

  private providerFor(name: VisualImageProvider | string): EggImageProvider {
    return name === "OPENAI" ? this.openai : this.mock;
  }

  async enqueue(eggId: string) {
    const egg = await this.prisma.client.egg.findUnique({ where: { id: eggId } });
    if (!egg) {
      return null;
    }
    const genome = (egg.eggVisualJson ?? {}) as EggVisualGenome;
    if (!genome.visualSeed) {
      return null;
    }
    const provider = currentEggProvider();
    const { model, snapshot } = provider === "OPENAI" ? resolveCreatureImageModel() : { model: "mock", snapshot: "mock" };
    const generationKey = buildEggGenerationKey({
      eggId,
      visualSeed: genome.visualSeed,
      provider,
      modelVersion: snapshot,
    });
    const existing = await this.prisma.client.eggVisualAsset.findUnique({
      where: { eggId_generationKey: { eggId, generationKey } },
    });
    if (existing?.status === "READY" && existing.storageKey && (await this.store.isValidPng(existing.storageKey))) {
      await this.prisma.client.egg.update({
        where: { id: eggId },
        data: { eggVisualStatus: "READY" },
      });
      return existing;
    }
    if (existing) {
      return existing;
    }
    try {
      const created = await this.prisma.client.eggVisualAsset.create({
        data: {
          eggId,
          status: "PENDING",
          generationKey,
          provider,
          model,
          modelSnapshot: snapshot,
          artBibleVersion: eggVisualGenerationConfig.artBibleVersion,
          promptVersion: eggVisualGenerationConfig.promptVersion,
          visualGenomeVersion: eggVisualGenerationConfig.visualGenomeVersion,
          nextAttemptAt: new Date(),
        },
      });
      await this.prisma.client.egg.update({
        where: { id: eggId },
        data: { eggVisualStatus: "PENDING" },
      });
      return created;
    } catch {
      return this.prisma.client.eggVisualAsset.findUnique({
        where: { eggId_generationKey: { eggId, generationKey } },
      });
    }
  }

  async processDue(limit = generationConcurrency()) {
    if (this.busy) {
      return 0;
    }
    this.busy = true;
    try {
      const stale = new Date(Date.now() - 180_000);
      const due = await this.prisma.client.eggVisualAsset.findMany({
        where: {
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
      await Promise.all(
        due.map(
          (row, index) =>
            new Promise<void>((resolve) => {
              setTimeout(() => {
                void this.processAsset(row.id)
                  .catch((error: unknown) => {
                    this.log.warn(error instanceof Error ? error.message : "egg visual falhou");
                  })
                  .finally(() => resolve());
              }, index * gap);
            }),
        ),
      );
      return due.length;
    } finally {
      this.busy = false;
    }
  }

  async processAsset(assetId: string) {
    const asset = await this.prisma.client.eggVisualAsset.findUnique({
      where: { id: assetId },
      include: { egg: true },
    });
    if (!asset || asset.status === "READY" || asset.status === "FAILED_REVIEW") {
      return asset;
    }
    const claimed = await this.prisma.client.eggVisualAsset.updateMany({
      where: { id: asset.id, status: { in: ["PENDING", "FAILED", "GENERATING", "VALIDATING"] } },
      data: { status: "GENERATING", attemptCount: { increment: 1 } },
    });
    if (claimed.count === 0) {
      return asset;
    }
    try {
      const genome = (asset.egg.eggVisualJson ?? {}) as EggVisualGenome;
      const spec = eggSpecFromGenome(asset.eggId, {
        shellShape: genome.shellShape ?? "OVOID",
        primaryColor: genome.primaryColor ?? "#5DBE6E",
        secondaryColor: genome.secondaryColor ?? "#3A2A18",
        accentColor: genome.accentColor ?? "#E4C36A",
        surfacePattern: genome.surfacePattern ?? "VEINS",
        shellMaterialHint: genome.shellMaterialHint ?? "stone-organic",
        elementalHint: genome.elementalHint ?? "earth-nature",
        auraHint: genome.auraHint ?? "none",
        sizeClass: genome.sizeClass ?? "MEDIUM",
        genesisGrade: genome.genesisGrade ?? asset.egg.genesisGrade,
        visualSeed: genome.visualSeed ?? asset.egg.geneticHash,
      });
      const prompt = buildEggImagePrompt(spec);
      if (eggPromptExposesSecrets(prompt)) {
        throw new Error("prompt do ovo vazaria genome secreto");
      }
      const generated = await this.providerFor(asset.provider).generateEgg(prompt, spec.primaryColor);
      const storageKey = eggStorageKey(asset.eggId, asset.generationKey);
      await this.store.put(storageKey, generated.bytes);
      const imageHash = imageHashFromBytes(generated.bytes);
      const publicUrl = `/egg-visuals/${asset.id}/image`;
      const ready = await this.prisma.client.eggVisualAsset.update({
        where: { id: asset.id },
        data: {
          status: "READY",
          storageKey,
          publicUrl,
          imageHash,
          promptHash: sha256Hex(prompt),
          promptText: prompt,
          generatedAt: new Date(),
          failureReason: null,
        },
      });
      await this.prisma.client.egg.update({
        where: { id: asset.eggId },
        data: { eggVisualStatus: "READY" },
      });
      return ready;
    } catch (error) {
      const message = error instanceof Error ? error.message : "egg art failed";
      const attempt = asset.attemptCount + 1;
      const delay = eggVisualGenerationConfig.retryDelaysMs[Math.min(attempt - 1, eggVisualGenerationConfig.retryDelaysMs.length - 1)] ?? 60_000;
      const outage = isImageProviderOutage(message);
      const failed = outage || attempt >= eggVisualGenerationConfig.maxJobAttempts;
      await this.prisma.client.eggVisualAsset.update({
        where: { id: asset.id },
        data: {
          status: outage ? "FAILED_REVIEW" : "FAILED",
          failureReason: message,
          nextAttemptAt: failed ? null : new Date(Date.now() + delay),
        },
      });
      await this.prisma.client.egg.update({
        where: { id: asset.eggId },
        data: { eggVisualStatus: "FAILED" },
      });
      throw error;
    }
  }

  async streamImage(assetId: string) {
    const asset = await this.prisma.client.eggVisualAsset.findUnique({ where: { id: assetId } });
    if (!asset?.storageKey || asset.status !== "READY") {
      throw new Error("Arte do ovo ainda não está pronta.");
    }
    const bytes = await this.store.get(asset.storageKey);
    return new StreamableFile(bytes, { type: "image/png" });
  }

  presentPublic(egg: { id: string; eggVisualStatus: string; visualAssets?: Array<{ id: string; status: string; publicUrl: string | null; imageHash: string | null }> }) {
    const ready = (egg.visualAssets ?? []).find((row) => row.status === "READY" && row.publicUrl);
    return {
      visualStatus: ready ? "READY" : egg.eggVisualStatus,
      visualUrl: ready?.publicUrl ?? null,
      imageHash: ready?.imageHash ?? null,
    };
  }
}
