-- CreateEnum
CREATE TYPE "CardArtScope" AS ENUM ('SHARED', 'CREATURE');

-- AlterTable
ALTER TABLE "card_art_assets"
  ADD COLUMN "scope" "CardArtScope" NOT NULL DEFAULT 'SHARED',
  ADD COLUMN "creature_id" TEXT,
  ADD COLUMN "genetic_card_manifestation_id" TEXT,
  ADD COLUMN "life_stage" "LifeStage",
  ADD COLUMN "card_art_life_stage" "LifeStage",
  ADD COLUMN "source_creature_visual_asset_id" TEXT;

-- CreateIndex
CREATE INDEX "card_art_assets_creature_id_genetic_card_manifestation_id_idx" ON "card_art_assets"("creature_id", "genetic_card_manifestation_id");

-- CreateIndex
CREATE INDEX "card_art_assets_scope_status_idx" ON "card_art_assets"("scope", "status");

-- AddForeignKey
ALTER TABLE "card_art_assets" ADD CONSTRAINT "card_art_assets_creature_id_fkey" FOREIGN KEY ("creature_id") REFERENCES "creatures"("id") ON DELETE SET NULL ON UPDATE CASCADE;
