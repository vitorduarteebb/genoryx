#!/usr/bin/env sh
set -eu
echo "==== openai jobs ===="
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c "SELECT species.key, a.provider, a.status, a.life_stage, left(c.genetic_hash,8) AS ghash, left(a.image_hash,16) AS ihash, a.failure_reason IS NOT NULL AS failed FROM creature_visual_assets a JOIN creatures c ON c.id=a.creature_id JOIN creature_species species ON species.id=c.species_id WHERE a.provider='OPENAI' ORDER BY a.created_at;"
echo "==== wait florune ===="
i=0
while [ "$i" -lt 40 ]; do
  status="$(docker exec nexora-alpha-postgres psql -U nexora -d nexora -tAc "SELECT status FROM creature_visual_assets WHERE creature_id='84ae443c-a1e8-41eb-afe1-aff5763eaf01' AND provider='OPENAI' ORDER BY created_at DESC LIMIT 1;")"
  echo "florune=$status t=${i}"
  if [ "$status" = "READY" ] || [ "$status" = "FAILED" ] || [ "$status" = "FAILED_REVIEW" ]; then
    break
  fi
  i=$((i + 1))
  sleep 5
done
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c "SELECT provider, status, count(*) FROM creature_visual_assets GROUP BY 1,2 ORDER BY 1,2;"
