-- CreateEnum
CREATE TYPE "MaturationState" AS ENUM ('GROWING', 'READY', 'MATURE');

-- AlterTable
ALTER TABLE "creatures" ADD COLUMN "maturation_xp" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "creatures" ADD COLUMN "maturation_state" "MaturationState" NOT NULL DEFAULT 'GROWING';
ALTER TABLE "creatures" ADD COLUMN "ready_to_evolve_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "encounter_offers" ADD COLUMN "family" TEXT NOT NULL DEFAULT 'COMMON';
ALTER TABLE "encounter_offers" ADD COLUMN "spawn_key" TEXT;

-- AlterTable
ALTER TABLE "battles" ADD COLUMN "encounter_family" TEXT;
ALTER TABLE "battles" ADD COLUMN "mob_species" TEXT;
ALTER TABLE "battles" ADD COLUMN "spawn_key" TEXT;

-- CreateTable
CREATE TABLE "maturation_events" (
    "id" TEXT NOT NULL,
    "creature_id" TEXT NOT NULL,
    "battle_id" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'MATURATION_XP_GRANTED',
    "mob_species" TEXT,
    "map_key" TEXT,
    "family" TEXT,
    "amount" INTEGER NOT NULL,
    "participation" DOUBLE PRECISION NOT NULL,
    "diversity_share" DOUBLE PRECISION NOT NULL,
    "discovery" BOOLEAN NOT NULL DEFAULT false,
    "outcome" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maturation_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "maturation_events_battle_id_creature_id_key" ON "maturation_events"("battle_id", "creature_id");

-- CreateIndex
CREATE INDEX "maturation_events_creature_id_created_at_idx" ON "maturation_events"("creature_id", "created_at");

-- CreateIndex
CREATE INDEX "maturation_events_creature_id_mob_species_map_key_idx" ON "maturation_events"("creature_id", "mob_species", "map_key");

-- AddForeignKey
ALTER TABLE "maturation_events" ADD CONSTRAINT "maturation_events_creature_id_fkey" FOREIGN KEY ("creature_id") REFERENCES "creatures"("id") ON DELETE CASCADE ON UPDATE CASCADE;
