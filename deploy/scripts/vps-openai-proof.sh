#!/usr/bin/env sh
# Gera só a prova controlada: 1 Pyron, 1 Nympha, 1 Florune. Não faz batch.
set -eu
cd /opt/nexora

sh deploy/scripts/vps-enable-openai-provider.sh

docker compose -f docker-compose.vps.yml --env-file .env.production run --rm \
  -e SKIP_VISUAL_WORKER=1 \
  --entrypoint node \
  api apps/api/dist/cli/generate-openai-creature-visuals.js --proof --process
