-- CreateEnum
CREATE TYPE "BodyPlan" AS ENUM ('QUADRUPED', 'BIPED', 'SERPENT_WYRM', 'FLOATING', 'HUMANOID_BEAST', 'AVIAN', 'ARACHNID', 'GOLEM', 'AMPHIBIAN', 'ABYSSAL', 'CENTAUROID', 'INSECTOID_BIPED');

-- CreateEnum
CREATE TYPE "HeadType" AS ENUM ('DRACONIC', 'BEAST', 'SERPENT', 'EXOTIC');

-- CreateEnum
CREATE TYPE "CreatureOrigin" AS ENUM ('STARTER', 'WILD', 'BRED');

-- CreateEnum
CREATE TYPE "GeneticLocusKey" AS ENUM ('G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10');

-- AlterTable
ALTER TABLE "characters" ADD COLUMN "starter_chosen" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "mutations" ALTER COLUMN "species_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "creatures"
  ADD COLUMN "status_gene" "GeneRank" NOT NULL DEFAULT 'C',
  ADD COLUMN "origin" "CreatureOrigin" NOT NULL DEFAULT 'WILD',
  ADD COLUMN "genetic_hash" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "genesis_seed" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "body_plan_expressed" "BodyPlan" NOT NULL DEFAULT 'QUADRUPED',
  ADD COLUMN "body_plan_recessive" "BodyPlan" NOT NULL DEFAULT 'BIPED',
  ADD COLUMN "head_expressed" "HeadType" NOT NULL DEFAULT 'DRACONIC',
  ADD COLUMN "head_recessive" "HeadType" NOT NULL DEFAULT 'BEAST';

-- AlterTable
ALTER TABLE "eggs"
  ADD COLUMN "generation" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "genetic_seed" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "genetic_hash" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "parent_a_id" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "parent_b_id" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "species_key" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "offspringJson" JSONB;

-- AlterTable
ALTER TABLE "battles"
  ADD COLUMN "state_json" JSONB,
  ADD COLUMN "current_round" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "creature_loci" (
    "id" TEXT NOT NULL,
    "creature_id" TEXT NOT NULL,
    "locus_key" "GeneticLocusKey" NOT NULL,
    "expressed_card_key" TEXT NOT NULL,
    "recessive_card_key" TEXT NOT NULL,
    "expressed_json" JSONB NOT NULL,
    "recessive_json" JSONB NOT NULL,

    CONSTRAINT "creature_loci_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_slots" (
    "id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "slot" INTEGER NOT NULL,
    "creature_id" TEXT NOT NULL,

    CONSTRAINT "party_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encounter_offers" (
    "id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "map_key" TEXT NOT NULL,
    "species_key" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "seed" INTEGER NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "encounter_offers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "creature_loci_creature_id_locus_key_key" ON "creature_loci"("creature_id", "locus_key");

-- CreateIndex
CREATE UNIQUE INDEX "party_slots_creature_id_key" ON "party_slots"("creature_id");

-- CreateIndex
CREATE UNIQUE INDEX "party_slots_character_id_slot_key" ON "party_slots"("character_id", "slot");

-- CreateIndex
CREATE INDEX "encounter_offers_character_id_consumed_at_idx" ON "encounter_offers"("character_id", "consumed_at");

-- AddForeignKey
ALTER TABLE "creature_loci" ADD CONSTRAINT "creature_loci_creature_id_fkey" FOREIGN KEY ("creature_id") REFERENCES "creatures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_slots" ADD CONSTRAINT "party_slots_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_slots" ADD CONSTRAINT "party_slots_creature_id_fkey" FOREIGN KEY ("creature_id") REFERENCES "creatures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encounter_offers" ADD CONSTRAINT "encounter_offers_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
