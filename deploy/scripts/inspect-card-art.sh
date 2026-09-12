#!/usr/bin/env sh
set -eu
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c "SELECT genetic_card_manifestation_id, card_definition_id, id, status, storage_key, left(image_hash,16) AS hash16, public_url, scope FROM card_art_assets WHERE creature_id='d9d89416-50c2-4a45-8224-2bcfd1132178' ORDER BY genetic_card_manifestation_id;"
echo "==== G8 file ===="
G8KEY=$(docker exec nexora-alpha-postgres psql -U nexora -d nexora -tAc "SELECT storage_key FROM card_art_assets WHERE creature_id='d9d89416-50c2-4a45-8224-2bcfd1132178' AND genetic_card_manifestation_id='G8' LIMIT 1;")
echo "storage=$G8KEY"
docker exec nexora-alpha-api sh -c "ls -la /data/card-art 2>/dev/null | head; find /data /app /opt -name '*bedrock*' -o -name '*G8*' 2>/dev/null | head"
echo "==== loci of creature ===="
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c "SELECT locus_key, expressed_card_key FROM creature_loci WHERE creature_id='d9d89416-50c2-4a45-8224-2bcfd1132178' ORDER BY locus_key;"
echo "==== active battle hand keys ===="
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c "SELECT id, status FROM battles WHERE status='ACTIVE';"
