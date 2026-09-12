import { BadRequestException, Injectable, Logger, NotFoundException, StreamableFile } from "@nestjs/common";
import {
  CARD_ART_BASE_VARIANT,
  cardArtGenerationConfig,
  floruneProofCardKeys,
  creatureLocusArtDirection,
  geneticCardArtConfig,
  getCardArtDirection,
  geneticCardArtPolicy,
  isCreatureCardArtAllowed,
  presentCard,
  resolveCanonicalCardArt,
  versionedCardArtUrl,
} from "@nexora/config";
import {
  buildCardArtPrompt,
    backfillGeneticPower,
    buildCreatureCardArtPrompt,
    cardArtSpecFromCatalog,
    generatePowerCards,
    type PowerAssignment,
} from "@nexora/game-engine";
import type { GeneticCardLocusKey, VisualImageProvider } from "@nexora/types";
import { PrismaService } from "../../prisma/prisma.service";
import {
  buildCardArtGenerationKey,
  buildCreatureCardArtGenerationKey,
  currentCardArtProvider,
  imageHashFromBytes,
  isOfficialReadyCardArt,
  officialCardArtJobStatuses,
  resolveCardArtModel,
  sha256Hex,
} from "./generation-key";
import type { CreatureRecord } from "../../common/creature-io";
import { GeneticPowersService } from "../genetic-powers/genetic-powers.service";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { LocalCreatureImageStore } from "../creature-visuals/storage";
import { cardArtQaAccepted } from "./qa";
import { cardArtStorageKey, LocalCardArtStore, type CardArtStore } from "./storage";
import { MockCardArtProvider } from "./providers/mock.provider";
import { OpenAICardArtProvider } from "./providers/openai.provider";
import type { CardArtProvider, GeneratedCardArt } from "./providers/types";

const CANONICAL_FLORUNE_ID = "84ae443c-a1e8-41eb-afe1-aff5763eaf01";

