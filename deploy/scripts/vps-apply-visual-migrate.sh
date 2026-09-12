#!/usr/bin/env sh
set -eu
cd /opt/nexora
docker compose -f docker-compose.vps.yml --env-file .env.production --profile migrate build migrate
docker compose -f docker-compose.vps.yml --env-file .env.production --profile migrate run --rm migrate
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c "SELECT column_name FROM information_schema.columns WHERE table_name='creatures' AND column_name IN ('reveal_status','visual_status','life_stage') ORDER BY 1;"
docker compose -f docker-compose.vps.yml --env-file .env.production run --rm -e SKIP_VISUAL_WORKER=1 --entrypoint node api apps/api/dist/cli/backfill-creature-visuals.js
