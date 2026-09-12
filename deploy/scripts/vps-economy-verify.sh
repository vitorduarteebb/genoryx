#!/usr/bin/env sh
set -eu
cd /opt/nexora

echo "=== seed data ==="
docker compose -f docker-compose.vps.yml --env-file .env.production exec -T postgres \
  psql -U nexora -d nexora -c "SELECT key, name FROM item_templates WHERE key IN ('genome_catalyst','nexorb','nexorb_plus','nexorb_ultra','nexorb_ancient') ORDER BY key;"
docker compose -f docker-compose.vps.yml --env-file .env.production exec -T postgres \
  psql -U nexora -d nexora -c "SELECT email FROM users WHERE email='system@genoryx.internal';"
docker compose -f docker-compose.vps.yml --env-file .env.production exec -T postgres \
  psql -U nexora -d nexora -c "SELECT currency, balance FROM wallets w JOIN users u ON u.id=w.user_id WHERE u.email='system@genoryx.internal';"

echo "=== force recreate api web ==="
docker compose -f docker-compose.vps.yml --env-file .env.production up -d --force-recreate --no-deps api web

echo "=== wait health ==="
i=0
while [ "$i" -lt 40 ]; do
  if curl -sfS http://127.0.0.1:3101/health >/dev/null 2>&1; then
    echo "api local health ok"
    break
  fi
  i=$((i + 1))
  sleep 2
done

echo "=== public ==="
curl -skS https://127.0.0.1:8443/api/health || true
echo
curl -skS -o /dev/null -w "web_root=%{http_code}\n" https://127.0.0.1:8443/ || true
curl -skS -o /dev/null -w "web_lab=%{http_code}\n" https://127.0.0.1:8443/lab || true
curl -skS -o /dev/null -w "web_market=%{http_code}\n" https://127.0.0.1:8443/market || true

echo "=== containers ==="
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}' --filter name=nexora-alpha

echo "=== api logs ==="
docker logs --tail 25 nexora-alpha-api
