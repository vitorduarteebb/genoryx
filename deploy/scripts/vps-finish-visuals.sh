#!/usr/bin/env sh
set -eu
cd /opt/nexora

docker compose -f docker-compose.vps.yml --env-file .env.production run --rm -e SKIP_VISUAL_WORKER=1 --entrypoint node api apps/api/dist/cli/backfill-creature-visuals.js --limit=80

echo "==== waiting worker ===="
sleep 45

echo "==== assets ===="
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c "SELECT status, count(*) FROM creature_visual_assets GROUP BY 1 ORDER BY 1;"

echo "==== sample ===="
ASSET="$(docker exec nexora-alpha-postgres psql -U nexora -d nexora -tAc "SELECT id FROM creature_visual_assets WHERE status='READY' LIMIT 1;")"
echo "asset=$ASSET"
if [ -n "$ASSET" ]; then
  curl -sS -o /tmp/creature.png -w "loopback %{http_code} %{size_download}\n" "http://127.0.0.1:3101/creature-visuals/${ASSET}/image"
  curl -skS -o /tmp/creature-pub.png -w "public %{http_code} %{size_download}\n" "https://srv1568762.hstgr.cloud:8443/api/creature-visuals/${ASSET}/image"
  file /tmp/creature.png || true
fi

echo "==== volume files ===="
docker exec nexora-alpha-api sh -c 'find /app/var/creature-visuals -type f | wc -l'

echo "==== restart api persist ===="
docker compose -f docker-compose.vps.yml --env-file .env.production restart api
sleep 8
if [ -n "$ASSET" ]; then
  curl -sS -o /tmp/creature2.png -w "after-restart %{http_code} %{size_download}\n" "http://127.0.0.1:3101/creature-visuals/${ASSET}/image"
fi
curl -sS http://127.0.0.1:3101/health; echo
docker logs --tail 15 nexora-alpha-api
