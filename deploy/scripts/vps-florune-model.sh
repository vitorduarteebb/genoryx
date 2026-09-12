#!/usr/bin/env sh
# POC: só a Florune FERAL. Não faz batch.
set -eu
cd /opt/nexora
if ! grep -q '^MESHY_API_KEY=.' .env.production; then
  echo "MESHY_API_KEY ausente em /opt/nexora/.env.production"
  exit 2
fi
docker compose -f docker-compose.vps.yml --env-file .env.production run --rm \
  -e SKIP_VISUAL_WORKER=1 \
  --entrypoint node \
  api apps/api/dist/cli/generate-creature-model.js --proof
