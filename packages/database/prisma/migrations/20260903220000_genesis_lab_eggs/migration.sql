-- CreateEnum
CREATE TYPE "GenesisGrade" AS ENUM ('COMMON', 'REFINED', 'RARE', 'EXCEPTIONAL', 'GENESIS');

-- AlterTable
ALTER TABLE "eggs"
ADD COLUMN "genesis_grade" "GenesisGrade" NOT NULL DEFAULT 'COMMON',
ADD COLUMN "complexity_score" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "incubation_started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "egg_visual_status" "VisualAssetStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "egg_visual_json" JSONB,
ADD COLUMN "power_plan_json" JSONB;

-- Map rarity antiga → GenesisGrade (sem apagar ovos)
UPDATE "eggs" SET "genesis_grade" = CASE "rarity"
  WHEN 'COMMON' THEN 'COMMON'::"GenesisGrade"
  WHEN 'UNCOMMON' THEN 'REFINED'::"GenesisGrade"
  WHEN 'RARE' THEN 'RARE'::"GenesisGrade"
  WHEN 'EPIC' THEN 'EXCEPTIONAL'::"GenesisGrade"
  ELSE 'GENESIS'::"GenesisGrade"
END;

UPDATE "eggs" SET "incubation_started_at" = "created_at";

-- Alpha: ovos ainda incubando com tempo absurdo voltam ao teto do grade (não apaga)
UPDATE "eggs"
SET "hatches_at" = NOW() + (
  CASE "genesis_grade"
    WHEN 'COMMON' THEN INTERVAL '2 minutes'
    WHEN 'REFINED' THEN INTERVAL '5 minutes'
    WHEN 'RARE' THEN INTERVAL '10 minutes'
    WHEN 'EXCEPTIONAL' THEN INTERVAL '20 minutes'
    WHEN 'GENESIS' THEN INTERVAL '30 minutes'
  END
)
WHERE "status" = 'INCUBATING'
  AND "hatches_at" > NOW() + INTERVAL '31 minutes';

-- CreateTable
CREATE TABLE "egg_visual_assets" (
    "id" TEXT NOT NULL,
    "egg_id" TEXT NOT NULL,
    "status" "VisualAssetStatus" NOT NULL DEFAULT 'PENDING',
    "storage_key" TEXT,
    "public_url" TEXT,
    "image_hash" TEXT,
    "generation_key" TEXT NOT NULL,
    "provider" "VisualImageProvider" NOT NULL DEFAULT 'MOCK',
    "model" TEXT NOT NULL,
    "model_snapshot" TEXT NOT NULL,
    "art_bible_version" INTEGER NOT NULL,
    "prompt_version" INTEGER NOT NULL,
    "visual_genome_version" INTEGER NOT NULL,
    "prompt_hash" TEXT NOT NULL DEFAULT '',
    "prompt_text" TEXT,
    "generated_at" TIMESTAMP(3),
    "failure_reason" TEXT,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "next_attempt_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "egg_visual_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "egg_visual_assets_egg_id_generation_key_key" ON "egg_visual_assets"("egg_id", "generation_key");

-- CreateIndex
CREATE INDEX "egg_visual_assets_status_next_attempt_at_idx" ON "egg_visual_assets"("status", "next_attempt_at");

-- AddForeignKey
ALTER TABLE "egg_visual_assets" ADD CONSTRAINT "egg_visual_assets_egg_id_fkey" FOREIGN KEY ("egg_id") REFERENCES "eggs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
