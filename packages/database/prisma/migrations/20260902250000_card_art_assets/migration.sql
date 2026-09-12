-- CreateTable
CREATE TABLE "card_art_assets" (
    "id" TEXT NOT NULL,
    "card_definition_id" TEXT NOT NULL,
    "variant_key" TEXT NOT NULL DEFAULT 'BASE',
    "element" TEXT NOT NULL,
    "status" "VisualAssetStatus" NOT NULL DEFAULT 'PENDING',
    "provider" "VisualImageProvider" NOT NULL DEFAULT 'MOCK',
    "model" TEXT NOT NULL,
    "model_snapshot" TEXT NOT NULL,
    "art_bible_version" INTEGER NOT NULL,
    "card_art_version" INTEGER NOT NULL,
    "prompt_version" INTEGER NOT NULL,
    "prompt_hash" TEXT NOT NULL DEFAULT '',
    "prompt_text" TEXT,
    "image_hash" TEXT,
    "storage_key" TEXT,
    "public_url" TEXT,
    "generation_key" TEXT NOT NULL,
    "approved_at" TIMESTAMP(3),
    "generated_at" TIMESTAMP(3),
    "failure_reason" TEXT,
    "qa_score" DECIMAL(5,4),
    "qa_json" JSONB,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "next_attempt_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "card_art_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "card_art_assets_card_definition_id_variant_key_generation_key_key" ON "card_art_assets"("card_definition_id", "variant_key", "generation_key");

-- CreateIndex
CREATE INDEX "card_art_assets_status_next_attempt_at_idx" ON "card_art_assets"("status", "next_attempt_at");

-- CreateIndex
CREATE INDEX "card_art_assets_card_definition_id_variant_key_idx" ON "card_art_assets"("card_definition_id", "variant_key");
