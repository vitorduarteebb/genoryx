#!/usr/bin/env sh
set -eu
cd /opt/nexora

echo "==== schema ===="
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c "SELECT column_name FROM information_schema.columns WHERE table_name='creatures' AND column_name IN ('reveal_status','visual_status','life_stage');"

echo "==== migrations ===="
ls packages/database/prisma/migrations

echo "==== cli ===="
docker exec nexora-alpha-api ls apps/api/dist/cli

echo "==== backfill ===="
docker compose -f docker-compose.vps.yml --env-file .env.production run --rm -e SKIP_VISUAL_WORKER=1 --entrypoint node api apps/api/dist/cli/backfill-creature-visuals.js

echo "==== files ===="
docker exec nexora-alpha-api sh -c 'ls -la /app/var/creature-visuals | head'
