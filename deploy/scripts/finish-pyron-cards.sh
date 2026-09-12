#!/usr/bin/env sh
set -eu
CREATURE=64ae34e9-086a-4f42-8e6e-db2a5a373ce7
echo "==== hold other jobs ===="
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
  "UPDATE card_art_assets SET next_attempt_at=NOW()+interval '90 minutes' WHERE scope='CREATURE' AND status IN ('PENDING','FAILED') AND creature_id<>'$CREATURE';"
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
  "UPDATE card_art_assets SET status='PENDING', failure_reason=NULL, next_attempt_at=NOW()+interval '90 minutes' WHERE creature_id='$CREATURE' AND status='FAILED';"

ids=$(docker exec nexora-alpha-postgres psql -U nexora -d nexora -tAc \
  "SELECT id FROM card_art_assets WHERE creature_id='$CREATURE' AND status='PENDING' ORDER BY genetic_card_manifestation_id;")

for id in $ids; do
  echo "==== process $id ===="
  docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
    "UPDATE card_art_assets SET next_attempt_at=NOW(), status='PENDING' WHERE id='$id';"
  ok=0
  i=0
  while [ "$i" -lt 24 ]; do
    i=$((i+1))
    st=$(docker exec nexora-alpha-postgres psql -U nexora -d nexora -tAc "SELECT status FROM card_art_assets WHERE id='$id';")
    echo "  $i $st"
    if [ "$st" = "READY" ]; then
      ok=1
      break
    fi
    if [ "$st" = "FAILED" ] || [ "$st" = "FAILED_REVIEW" ]; then
      reason=$(docker exec nexora-alpha-postgres psql -U nexora -d nexora -tAc "SELECT left(failure_reason,80) FROM card_art_assets WHERE id='$id';")
      echo "  fail $reason"
      sleep 16
      docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
        "UPDATE card_art_assets SET status='PENDING', failure_reason=NULL, next_attempt_at=NOW() WHERE id='$id' AND status IN ('FAILED','FAILED_REVIEW');"
    fi
    sleep 5
  done
  if [ "$ok" != "1" ]; then
    echo "TIMEOUT $id"
  fi
  echo "cooldown 16s"
  sleep 16
done

echo "==== release queue ===="
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
  "UPDATE card_art_assets SET next_attempt_at=NOW() WHERE scope='CREATURE' AND status IN ('PENDING','FAILED') AND creature_id<>'$CREATURE';"
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
  "SELECT genetic_card_manifestation_id, status, left(coalesce(image_hash,''),16) FROM card_art_assets WHERE creature_id='$CREATURE' ORDER BY genetic_card_manifestation_id;"
