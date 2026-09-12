-- CreateEnum
CREATE TYPE "EvolutionStatus" AS ENUM ('NONE', 'READY_TO_EVOLVE', 'EVOLVING');

-- AlterTable
ALTER TABLE "creatures" ADD COLUMN "evolution_status" "EvolutionStatus" NOT NULL DEFAULT 'NONE';
