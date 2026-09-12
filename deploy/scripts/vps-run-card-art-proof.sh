#!/usr/bin/env sh
# Gera SOMENTE Florune G1–G10. Não gera Pyron/Nympha nem o catálogo.
set -eu
cd /opt/nexora

sh deploy/scripts/vps-enable-card-art.sh

echo "==== card-art proof enqueue+process ===="
docker compose -f docker-compose.vps.yml --env-file .env.production run --rm \
  -e SKIP_VISUAL_WORKER=1 \
  -e CARD_ART_PROVIDER=openai \
  -e OPENAI_CARD_ART_MODEL=gpt-image-2-2026-04-21 \
  --entrypoint node \
  api apps/api/dist/cli/generate-card-art.js --proof --process

echo "==== card_art_assets ===="
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
  "SELECT card_definition_id, variant_key, status, provider, left(image_hash,12) AS hash FROM card_art_assets ORDER BY card_definition_id;"
