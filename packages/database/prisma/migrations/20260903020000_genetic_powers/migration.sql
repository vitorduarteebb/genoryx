-- CreateEnum
CREATE TYPE "GeneticPowerOrigin" AS ENUM ('GENESIS', 'INHERITED_FATHER', 'INHERITED_MOTHER', 'MUTATED_NEW');

-- CreateTable
CREATE TABLE "genetic_powers" (
    "id" TEXT NOT NULL,
    "power_hash" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_pt" TEXT NOT NULL,
    "element" "Element" NOT NULL,
    "typology" TEXT NOT NULL,
    "definition_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "genetic_powers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "genetic_power_lineages" (
    "id" TEXT NOT NULL,
    "origin_creature_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "genetic_power_lineages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creature_powers" (
    "id" TEXT NOT NULL,
    "creature_id" TEXT NOT NULL,
    "power_id" TEXT NOT NULL,
    "lineage_id" TEXT NOT NULL,
    "origin_type" "GeneticPowerOrigin" NOT NULL,
    "origin_creature_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creature_powers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fusion_discoveries" (
    "id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "family_key" TEXT NOT NULL,
    "discovered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fusion_discoveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "genetic_powers_power_hash_key" ON "genetic_powers"("power_hash");

-- CreateIndex
CREATE UNIQUE INDEX "creature_powers_creature_id_key" ON "creature_powers"("creature_id");

-- CreateIndex
CREATE INDEX "creature_powers_power_id_idx" ON "creature_powers"("power_id");

-- CreateIndex
CREATE INDEX "creature_powers_lineage_id_idx" ON "creature_powers"("lineage_id");

-- CreateIndex
CREATE UNIQUE INDEX "fusion_discoveries_character_id_family_key_key" ON "fusion_discoveries"("character_id", "family_key");

-- AddForeignKey
ALTER TABLE "creature_powers" ADD CONSTRAINT "creature_powers_creature_id_fkey" FOREIGN KEY ("creature_id") REFERENCES "creatures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creature_powers" ADD CONSTRAINT "creature_powers_power_id_fkey" FOREIGN KEY ("power_id") REFERENCES "genetic_powers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creature_powers" ADD CONSTRAINT "creature_powers_lineage_id_fkey" FOREIGN KEY ("lineage_id") REFERENCES "genetic_power_lineages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fusion_discoveries" ADD CONSTRAINT "fusion_discoveries_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
