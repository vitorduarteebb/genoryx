#!/usr/bin/env sh
set -eu
cd /opt/nexora

docker compose -f docker-compose.vps.yml --env-file .env.production exec -T postgres \
  psql -U nexora -d nexora -c "SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at;"

echo "--- tables ---"
docker compose -f docker-compose.vps.yml --env-file .env.production exec -T postgres \
  psql -U nexora -d nexora -c "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('item_flows','economy_daily_snapshots') ORDER BY 1;"

echo "--- rebuild migrate + seed ---"
docker compose -f docker-compose.vps.yml --env-file .env.production --profile migrate build --no-cache migrate
docker compose -f docker-compose.vps.yml --env-file .env.production --profile seed build --no-cache seed
docker compose -f docker-compose.vps.yml --env-file .env.production --profile migrate run --rm migrate

echo "--- up api web ---"
docker compose -f docker-compose.vps.yml --env-file .env.production up -d api web

echo "--- seed catalog ---"
docker compose -f docker-compose.vps.yml --env-file .env.production --profile seed run --rm seed

echo "--- health ---"
sleep 4
curl -skS https://127.0.0.1:8443/api/health || curl -skS https://srv1568762.hstgr.cloud:8443/api/health || true
echo
