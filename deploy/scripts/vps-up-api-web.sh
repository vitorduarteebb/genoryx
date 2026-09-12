#!/usr/bin/env sh
# Rebuild só API + web + migrate. Não recria Postgres/Redis nem apaga o volume de imagens.
set -eu
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
cd "$ROOT"

if [ ! -f .env.production ]; then
  echo "crie .env.production a partir de .env.production.example"
  exit 1
fi
if ! grep -q '"workspaces"' package.json; then
  echo "package.json sem workspaces — tarball incompleto"
  exit 1
fi

docker compose -f docker-compose.vps.yml --env-file .env.production build api web
docker compose -f docker-compose.vps.yml --env-file .env.production --profile migrate build migrate
docker compose -f docker-compose.vps.yml --env-file .env.production --profile migrate run --rm migrate
docker compose -f docker-compose.vps.yml --env-file .env.production up -d api web
echo "API/web atualizados. Postgres intocado. Volumes creature_visuals e card_art mantidos."
