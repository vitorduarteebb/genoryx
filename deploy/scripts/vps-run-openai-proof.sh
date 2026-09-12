#!/usr/bin/env sh
# Gera só 1 Pyron + 1 Nympha + 1 Florune. Não faz batch.
set -eu
cd /opt/nexora

sh deploy/scripts/vps-enable-openai-provider.sh

docker compose -f docker-compose.vps.yml --env-file .env.production up -d --force-recreate --no-deps api

echo "==== waiting api ===="
i=0
while [ "$i" -lt 30 ]; do
  if curl -sfS http://127.0.0.1:3101/health >/dev/null; then
    break
  fi
  i=$((i + 1))
  sleep 2
done
curl -sS http://127.0.0.1:3101/health; echo

echo "==== proof enqueue+process ===="
docker compose -f docker-compose.vps.yml --env-file .env.production run --rm \
  -e SKIP_VISUAL_WORKER=1 \
  --entrypoint node \
  api apps/api/dist/cli/generate-openai-creature-visuals.js --proof --process

echo "==== assets by provider ===="
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c 'SELECT provider, status, count(*) FROM creature_visual_assets GROUP BY 1,2 ORDER BY 1,2;'