@Injectable()
export class CardArtService {
  private readonly log = new Logger(CardArtService.name);
  private readonly store: CardArtStore;
  private readonly mockProvider = new MockCardArtProvider();
  private readonly openaiProvider = new OpenAICardArtProvider();
  private busy = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly geneticPowers: GeneticPowersService,
  ) {
    this.store = new LocalCardArtStore();
  }

  private providerFor(provider: VisualImageProvider | string | null | undefined): CardArtProvider {
    return provider === "OPENAI" ? this.openaiProvider : this.mockProvider;
  }

  async enqueue(cardKey: string, variant = CARD_ART_BASE_VARIANT, options?: { provider?: VisualImageProvider }) {
    const spec = cardArtSpecFromCatalog(cardKey, variant);
    if (!spec) {
      throw new NotFoundException(`CardDefinition ${cardKey} não existe.`);
    }
    if (variant !== CARD_ART_BASE_VARIANT && !getCardArtDirection(cardKey, variant)) {
      throw new NotFoundException(`Variant ${variant} sem direção artística aprovada.`);
    }
    const provider = options?.provider ?? currentCardArtProvider();
    const { model, snapshot } =
      provider === "OPENAI" ? resolveCardArtModel() : { model: "mock", snapshot: "mock" };
    const generationKey = buildCardArtGenerationKey({
      cardDefinitionId: cardKey,
      variant,
      modelSnapshot: snapshot,
    });
    const existing = await this.prisma.client.cardArtAsset.findUnique({
      where: {
        cardDefinitionId_variantKey_generationKey: {
          cardDefinitionId: cardKey,
          variantKey: variant,
          generationKey,
        },
      },
    });
    if (existing?.status === "READY" && existing.storageKey && (await this.store.isValidPng(existing.storageKey))) {
      return existing;
    }
    if (existing?.status === "READY") {
      await this.prisma.client.cardArtAsset.update({
        where: { id: existing.id },
        data: { status: "PENDING", nextAttemptAt: new Date(), failureReason: "storage missing or invalid" },
      });
      return existing;
    }
    if (existing) {
      return existing;
    }
    try {
      return await this.prisma.client.cardArtAsset.create({
        data: {
          cardDefinitionId: cardKey,
          variantKey: variant,
          element: spec.element,
          status: "PENDING",
          generationKey,
          provider,
          model,
          modelSnapshot: snapshot,
          artBibleVersion: cardArtGenerationConfig.artBibleVersion,
          cardArtVersion: cardArtGenerationConfig.cardArtVersion,
          promptVersion: cardArtGenerationConfig.promptVersion,
          nextAttemptAt: new Date(),
        },
      });
    } catch {
      return this.prisma.client.cardArtAsset.findUnique({
        where: {
          cardDefinitionId_variantKey_generationKey: {
            cardDefinitionId: cardKey,
            variantKey: variant,
            generationKey,
          },
        },
      });
    }
  }

  async enqueueFloruneProof(options?: { provider?: VisualImageProvider }) {
    const jobs = [];
    for (const cardKey of floruneProofCardKeys()) {
      const before = await this.prisma.client.cardArtAsset.count({
        where: { cardDefinitionId: cardKey, variantKey: CARD_ART_BASE_VARIANT },
      });
      const asset = await this.enqueue(cardKey, CARD_ART_BASE_VARIANT, options);
      const after = await this.prisma.client.cardArtAsset.count({
        where: { cardDefinitionId: cardKey, variantKey: CARD_ART_BASE_VARIANT },
      });
      jobs.push({
        cardKey,
        variant: CARD_ART_BASE_VARIANT,
        assetId: asset?.id,
        created: after > before,
        status: asset?.status ?? null,
      });
    }
    return { species: cardArtGenerationConfig.proofSpeciesKey, enqueued: jobs.length, jobs };
  }

  async processDue(
    limit: number = cardArtGenerationConfig.generationConcurrency,
    options?: { provider?: VisualImageProvider; scope?: "SHARED" | "CREATURE"; creatureId?: string },
  ) {
    if (this.busy) {
      return 0;
    }
    this.busy = true;
    try {
      const provider = options?.provider ?? currentCardArtProvider();
      const stale = new Date(Date.now() - 180_000);
      const due = await this.prisma.client.cardArtAsset.findMany({
        where: {
          provider,
          ...(options?.scope ? { scope: options.scope } : {}),
          ...(options?.creatureId ? { creatureId: options.creatureId } : {}),
          OR: [
            {
              status: { in: ["PENDING", "FAILED"] },
              AND: [{ OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: new Date() } }] }],
            },
            { status: { in: ["GENERATING", "VALIDATING"] }, updatedAt: { lte: stale } },
          ],
        },
        orderBy: [{ scope: "asc" }, { createdAt: "asc" }],
        take: limit,
      });
      for (const [index, row] of due.entries()) {
        if (index > 0 && provider === "OPENAI") {
          await new Promise((resolve) => setTimeout(resolve, cardArtGenerationConfig.openaiMinIntervalMs));
        }
        await this.processAsset(row.id);
      }
      return due.length;
    } finally {
      this.busy = false;
    }
  }

  async processAsset(assetId: string) {
    const asset = await this.prisma.client.cardArtAsset.findUnique({ where: { id: assetId } });
    if (!asset || asset.status === "READY" || asset.status === "FAILED_REVIEW") {
      return asset;
    }
    const claimed = await this.prisma.client.cardArtAsset.updateMany({
      where: { id: asset.id, status: { in: ["PENDING", "FAILED", "GENERATING", "VALIDATING"] } },
      data: { status: "GENERATING", attemptCount: { increment: 1 } },
    });
    if (claimed.count === 0) {
      return asset;
    }
    const started = Date.now();
    const imageProvider = this.providerFor(asset.provider);
    try {
      const spec = cardArtSpecFromCatalog(asset.cardDefinitionId, asset.variantKey);
      if (!spec) {
        throw new Error(`CardDefinition ${asset.cardDefinitionId} ausente.`);
      }
      const creatureJob = asset.scope === "CREATURE" && asset.creatureId;
      if (creatureJob && !isCreatureCardArtAllowed(asset.creatureId!, asset.geneticCardManifestationId as GeneticCardLocusKey)) {
        throw new Error("GENETIC_CARD_ART_POLICY bloqueou esta Creature.");
      }
      const creatureRef = creatureJob ? await this.loadCreatureCanonicalVisual(asset.creatureId!) : null;
      if (creatureJob && !creatureRef) {
        throw new Error("CreatureVisualAsset READY canônico obrigatório para CardArtScope=CREATURE.");
      }
      const references = creatureRef
        ? [creatureRef.bytes]
        : spec.showCreature
          ? await this.loadFloruneReference()
          : [];
      const locus = (asset.geneticCardManifestationId ?? spec.cardKey) as GeneticCardLocusKey;
      const powerName = creatureJob ? await this.powerNameFor(asset.creatureId!) : spec.geneticPowerName;
      const promptSpec = {
        ...spec,
        scope: asset.scope,
        showCreature: creatureJob ? true : spec.showCreature,
        artDirection: creatureJob
          ? creatureLocusArtDirection(locus, spec.element)
          : spec.artDirection,
        geneticPowerName: powerName,
        lifeStage: asset.lifeStage ?? spec.lifeStage,
        effectSummary: spec.mechanics.join(", "),
        referenceImages: creatureRef ? ["canonical-creature"] : references.length > 0 ? ["florune-canonical"] : spec.referenceImages,
      };
      const prompt = creatureJob ? buildCreatureCardArtPrompt(promptSpec) : buildCardArtPrompt(promptSpec);
      const promptHash = sha256Hex(prompt);
      const generated: GeneratedCardArt = await imageProvider.generateCardArt(promptSpec, prompt, references);
      await this.prisma.client.cardArtAsset.update({
        where: { id: asset.id },
        data: { status: "VALIDATING", promptHash, promptText: prompt },
      });
      const qa = await imageProvider.validateCardArt(spec, generated.bytes);
      if (!cardArtQaAccepted(qa)) {
        throw Object.assign(new Error(`QA recusou a arte: ${qa.criticalErrors.join(",") || qa.overallScore}`), { qa });
      }
      const key = cardArtStorageKey(asset.cardDefinitionId, asset.variantKey, asset.generationKey);
      await this.store.put(key, generated.bytes);
      const ready = await this.prisma.client.cardArtAsset.update({
        where: { id: asset.id },
        data: {
          status: "READY",
          storageKey: key,
          publicUrl: `/card-art/${asset.id}/image`,
          imageHash: imageHashFromBytes(generated.bytes),
          promptHash,
          promptText: prompt,
          generatedAt: new Date(),
          approvedAt: new Date(),
          qaScore: qa.overallScore,
          qaJson: { ...qa, usage: generated.usage ?? null },
          failureReason: null,
          model: generated.model,
          modelSnapshot: generated.modelSnapshot,
        },
      });
      this.log.log(
        JSON.stringify({
          event: "card-art-ready",
          cardDefinitionId: asset.cardDefinitionId,
          variant: asset.variantKey,
          jobId: asset.id,
          provider: asset.provider,
          duration: Date.now() - started,
        }),
      );
      return ready;
    } catch (error) {
      const message = error instanceof Error ? error.message : "falha card-art";
      const rateLimited = /rate limit|try again in/i.test(message);
      const billingBlocked = /no credits remaining|insufficient_quota|billing/i.test(message);
      const attempts = rateLimited || billingBlocked ? asset.attemptCount : asset.attemptCount + 1;
      const review = !rateLimited && !billingBlocked && attempts >= cardArtGenerationConfig.maxJobAttempts;
      const delay = rateLimited
        ? cardArtGenerationConfig.rateLimitRetryMs
        : billingBlocked
          ? 3_600_000
          : (cardArtGenerationConfig.retryDelaysMs[
            Math.min(Math.max(attempts - 1, 0), cardArtGenerationConfig.retryDelaysMs.length - 1)
          ] ?? 900_000);
      await this.prisma.client.cardArtAsset.update({
        where: { id: asset.id },
        data: {
          status: review ? "FAILED_REVIEW" : "FAILED",
          failureReason: message,
          attemptCount: rateLimited ? asset.attemptCount : attempts,
          nextAttemptAt: review ? null : new Date(Date.now() + delay),
        },
      });
      this.log.warn(
        JSON.stringify({
          event: "card-art-failed",
          cardDefinitionId: asset.cardDefinitionId,
          variant: asset.variantKey,
          jobId: asset.id,
          status: review ? "FAILED_REVIEW" : "FAILED",
        }),
      );
      return null;
    }
  }

  async resolveCanonical(cardKey: string, variant = CARD_ART_BASE_VARIANT) {
    const rows = await this.prisma.client.cardArtAsset.findMany({
      where: { cardDefinitionId: cardKey, variantKey: variant, scope: "SHARED" },
      orderBy: { generatedAt: "desc" },
    });
    return resolveCanonicalCardArt(cardKey, variant, rows);
  }

  async resolveCreatureReady(creatureId: string, cardKey: string, locus?: string | null) {
    const rows = await this.prisma.client.cardArtAsset.findMany({
      where: {
        creatureId,
        scope: "CREATURE",
        status: "READY",
        storageKey: { not: null },
        OR: [{ cardDefinitionId: cardKey }, ...(locus ? [{ geneticCardManifestationId: locus }] : [])],
      },
      orderBy: { generatedAt: "desc" },
    });
    const official = rows.find((row) => isOfficialReadyCardArt(row, "OPENAI"));
    const picked = official ?? rows[0];
    if (picked?.publicUrl && picked.storageKey && (await this.store.isValidPng(picked.storageKey)) && picked.provider !== "MOCK") {
      return resolveCanonicalCardArt(cardKey, CARD_ART_BASE_VARIANT, rows);
    }
    const portrait = await this.officialPortraitHint(creatureId);
    if (portrait) {
      return resolveCanonicalCardArt(cardKey, CARD_ART_BASE_VARIANT, [portrait]);
    }
    if (picked?.publicUrl && picked.storageKey && (await this.store.isValidPng(picked.storageKey))) {
      return resolveCanonicalCardArt(cardKey, CARD_ART_BASE_VARIANT, [picked]);
    }
    return this.resolveCanonical(cardKey);
  }

  async resolveReady(cardKey: string, variant = CARD_ART_BASE_VARIANT) {
    const { snapshot } = currentCardArtProvider() === "OPENAI" ? resolveCardArtModel() : { snapshot: "mock" };
    const generationKey = buildCardArtGenerationKey({
      cardDefinitionId: cardKey,
      variant,
      modelSnapshot: currentCardArtProvider() === "OPENAI" ? snapshot : "mock",
    });
    const current = await this.prisma.client.cardArtAsset.findUnique({
      where: {
        cardDefinitionId_variantKey_generationKey: {
          cardDefinitionId: cardKey,
          variantKey: variant,
          generationKey,
        },
      },
    });
    if (current?.status === "READY" && current.storageKey && (await this.store.isValidPng(current.storageKey))) {
      return current;
    }
    return this.prisma.client.cardArtAsset.findFirst({
      where: {
        cardDefinitionId: cardKey,
        variantKey: variant,
        scope: "SHARED",
        status: "READY",
        storageKey: { not: null },
      },
      orderBy: { generatedAt: "desc" },
    });
  }

  async streamImage(assetId: string) {
    const asset = await this.prisma.client.cardArtAsset.findUnique({ where: { id: assetId } });
    if (!asset?.storageKey || asset.status !== "READY") {
      throw new NotFoundException("Arte da carta ainda não está pronta.");
    }
    if (!(await this.store.isValidPng(asset.storageKey))) {
      throw new NotFoundException("Arte da carta ausente no storage.");
    }
    return new StreamableFile(await this.store.get(asset.storageKey), { type: "image/png", disposition: "inline" });
  }

  async streamByCard(cardKey: string, variant = CARD_ART_BASE_VARIANT) {
    const asset = await this.resolveReady(cardKey, variant);
    if (!asset) {
      throw new NotFoundException("Arte da carta ainda não está pronta.");
    }
    return this.streamImage(asset.id);
  }

  private async loadFloruneReference(): Promise<Buffer[]> {
    const row =
      (await this.prisma.client.creatureVisualAsset.findFirst({
        where: {
          creatureId: CANONICAL_FLORUNE_ID,
          provider: "OPENAI",
          status: "READY",
          storageKey: { not: null },
        },
        orderBy: { generatedAt: "desc" },
      })) ??
      (await this.prisma.client.creatureVisualAsset.findFirst({
        where: {
          provider: "OPENAI",
          status: "READY",
          storageKey: { not: null },
          creature: { species: { key: "florune" } },
        },
        orderBy: { generatedAt: "desc" },
      }));
    if (!row?.storageKey) {
      return [];
    }
    try {
      const visuals = new LocalCreatureImageStore();
      if (!(await visuals.isValidPng(row.storageKey))) {
        return [];
      }
      return [await visuals.get(row.storageKey)];
    } catch {
      return [];
    }
  }

  async describeProof() {
    const rows = [];
    for (const cardKey of floruneProofCardKeys()) {
      const presented = presentCard(cardKey);
      const ready = await this.resolveReady(cardKey, CARD_ART_BASE_VARIANT);
      const asset =
        ready ??
        (await this.prisma.client.cardArtAsset.findFirst({
          where: { cardDefinitionId: cardKey, variantKey: CARD_ART_BASE_VARIANT },
          orderBy: { createdAt: "desc" },
        }));
      rows.push({
        cardKey,
        name: presented.name,
        type: presented.type,
        typeLabel: presented.typeLabel,
        element: presented.element,
        elementLabel: presented.elementLabel,
        cost: presented.cost,
        locus: presented.locus,
        tags: presented.tags,
        text: presented.text,
        variant: CARD_ART_BASE_VARIANT,
        status: ready?.status ?? asset?.status ?? "PENDING",
        provider: ready?.provider ?? asset?.provider ?? null,
        model: ready?.model ?? asset?.model ?? null,
        imageUrl:
          ready?.publicUrl && ready.imageHash
            ? `${ready.publicUrl}?v=${ready.imageHash.slice(0, 16)}`
            : (ready?.publicUrl ?? null),
        imageHash: ready?.imageHash ?? null,
        usage: (ready?.qaJson as { usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number; images?: number } } | null)?.usage ?? null,
        failureReason: asset?.failureReason ?? null,
      });
    }
    return {
      species: cardArtGenerationConfig.proofSpeciesKey,
      title: "Florune G1–G10",
      cards: rows,
    };
  }

  private async powerNameFor(creatureId: string): Promise<string> {
    const row = await this.prisma.client.creature.findUnique({
      where: { id: creatureId },
      include: { species: true, geneticPower: { include: { power: true } } },
    });
    if (row?.geneticPower?.power.namePt) {
      return row.geneticPower.power.namePt;
    }
    if (!row) {
      return "Genetic Power";
    }
    return (
      backfillGeneticPower({
        creatureId: row.id,
        speciesKey: row.species.key,
        element: row.elementPrimary,
        geneticHash: row.geneticHash,
      }).genome.namePt ?? "Genetic Power"
    );
  }

  async enqueueForCreature(creatureId: string, options?: { provider?: VisualImageProvider; requirePolicy?: boolean }) {
    return this.enqueueCreatureProof(creatureId, options);
  }

  async enqueueMissingForReadyCreatures(limit = geneticCardArtConfig.backfillBatch) {
    if (geneticCardArtPolicy() === "SHARED") {
      return { scanned: 0, enqueued: 0 };
    }
    const provider = currentCardArtProvider();
    const ready = await this.prisma.client.creature.findMany({
      where: {
        visualStatus: "READY",
        ...(provider === "OPENAI"
          ? { visualAssets: { some: { provider: "OPENAI", status: "READY" } } }
          : {}),
      },
      select: { id: true },
      orderBy: { birthDate: "asc" },
      take: 80,
    });
    let scanned = 0;
    let enqueued = 0;
    for (const row of ready) {
      if (!isCreatureCardArtAllowed(row.id)) {
        continue;
      }
      const existing = await this.prisma.client.cardArtAsset.count({
        where: {
          creatureId: row.id,
          scope: "CREATURE",
          provider,
          status: { in: [...officialCardArtJobStatuses] },
        },
      });
      if (existing >= 10) {
        continue;
      }
      scanned += 1;
      try {
        const result = await this.enqueueCreatureProof(row.id, { provider });
        enqueued += result.jobs.filter((job) => job.created).length;
      } catch (error) {
        this.log.warn(error instanceof Error ? error.message : `enqueue card-art falhou ${row.id}`);
      }
      if (scanned >= limit) {
        break;
      }
    }
    return { scanned, enqueued };
  }

  async enqueueCreatureProof(creatureId: string, options?: { provider?: VisualImageProvider; requirePolicy?: boolean }) {
    if ((options?.requirePolicy ?? true) && !isCreatureCardArtAllowed(creatureId)) {
      throw new BadRequestException("GENETIC_CARD_ART_POLICY não autoriza CardArt CREATURE para esta ficha.");
    }
    const creature = await this.prisma.client.creature.findUnique({
      where: { id: creatureId },
      include: {
        species: true,
        mutation: true,
        loci: true,
        visualAssets: true,
        modelAssets: true,
        geneticPower: { include: { power: true } },
      },
    });
    if (!creature) {
      throw new NotFoundException("Creature não encontrada.");
    }
    await this.geneticPowers.ensureForCreature(creature as CreatureRecord);
    const powered = await this.prisma.client.creature.findUnique({
      where: { id: creatureId },
      include: { species: true, geneticPower: { include: { power: true } } },
    });
    if (!powered) {
      throw new NotFoundException("Creature não encontrada.");
    }
    const speciesKey = powered.species.key;
    const provider = options?.provider ?? currentCardArtProvider();
    const visual = await this.loadCreatureCanonicalVisual(creatureId, { provider });
    if (!visual) {
      throw new BadRequestException(
        provider === "OPENAI"
          ? "Canonical CreatureVisualAsset OPENAI READY ausente."
          : "Canonical CreatureVisualAsset READY ausente.",
      );
    }
    const genome =
      (powered.geneticPower?.power.definitionJson as PowerAssignment["genome"] | undefined) ??
      backfillGeneticPower({
        creatureId: powered.id,
        speciesKey,
        element: powered.elementPrimary,
        geneticHash: powered.geneticHash,
      }).genome;
    const manifestations = generatePowerCards({ power: genome, speciesKey, seed: 1 });
    if (manifestations.length !== 10) {
      throw new BadRequestException("GeneticCardManifestation deve ter exatamente 10 cartas.");
    }
    const { model, snapshot } = provider === "OPENAI" ? resolveCardArtModel() : { model: "mock", snapshot: "mock" };
    const jobs = [];
    for (const card of manifestations) {
      const catalogKey = card.catalogKey;
      if (!catalogKey) {
        throw new BadRequestException(`Manifestação ${card.locus} sem CardDefinition canônica.`);
      }
      const ready = await this.prisma.client.cardArtAsset.findFirst({
        where: {
          scope: "CREATURE",
          creatureId,
          geneticCardManifestationId: card.locus,
          status: "READY",
          provider,
        },
        orderBy: { generatedAt: "desc" },
      });
      if (ready?.storageKey && isOfficialReadyCardArt(ready, provider) && (await this.store.isValidPng(ready.storageKey))) {
        jobs.push({
          locus: card.locus,
          cardKey: catalogKey,
          assetId: ready.id,
          created: false,
          status: ready.status,
        });
        continue;
      }
      const generationKey = buildCreatureCardArtGenerationKey({
        creatureId,
        manifestationId: card.locus,
        canonicalVisualImageHash: visual.imageHash,
        lifeStage: powered.lifeStage,
        modelSnapshot: snapshot,
      });
      const existing = await this.prisma.client.cardArtAsset.findUnique({
        where: {
          cardDefinitionId_variantKey_generationKey: {
            cardDefinitionId: catalogKey,
            variantKey: CARD_ART_BASE_VARIANT,
            generationKey,
          },
        },
      });
      if (existing) {
        jobs.push({
          locus: card.locus,
          cardKey: catalogKey,
          assetId: existing.id,
          created: false,
          status: existing.status,
        });
        continue;
      }
      const spec = cardArtSpecFromCatalog(catalogKey);
      const created = await this.prisma.client.cardArtAsset.create({
        data: {
          cardDefinitionId: catalogKey,
          variantKey: CARD_ART_BASE_VARIANT,
          element: spec?.element ?? "EARTH",
          scope: "CREATURE",
          creatureId,
          geneticCardManifestationId: card.locus,
          lifeStage: powered.lifeStage,
          cardArtLifeStage: powered.lifeStage,
          sourceCreatureVisualAssetId: visual.assetId,
          status: "PENDING",
          generationKey,
          provider,
          model,
          modelSnapshot: snapshot,
          artBibleVersion: cardArtGenerationConfig.artBibleVersion,
          cardArtVersion: geneticCardArtConfig.cardArtVersion,
          promptVersion: geneticCardArtConfig.promptVersion,
          nextAttemptAt: new Date(),
        },
      });
      jobs.push({
        locus: card.locus,
        cardKey: catalogKey,
        assetId: created.id,
        created: true,
        status: created.status,
      });
    }
    return {
      scope: "CREATURE" as const,
      creatureId,
      species: speciesKey,
      lifeStage: creature.lifeStage,
      sourceVisualAssetId: visual.assetId,
      canonicalVisualImageHash: visual.imageHash,
      enqueued: jobs.length,
      stopped: false,
      jobs,
    };
  }

  async importCreatureArtsFromDir(creatureId: string, dir: string) {
    if (!isCreatureCardArtAllowed(creatureId)) {
      throw new BadRequestException("GENETIC_CARD_ART_POLICY não autoriza import CREATURE para esta ficha.");
    }
    const queued = await this.enqueueCreatureProof(creatureId, { provider: "OPENAI" });
    const jobs = [];
    for (const job of queued.jobs) {
      const file = join(dir, `${job.locus}.png`);
      const bytes = await readFile(file);
      if (bytes.length < 1024 || bytes[0] !== 0x89 || bytes[1] !== 0x50) {
        throw new BadRequestException(`${job.locus} não é PNG válido.`);
      }
      const asset = await this.prisma.client.cardArtAsset.findUnique({ where: { id: job.assetId } });
      if (!asset) {
        throw new NotFoundException(`Asset ${job.locus} ausente.`);
      }
      if (asset.status === "READY" && asset.storageKey && (await this.store.isValidPng(asset.storageKey))) {
        jobs.push({
          locus: job.locus,
          cardKey: job.cardKey,
          assetId: asset.id,
          imported: false,
          status: "READY",
          imageHash: asset.imageHash,
        });
        continue;
      }
      const key = cardArtStorageKey(asset.cardDefinitionId, asset.variantKey, asset.generationKey);
      await this.store.put(key, bytes);
      const ready = await this.prisma.client.cardArtAsset.update({
        where: { id: asset.id },
        data: {
          status: "READY",
          storageKey: key,
          publicUrl: `/card-art/${asset.id}/image`,
          imageHash: imageHashFromBytes(bytes),
          generatedAt: new Date(),
          approvedAt: new Date(),
          failureReason: null,
          provider: "OPENAI",
          model: "gpt-image-2",
          modelSnapshot: "gpt-image-2-2026-04-21",
        },
      });
      jobs.push({
        locus: job.locus,
        cardKey: job.cardKey,
        assetId: ready.id,
        imported: true,
        status: ready.status,
        imageHash: ready.imageHash,
      });
    }
    return {
      creatureId,
      imported: jobs.filter((row) => row.imported).length,
      reused: jobs.filter((row) => !row.imported).length,
      otherCreaturesProcessed: 0,
      jobs,
    };
  }

  async attachCreatureArts<T extends { locus: string; catalogKey: string | null }>(creatureId: string, cards: T[]) {
    const arts = await this.prisma.client.cardArtAsset.findMany({
      where: { creatureId, scope: "CREATURE", status: "READY" },
      orderBy: { generatedAt: "desc" },
    });
    const portrait = await this.officialPortraitHint(creatureId);
    return cards.map((card) => {
      const matching = arts.filter(
        (row) => row.geneticCardManifestationId === card.locus || row.cardDefinitionId === card.catalogKey,
      );
      const resolved = resolveCanonicalCardArt(card.catalogKey ?? card.locus, CARD_ART_BASE_VARIANT, matching);
      if (resolved.source === "openai") {
        return {
          ...card,
          artUrl: resolved.artUrl,
          imageHash: resolved.imageHash,
        };
      }
      if (portrait) {
        return {
          ...card,
          artUrl: versionedCardArtUrl(portrait.publicUrl, portrait.imageHash),
          imageHash: portrait.imageHash ?? null,
        };
      }
      return {
        ...card,
        artUrl: resolved.artUrl,
        imageHash: resolved.imageHash,
      };
    });
  }

  async describeCreatureProof(creatureId: string) {
    const creature = await this.prisma.client.creature.findUnique({
      where: { id: creatureId },
      include: { species: true, geneticPower: { include: { power: true } } },
    });
    if (!creature) {
      throw new NotFoundException("Creature não encontrada.");
    }
    const genome =
      (creature.geneticPower?.power.definitionJson as PowerAssignment["genome"] | undefined) ??
      backfillGeneticPower({
        creatureId: creature.id,
        speciesKey: creature.species.key,
        element: creature.elementPrimary,
        geneticHash: creature.geneticHash,
      }).genome;
    const manifestations = generatePowerCards({ power: genome, speciesKey: creature.species.key, seed: 1 });
    const rows = [];
    for (const card of manifestations) {
      const presented = card.catalogKey ? presentCard(card.catalogKey) : null;
      const ready = await this.prisma.client.cardArtAsset.findFirst({
        where: { creatureId, geneticCardManifestationId: card.locus, scope: "CREATURE", status: "READY" },
        orderBy: { generatedAt: "desc" },
      });
      const asset =
        ready ??
        (await this.prisma.client.cardArtAsset.findFirst({
          where: { creatureId, geneticCardManifestationId: card.locus, scope: "CREATURE" },
          orderBy: { createdAt: "desc" },
        }));
      rows.push({
        cardKey: card.catalogKey,
        name: card.namePt,
        nameEn: card.name,
        type: presented?.type ?? null,
        typeLabel: presented?.typeLabel ?? null,
        element: presented?.element ?? "EARTH",
        elementLabel: presented?.elementLabel ?? "Terra",
        cost: card.cost,
        locus: card.locus,
        text: card.text,
        tags: presented?.tags ?? [],
        variant: CARD_ART_BASE_VARIANT,
        scope: "CREATURE",
        status: ready?.status ?? asset?.status ?? "PENDING",
        provider: ready?.provider ?? asset?.provider ?? null,
        model: ready?.model ?? asset?.model ?? null,
        imageUrl:
          ready?.publicUrl && ready.imageHash
            ? `${ready.publicUrl}?v=${ready.imageHash.slice(0, 16)}`
            : (ready?.publicUrl ?? null),
        imageHash: ready?.imageHash ?? null,
        usage:
          (ready?.qaJson as { usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number; images?: number } } | null)
            ?.usage ?? null,
        failureReason: asset?.failureReason ?? null,
      });
    }
    return {
      title: `${creature.name ?? creature.species.name} G1–G10`,
      species: creature.species.key,
      creatureId,
      lifeStage: creature.lifeStage,
      geneticPower: genome?.namePt ?? null,
      cards: rows,
    };
  }

  private async officialPortraitHint(creatureId: string) {
    const row = await this.prisma.client.creatureVisualAsset.findFirst({
      where: {
        creatureId,
        provider: "OPENAI",
        status: "READY",
        publicUrl: { not: null },
      },
      orderBy: { generatedAt: "desc" },
    });
    if (!row?.publicUrl) {
      return null;
    }
    return {
      status: "READY" as const,
      provider: "OPENAI" as const,
      publicUrl: row.publicUrl,
      imageHash: row.imageHash,
    };
  }

  private async loadCreatureCanonicalVisual(
    creatureId: string,
    options?: { provider?: VisualImageProvider },
  ): Promise<{
    bytes: Buffer;
    assetId: string;
    imageHash: string;
    lifeStage: string;
  } | null> {
    const creature = await this.prisma.client.creature.findUnique({
      where: { id: creatureId },
      select: { lifeStage: true },
    });
    const preferred = options?.provider;
    const row =
      (await this.prisma.client.creatureVisualAsset.findFirst({
        where: {
          creatureId,
          lifeStage: creature?.lifeStage ?? "BABY",
          status: "READY",
          storageKey: { not: null },
          imageHash: { not: null },
          ...(preferred ? { provider: preferred } : {}),
        },
        orderBy: [{ provider: "desc" }, { generatedAt: "desc" }],
      })) ??
      (preferred
        ? null
        : await this.prisma.client.creatureVisualAsset.findFirst({
            where: { creatureId, status: "READY", storageKey: { not: null }, imageHash: { not: null } },
            orderBy: { generatedAt: "desc" },
          }));
    if (!row?.storageKey || !row.imageHash) {
      return null;
    }
    try {
      const visuals = new LocalCreatureImageStore();
      if (!(await visuals.isValidPng(row.storageKey))) {
        return null;
      }
      return {
        bytes: await visuals.get(row.storageKey),
        assetId: row.id,
        imageHash: row.imageHash,
        lifeStage: row.lifeStage,
      };
    } catch {
      return null;
    }
  }
}
