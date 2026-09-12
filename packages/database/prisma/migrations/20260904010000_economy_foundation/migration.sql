-- CreateTable
CREATE TABLE "item_flows" (
    "id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "template_key" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "reference_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_flows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "economy_daily_snapshots" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "active_users" INTEGER NOT NULL,
    "gold_minted" BIGINT NOT NULL,
    "gold_sunk" BIGINT NOT NULL,
    "net_gold" BIGINT NOT NULL,
    "gold_per_active_user" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "market_gmv" BIGINT NOT NULL,
    "market_fees" BIGINT NOT NULL,
    "breed_count" INTEGER NOT NULL,
    "egg_count" INTEGER NOT NULL,
    "capture_count" INTEGER NOT NULL,
    "creatures_created" INTEGER NOT NULL,
    "catalysts_generated" INTEGER NOT NULL,
    "catalysts_consumed" INTEGER NOT NULL,
    "nex_orbs_purchased" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "economy_daily_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "item_flows_template_key_created_at_idx" ON "item_flows"("template_key", "created_at");

-- CreateIndex
CREATE INDEX "item_flows_character_id_created_at_idx" ON "item_flows"("character_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "economy_daily_snapshots_date_key" ON "economy_daily_snapshots"("date");

-- CreateIndex
CREATE INDEX "currency_transactions_source_created_at_idx" ON "currency_transactions"("source", "created_at");

-- Recompensas de faucet: no máximo um crédito por (jogador, source, referência)
CREATE UNIQUE INDEX "currency_tx_reward_once"
ON "currency_transactions" ("user_id", "source", "reference_id")
WHERE "reference_id" IS NOT NULL
  AND "source" IN ('QUEST_REWARD', 'PVE_REWARD', 'PVP_REWARD', 'SYSTEM_GRANT');
