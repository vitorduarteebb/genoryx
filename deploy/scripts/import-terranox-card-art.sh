#!/usr/bin/env sh
set -eu
CREATURE=d9d89416-50c2-4a45-8224-2bcfd1132178
docker exec nexora-alpha-api mkdir -p /tmp/terranox-card-art
docker cp /tmp/terranox-card-art/. nexora-alpha-api:/tmp/terranox-card-art/
docker exec -e SKIP_VISUAL_WORKER=1 \
  -e GENETIC_CARD_ART_POLICY=FULL_CREATURE \
  -e GENETIC_CARD_ART_CREATURE_IDS="$CREATURE" \
  nexora-alpha-api node apps/api/dist/cli/generate-card-art.js \
  --creature="$CREATURE" --import=/tmp/terranox-card-art
