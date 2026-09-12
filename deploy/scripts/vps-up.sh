#!/usr/bin/env sh
# Sobe NEXORA ALPHA nesta VPS compartilhada (sem tomar 80/443).
set -eu
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
cd "$ROOT"

if [ ! -f .env.production ]; then
  echo "crie .env.production a partir de .env.production.example"
  exit 1
fi

docker compose -f docker-compose.vps.yml --env-file .env.production build
docker compose -f docker-compose.vps.yml --env-file .env.production --profile migrate build migrate
docker compose -f docker-compose.vps.yml --env-file .env.production --profile migrate run --rm migrate
docker compose -f docker-compose.vps.yml --env-file .env.production up -d postgres redis api game-server web
echo "NEXORA ALPHA nos loopbacks 3100/3101/3567. Nginx do host deve escutar 8443."
echo "Seed (só quando necessário): docker compose -f docker-compose.vps.yml --env-file .env.production --profile seed run --rm seed"
