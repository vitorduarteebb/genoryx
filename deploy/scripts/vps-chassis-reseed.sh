#!/usr/bin/env sh
# Gera o token se faltar, espera a API e troca o plantel legado por 5 fenótipos únicos.
set -eu
cd /opt/nexora

if ! grep -q '^CHASSIS_RESEED_TOKEN=.\+' .env.production; then
  sed -i '/^CHASSIS_RESEED_TOKEN=/d' .env.production
  printf 'CHASSIS_RESEED_TOKEN=%s\n' "$(openssl rand -hex 24)" >> .env.production
  docker compose -f docker-compose.vps.yml --env-file .env.production up -d api
  sleep 8
fi

token=$(awk -F= '/^CHASSIS_RESEED_TOKEN=/{print $2}' .env.production | tr -d '\r')
i=0
while [ "$i" -lt 20 ]; do
  if curl -sf http://127.0.0.1:3101/health >/dev/null; then
    break
  fi
  i=$((i + 1))
  sleep 2
done

curl -sS -X POST -H "x-reseed-token: ${token}" http://127.0.0.1:3101/internal/chassis-reseed
echo
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
  "select count(*) as creatures, count(chassis_signature) as with_chassis from creatures;"
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
  "select owner_id, count(*) as n, count(distinct chassis_signature) as unique_looks from creatures group by owner_id;"
