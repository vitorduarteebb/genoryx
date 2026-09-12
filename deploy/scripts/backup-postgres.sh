#!/usr/bin/env sh
set -eu
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${1:-./backups/nexora-${STAMP}.sql.gz}"
mkdir -p "$(dirname "$OUT")"
docker compose -f docker-compose.prod.yml --env-file .env.production exec -T postgres \
  sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > "$OUT"
echo "backup: $OUT"
echo "guarde fora do VPS antes de qualquer migration futura"
