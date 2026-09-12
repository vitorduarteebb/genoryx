-- AlterTable
ALTER TABLE "characters" ADD COLUMN "appearance_json" JSONB;
ALTER TABLE "characters" ADD COLUMN "appearance_confirmed" BOOLEAN NOT NULL DEFAULT false;
