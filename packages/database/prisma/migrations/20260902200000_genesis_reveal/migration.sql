-- CreateEnum
CREATE TYPE "CreatureRevealStatus" AS ENUM ('NOT_REQUIRED', 'PENDING_VISUAL', 'READY_TO_REVEAL', 'REVEALED');

-- AlterTable
ALTER TABLE "creatures" ADD COLUMN "reveal_status" "CreatureRevealStatus" NOT NULL DEFAULT 'REVEALED';
