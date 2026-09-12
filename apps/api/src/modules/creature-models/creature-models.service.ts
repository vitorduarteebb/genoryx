import { createHash } from "node:crypto";
import { Injectable, Logger, NotFoundException, StreamableFile } from "@nestjs/common";
import { meshyGenerationConfig } from "@nexora/config";
import { buildTurnaroundPrompt, visualSpecFromGenome } from "@nexora/game-engine";
import type { LifeStage, TurnaroundView } from "@nexora/types";
import type { CreatureRecord } from "../../common/creature-io";
import { PrismaService } from "../../prisma/prisma.service";
import { CreatureVisualsService } from "../creature-visuals/creature-visuals.service";
import { OpenAICreatureImageProvider } from "../creature-visuals/providers/openai.provider";
import { LocalCreatureImageStore } from "../creature-visuals/storage";
import { MeshyMultiImageClient } from "./meshy.client";
import { LocalCreatureModelStore, modelStorageKey } from "./storage";

export const FLORUNE_POC_ID = "84ae443c-a1e8-41eb-afe1-aff5763eaf01";

type ViewsJson = Partial<Record<TurnaroundView, string>>;

@Injectable()
export class CreatureModelsService {
  private readonly log = new Logger(CreatureModelsService.name);
  private readonly models = new LocalCreatureModelStore();
  private readonly portraits = new LocalCreatureImageStore();
  private readonly openai = new OpenAICreatureImageProvider();
  private readonly meshy = new MeshyMultiImageClient();

  constructor(
    private readonly prisma: PrismaService,
    private readonly visuals: CreatureVisualsService,
  ) {}

  async prepare(creatureId: string) {
    const creature = await this.prisma.client.creature.findUnique({
      where: { id: creatureId },
      include: { species: true, mutation: true, loci: true, visualAssets: true, modelAssets: true },
    });
    if (!creature) {
      throw new NotFoundException("Criatura não encontrada.");
    }
    const geneticHash = creature.geneticHash;
    const visualSeed = creature.visualSeed;
    const source = creature.visualAssets.find(
      (asset) =>
        asset.lifeStage === creature.lifeStage &&
        asset.provider === "OPENAI" &&
        asset.status === "READY" &&
        asset.storageKey,
    );
    if (!source?.storageKey) {
      throw new Error("Prepare 3D exige OPENAI READY do lifeStage atual. MOCK não entra.");
    }

    const existing = creature.modelAssets.find(
      (row) => row.lifeStage === creature.lifeStage && row.status === "READY" && row.storageKey,
    );
    if (existing?.storageKey && (await this.models.exists(existing.storageKey))) {
      return existing;
    }

    const version = creature.modelAssets.reduce((max, asset) => Math.max(max, asset.version), 0) + 1;
    const row = await this.prisma.client.creatureModelAsset.create({
      data: {
        creatureId,
        lifeStage: creature.lifeStage,
        status: "PREPARING",
        version,
        sourceVisualAssetId: source.id,
        meshyModel: process.env.MESHY_AI_MODEL?.trim() || meshyGenerationConfig.defaultModel,
      },
    });

    try {
      const genome = await this.visuals.ensureGenome(creature as CreatureRecord);
      const spec = visualSpecFromGenome(creature.id, { ...genome, lifeStage: creature.lifeStage as LifeStage });
      const quarter = await this.portraits.get(source.storageKey);
      const views: Record<Exclude<TurnaroundView, "THREE_QUARTER">, Buffer> = {
        FRONT: await this.turnaround(spec, "FRONT", quarter),
        SIDE: await this.turnaround(spec, "SIDE", quarter),
        BACK: await this.turnaround(spec, "BACK", quarter),
      };

      const viewKeys: ViewsJson = { THREE_QUARTER: source.publicUrl ?? undefined };
      for (const [view, bytes] of Object.entries(views) as Array<[Exclude<TurnaroundView, "THREE_QUARTER">, Buffer]>) {
        const key = modelStorageKey(creatureId, creature.lifeStage, version, `${view.toLowerCase()}.png`);
        await this.models.put(key, bytes);
        viewKeys[view] = `/creature-models/${row.id}/views/${view.toLowerCase()}`;
      }

      const ordered = [views.FRONT, quarter, views.SIDE, views.BACK];
      const taskId = await this.meshy.createFromViews(ordered);
      await this.prisma.client.creatureModelAsset.update({
        where: { id: row.id },
        data: { meshyTaskId: taskId, viewsJson: viewKeys },
      });
      const glb = await this.meshy.waitForGlb(taskId);
      const glbKey = modelStorageKey(creatureId, creature.lifeStage, version, "model.glb");
      await this.models.put(glbKey, glb.bytes);
      const ready = await this.prisma.client.creatureModelAsset.update({
        where: { id: row.id },
        data: {
          status: "READY",
          storageKey: glbKey,
          publicUrl: `/creature-models/${row.id}/model`,
          modelHash: createHash("sha256").update(glb.bytes).digest("hex"),
          viewsJson: viewKeys,
          failureReason: null,
        },
      });
      const after = await this.prisma.client.creature.findUniqueOrThrow({ where: { id: creatureId } });
      if (after.geneticHash !== geneticHash || after.visualSeed !== visualSeed) {
        throw new Error("Prepare 3D recusou alterar geneticHash/visualSeed.");
      }
      if (source.imageHash) {
        const still = await this.prisma.client.creatureVisualAsset.findUniqueOrThrow({ where: { id: source.id } });
        if (still.imageHash !== source.imageHash) {
          throw new Error("Prepare 3D recusou alterar imageHash do retrato.");
        }
      }
      this.log.log(JSON.stringify({ creatureId, modelId: ready.id, status: "READY", meshyTaskId: taskId }));
      return ready;
    } catch (error) {
      const message = error instanceof Error ? error.message : "falha 3D";
      await this.prisma.client.creatureModelAsset.update({
        where: { id: row.id },
        data: { status: "FAILED", failureReason: message },
      });
      this.log.warn(JSON.stringify({ creatureId, modelId: row.id, status: "FAILED" }));
      throw error;
    }
  }

  async streamModel(modelId: string) {
    const row = await this.prisma.client.creatureModelAsset.findUnique({ where: { id: modelId } });
    if (!row?.storageKey || row.status !== "READY") {
      throw new NotFoundException("Modelo 3D ainda não está pronto.");
    }
    const bytes = await this.models.get(row.storageKey);
    return new StreamableFile(bytes, { type: "model/gltf-binary", disposition: "inline" });
  }

  async streamView(modelId: string, view: string) {
    const row = await this.prisma.client.creatureModelAsset.findUnique({ where: { id: modelId } });
    if (!row) {
      throw new NotFoundException("Modelo não encontrado.");
    }
    const key = modelStorageKey(row.creatureId, row.lifeStage, row.version, `${view}.png`);
    if (!(await this.models.exists(key))) {
      throw new NotFoundException("Vista turnaround ausente.");
    }
    return new StreamableFile(await this.models.get(key), { type: "image/png", disposition: "inline" });
  }

  private async turnaround(
    spec: ReturnType<typeof visualSpecFromGenome>,
    view: Exclude<TurnaroundView, "THREE_QUARTER">,
    reference: Buffer,
  ) {
    const prompt = buildTurnaroundPrompt(spec, view);
    const generated = await this.openai.generateTurnaroundView(spec, prompt, reference);
    return generated.bytes;
  }
}
