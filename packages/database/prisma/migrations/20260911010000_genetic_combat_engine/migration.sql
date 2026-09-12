-- Genetic Combat Engine V1: frozen identity snapshot, never silent regen.

ALTER TABLE "creatures" ADD COLUMN "genetic_engine_version" TEXT;
ALTER TABLE "creatures" ADD COLUMN "combat_manifest_json" JSONB;
