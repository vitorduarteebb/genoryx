#!/usr/bin/env sh
set -eu
CREATURE=64ae34e9-086a-4f42-8e6e-db2a5a373ce7
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
  "UPDATE card_art_assets SET next_attempt_at=NOW(), updated_at=NOW() WHERE creature_id='$CREATURE' AND status IN ('PENDING','FAILED');"
docker exec -e SKIP_VISUAL_WORKER=1 nexora-alpha-api \
  node apps/api/dist/cli/generate-card-art.js --creature="$CREATURE" --process
echo "==== after ===="
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
  "SELECT genetic_card_manifestation_id, status, left(image_hash,16), failure_reason FROM card_art_assets WHERE creature_id='$CREATURE' ORDER BY genetic_card_manifestation_id;"
