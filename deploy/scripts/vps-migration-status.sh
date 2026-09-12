#!/usr/bin/env sh
# Compara as migrations presentes no repo da VPS com as ja aplicadas no banco.
# Existe porque `prisma migrate status` precisa do CLI, que nao esta no container da API.
set -eu
cd /opt/nexora

echo "=== aplicadas no banco ==="
docker exec nexora-alpha-postgres psql -U nexora -d nexora -t -A \
  -c 'select migration_name from _prisma_migrations order by finished_at'

echo "=== presentes no repo da VPS ==="
ls packages/database/prisma/migrations | grep -v migration_lock
