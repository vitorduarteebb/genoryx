#!/usr/bin/env sh
set -eu
ACTION="${1:-}"
QA=$(docker exec nexora-alpha-postgres psql -U nexora -d nexora -tAc "SELECT id FROM characters WHERE name='QaFichaV2'")
ORIG=$(docker exec nexora-alpha-postgres psql -U nexora -d nexora -tAc "SELECT owner_id FROM creatures WHERE id='84ae443c-a1e8-41eb-afe1-aff5763eaf01'")
echo "qa=$QA"
echo "orig_owner_present=$([ -n "$ORIG" ] && echo yes || echo no)"
if [ "$ACTION" = "lend" ]; then
  printf '%s' "$ORIG" > /tmp/florune-owner.txt
  docker exec nexora-alpha-postgres psql -U nexora -d nexora -c "UPDATE creatures SET owner_id='$QA' WHERE id='84ae443c-a1e8-41eb-afe1-aff5763eaf01' RETURNING id, genetic_hash;"
elif [ "$ACTION" = "return" ]; then
  BACK=$(cat /tmp/florune-owner.txt)
  docker exec nexora-alpha-postgres psql -U nexora -d nexora -c "UPDATE creatures SET owner_id='$BACK' WHERE id='84ae443c-a1e8-41eb-afe1-aff5763eaf01' RETURNING id, genetic_hash;"
else
  echo "use lend|return"
  exit 1
fi
