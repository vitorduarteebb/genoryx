import { Injectable } from "@nestjs/common";
import { resolveBattleCreatureVisual, speciesBattleVisuals, type BattleCreatureVisual } from "@nexora/config";
import { presentModel } from "../../common/creature-model-present";
import { presentCollectionVisual } from "../../common/creature-visual-present";
import { type CreatureRecord } from "../../common/creature-io";
import { PrismaService } from "../../prisma/prisma.service";

const creatureInclude = { species: true, mutation: true, loci: true, visualAssets: true, modelAssets: true } as const;

@Injectable()
export class BattleVisualsService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveForCreature(row: CreatureRecord, speciesMaster?: BattleCreatureVisual | null): Promise<BattleCreatureVisual> {
    const portrait = presentCollectionVisual(row);
    const model = presentModel(row);
    const genome = (row.visualGenomeJson ?? {}) as { auraType?: { expressed?: string }; chassis?: unknown };
    return resolveBattleCreatureVisual({
      lifeStage: row.lifeStage,
      temperament: row.temperament,
      bodyPlan: row.bodyPlanExpressed,
      mutation: row.mutation?.key ?? null,
      aura: genome.auraType?.expressed ?? null,
      visualSeed: row.visualSeed,
      chassis: genome.chassis ?? null,
      modelUrl: model?.url ?? null,
      portrait: { url: portrait.url, imageHash: portrait.imageHash, provider: portrait.provider, status: portrait.status },
      speciesMaster: speciesMaster
        ? { portraitUrl: speciesMaster.portraitUrl, modelUrl: speciesMaster.modelUrl, imageHash: speciesMaster.imageHash, provider: speciesMaster.provider }
        : null,
    });
  }

  async resolveForSpecies(speciesKey: string): Promise<BattleCreatureVisual> {
    const preferred = speciesBattleVisuals[speciesKey]?.masterCreatureId;
    if (preferred) {
      const owned = await this.prisma.client.creature.findUnique({
        where: { id: preferred },
        include: creatureInclude,
      });
      if (owned) {
        const resolved = await this.resolveForCreature(owned as CreatureRecord);
        if (resolved.portraitUrl || resolved.modelUrl) {
          return { ...resolved, source: "species-master", renderMode: resolved.modelUrl ? "MODEL_3D" : "SPECIES_MASTER" };
        }
      }
    }
    const asset = await this.prisma.client.creatureVisualAsset.findFirst({
      where: {
        status: "READY",
        provider: "OPENAI",
        publicUrl: { not: null },
        creature: { species: { key: speciesKey } },
      },
      include: { creature: { include: creatureInclude } },
      orderBy: { generatedAt: "desc" },
    });
    if (asset?.creature) {
      const resolved = await this.resolveForCreature(asset.creature as CreatureRecord);
      return { ...resolved, source: "species-master", renderMode: resolved.modelUrl ? "MODEL_3D" : "SPECIES_MASTER" };
    }
    const anyReady = await this.prisma.client.creatureVisualAsset.findFirst({
      where: { status: "READY", publicUrl: { not: null }, creature: { species: { key: speciesKey } } },
      include: { creature: { include: creatureInclude } },
      orderBy: { generatedAt: "desc" },
    });
    if (anyReady?.creature) {
      const resolved = await this.resolveForCreature(anyReady.creature as CreatureRecord);
      return { ...resolved, source: "species-master", renderMode: "SPECIES_MASTER" };
    }
    return resolveBattleCreatureVisual({ lifeStage: "BABY" });
  }

  async resolveCombatant(input: { creatureId?: string; speciesKey: string }, cache: Map<string, BattleCreatureVisual>) {
    if (input.creatureId) {
      const row = await this.prisma.client.creature.findUnique({
        where: { id: input.creatureId },
        include: creatureInclude,
      });
      if (row) {
        const master = await this.cachedSpecies(input.speciesKey || row.species.key, cache);
        return this.resolveForCreature(row as CreatureRecord, master);
      }
    }
    return this.cachedSpecies(input.speciesKey, cache);
  }

  async speciesCatalog() {
    const keys = Object.keys(speciesBattleVisuals);
    const cache = new Map<string, BattleCreatureVisual>();
    const rows = [];
    for (const key of keys) {
      const visual = await this.cachedSpecies(key, cache);
      rows.push({
        speciesKey: key,
        name: speciesBattleVisuals[key]?.displayName ?? key,
        hasWildVisual: Boolean(visual.portraitUrl || visual.modelUrl),
        visual,
      });
    }
    return { species: rows };
  }

  async diagnose() {
    const creatures = await this.prisma.client.creature.findMany({
      include: { species: true, visualAssets: true, modelAssets: true },
    });
    let openaiPortrait = 0;
    let mockOnly = 0;
    let with3d = 0;
    let withoutVisual = 0;
    for (const row of creatures) {
      const openai = row.visualAssets.some((asset) => asset.provider === "OPENAI" && asset.status === "READY");
      const mock = row.visualAssets.some((asset) => asset.provider === "MOCK" && asset.status === "READY");
      const model = row.modelAssets.some((asset) => asset.status === "READY" && asset.publicUrl);
      if (openai) {
        openaiPortrait += 1;
      } else if (mock) {
        mockOnly += 1;
      } else {
        withoutVisual += 1;
      }
      if (model) {
        with3d += 1;
      }
    }
    const catalog = await this.speciesCatalog();
    return {
      players: {
        total: creatures.length,
        openaiPortrait,
        mockOnly,
        with3d,
        withoutVisual,
      },
      species: catalog.species.map((row) => ({
        key: row.speciesKey,
        name: row.name,
        withWildBattleVisual: row.hasWildVisual,
        renderMode: row.visual.renderMode,
        source: row.visual.source,
      })),
    };
  }

  private async cachedSpecies(speciesKey: string, cache: Map<string, BattleCreatureVisual>) {
    const hit = cache.get(speciesKey);
    if (hit) {
      return hit;
    }
    const visual = await this.resolveForSpecies(speciesKey);
    cache.set(speciesKey, visual);
    return visual;
  }
}
