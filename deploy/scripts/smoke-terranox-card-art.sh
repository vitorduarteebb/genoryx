#!/usr/bin/env sh
set -eu
BASE="${1:-http://127.0.0.1:3101}"
echo "==== health ===="
curl -sS -o /dev/null -w "health %{http_code}\n" "$BASE/health"
curl -sS -o /dev/null -w "ready %{http_code}\n" "http://127.0.0.1:3100/" || true
echo "==== proof ===="
curl -sS "$BASE/card-art/creature-proof/d9d89416-50c2-4a45-8224-2bcfd1132178" | head -c 2000
echo
echo "==== images ===="
docker exec nexora-alpha-postgres psql -U nexora -d nexora -tAc \
  "SELECT genetic_card_manifestation_id || ' ' || id || ' ' || status || ' ' || image_hash FROM card_art_assets WHERE creature_id='d9d89416-50c2-4a45-8224-2bcfd1132178' ORDER BY genetic_card_manifestation_id;"
ids=$(docker exec nexora-alpha-postgres psql -U nexora -d nexora -tAc \
  "SELECT id FROM card_art_assets WHERE creature_id='d9d89416-50c2-4a45-8224-2bcfd1132178' AND status='READY' ORDER BY genetic_card_manifestation_id;")
for id in $ids; do
  curl -sS -o /tmp/card.png -w "$id %{http_code} %{size_download} %{content_type}\n" "$BASE/card-art/$id/image"
done
echo "==== no extra creatures ===="
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
  "SELECT scope, creature_id, count(*) FROM card_art_assets WHERE scope='CREATURE' GROUP BY 1,2;"
