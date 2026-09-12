#!/usr/bin/env sh
set -eu
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
cd "$ROOT"

if [ ! -f .env.production ]; then
  echo "crie .env.production a partir de .env.production.example"
  exit 1
fi

if [ ! -f deploy/nginx/certs/fullchain.pem ] || [ ! -f deploy/nginx/certs/privkey.pem ]; then
  echo "certs ausentes — gerando autoassinado temporário"
  sh deploy/scripts/make-selfsigned.sh
fi

docker compose -f docker-compose.prod.yml --env-file .env.production build
docker compose -f docker-compose.prod.yml --env-file .env.production --profile migrate run --rm migrate
docker compose -f docker-compose.prod.yml --env-file .env.production up -d postgres redis api game-server web nginx
echo "NEXORA ALPHA no ar. Rode deploy/scripts/alpha-ready.sh"
echo "Seed (só quando necessário): docker compose -f docker-compose.prod.yml --env-file .env.production --profile seed run --rm seed"
