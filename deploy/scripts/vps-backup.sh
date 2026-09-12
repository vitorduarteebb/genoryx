#!/usr/bin/env sh
set -eu
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
cd "$ROOT"
mkdir -p backups
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="backups/nexora-${STAMP}.sql.gz"
USER_NAME="$(docker exec nexora-alpha-postgres printenv POSTGRES_USER)"
DB_NAME="$(docker exec nexora-alpha-postgres printenv POSTGRES_DB)"
docker exec nexora-alpha-postgres pg_dump -U "$USER_NAME" "$DB_NAME" | gzip > "$OUT"
ls -lh "$OUT"
echo "backup: $OUT"
