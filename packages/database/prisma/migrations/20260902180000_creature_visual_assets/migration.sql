-- CreateEnum
CREATE TYPE "LifeStage" AS ENUM ('EGG', 'BABY', 'YOUNG', 'ADULT');

-- CreateEnum
CREATE TYPE "Temperament" AS ENUM ('FRIENDLY', 'NOBLE', 'WILD', 'FERAL', 'MENACING', 'ABYSSAL');

-- CreateEnum
CREATE TYPE "VisualAssetStatus" AS ENUM ('PENDING', 'GENERATING', 'VALIDATING', 'READY', 'FAILED', 'FAILED_REVIEW');

-- AlterTable
ALTER TABLE "creatures"
  ADD COLUMN "life_stage" "LifeStage" NOT NULL DEFAULT 'BABY',
  ADD COLUMN "temperament" "Temperament" NOT NULL DEFAULT 'WILD',
  ADD COLUMN "visual_seed" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "visual_status" "VisualAssetStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "visual_genome_json" JSONB;

-- CreateTable
CREATE TABLE "creature_visual_assets" (
    "id" TEXT NOT NULL,
    "creature_id" TEXT NOT NULL,
    "life_stage" "LifeStage" NOT NULL,
    "status" "VisualAssetStatus" NOT NULL DEFAULT 'PENDING',
    "storage_key" TEXT,
    "public_url" TEXT,
    "image_hash" TEXT,
    "generation_key" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "model_snapshot" TEXT NOT NULL,
    "art_bible_version" INTEGER NOT NULL,
    "prompt_version" INTEGER NOT NULL,
    "visual_genome_version" INTEGER NOT NULL,
    "prompt_hash" TEXT NOT NULL DEFAULT '',
    "prompt_text" TEXT,
    "generated_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "failure_reason" TEXT,
    "qa_score" DECIMAL(5,4),
    "qa_json" JSONB,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "next_attempt_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creature_visual_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "creature_visual_assets_creature_id_life_stage_generation_key_key" ON "creature_visual_assets"("creature_id", "life_stage", "generation_key");

-- CreateIndex
CREATE INDEX "creature_visual_assets_status_next_attempt_at_idx" ON "creature_visual_assets"("status", "next_attempt_at");

-- AddForeignKey
ALTER TABLE "creature_visual_assets" ADD CONSTRAINT "creature_visual_assets_creature_id_fkey" FOREIGN KEY ("creature_id") REFERENCES "creatures"("id") ON DELETE CASCADE ON UPDATE CASCADE;
