#!/usr/bin/env sh
# Apaga stack GENORYX/Nexora na VPS (containers, volumes, /opt/nexora).
# Uso: cd /opt/nexora && sh deploy/scripts/vps-wipe-all.sh
set -eu

ROOT="${1:-/opt/nexora}"
cd "$ROOT" 2>/dev/null || { echo "missing $ROOT"; exit 1; }

echo "==> Parando stack Docker..."
if [ -f docker-compose.vps.yml ] && [ -f .env.production ]; then
  docker compose -f docker-compose.vps.yml --env-file .env.production down -v --remove-orphans || true
fi

echo "==> Removendo containers/volumes Docker restantes (nexora*)..."
docker ps -aq --filter name=nexora 2>/dev/null | xargs -r docker rm -f
docker volume ls -q --filter name=nexora 2>/dev/null | xargs -r docker volume rm

echo "==> Limpando imagens não usadas..."
docker system prune -af --volumes || true

echo "==> Apagando arquivos em $ROOT (inclui .env.production)..."
find "$ROOT" -mindepth 1 -maxdepth 1 -exec rm -rf {} +

echo "==> Concluído. Conteúdo restante:"
ls -la "$ROOT" || true
