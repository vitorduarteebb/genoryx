-- AlterTable
ALTER TABLE "sessions" ADD COLUMN "last_used_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "refresh_tokens" ADD COLUMN "session_id" TEXT;

-- AlterTable
ALTER TABLE "characters" ADD COLUMN "name_normalized" TEXT;
ALTER TABLE "characters" ALTER COLUMN "class" SET DEFAULT 'HUNTER';

-- Backfill (nenhuma conta na M0, mas a coluna precisa ser NOT NULL + unique)
UPDATE "characters" SET "name_normalized" = lower(trim(both from "name")) WHERE "name_normalized" IS NULL;

-- Unique name passa a ser o normalizado
DROP INDEX IF EXISTS "characters_name_key";

ALTER TABLE "characters" ALTER COLUMN "name_normalized" SET NOT NULL;

CREATE UNIQUE INDEX "characters_name_normalized_key" ON "characters"("name_normalized");

-- Refresh tokens sem sessão (tabela vazia na M0)
DELETE FROM "refresh_tokens" WHERE "session_id" IS NULL;
ALTER TABLE "refresh_tokens" ALTER COLUMN "session_id" SET NOT NULL;

CREATE INDEX "refresh_tokens_session_id_idx" ON "refresh_tokens"("session_id");

ALTER TABLE "refresh_tokens"
  ADD CONSTRAINT "refresh_tokens_session_id_fkey"
  FOREIGN KEY ("session_id") REFERENCES "sessions"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
