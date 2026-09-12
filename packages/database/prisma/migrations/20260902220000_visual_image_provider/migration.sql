-- CreateEnum
CREATE TYPE "VisualImageProvider" AS ENUM ('MOCK', 'OPENAI');

-- AlterTable
ALTER TABLE "creature_visual_assets" ADD COLUMN "provider" "VisualImageProvider" NOT NULL DEFAULT 'MOCK';

UPDATE "creature_visual_assets" SET "provider" = 'MOCK' WHERE "model" = 'mock';
