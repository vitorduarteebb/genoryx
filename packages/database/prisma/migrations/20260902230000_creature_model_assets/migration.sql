-- CreateEnum
CREATE TYPE "ModelAssetStatus" AS ENUM ('PENDING', 'PREPARING', 'READY', 'FAILED');

-- CreateTable
CREATE TABLE "creature_model_assets" (
    "id" TEXT NOT NULL,
    "creature_id" TEXT NOT NULL,
    "life_stage" "LifeStage" NOT NULL,
    "status" "ModelAssetStatus" NOT NULL DEFAULT 'PENDING',
    "version" INTEGER NOT NULL DEFAULT 1,
    "source_visual_asset_id" TEXT NOT NULL,
    "meshy_task_id" TEXT,
    "meshy_model" TEXT NOT NULL DEFAULT 'latest',
    "storage_key" TEXT,
    "public_url" TEXT,
    "model_hash" TEXT,
    "views_json" JSONB,
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creature_model_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "creature_model_assets_creature_id_life_stage_version_key" ON "creature_model_assets"("creature_id", "life_stage", "version");

-- CreateIndex
CREATE INDEX "creature_model_assets_status_idx" ON "creature_model_assets"("status");

-- AddForeignKey
ALTER TABLE "creature_model_assets" ADD CONSTRAINT "creature_model_assets_creature_id_fkey" FOREIGN KEY ("creature_id") REFERENCES "creatures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creature_model_assets" ADD CONSTRAINT "creature_model_assets_source_visual_asset_id_fkey" FOREIGN KEY ("source_visual_asset_id") REFERENCES "creature_visual_assets"("id") ON UPDATE CASCADE;
