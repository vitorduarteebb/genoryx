#!/usr/bin/env sh
set -eu
for i in 1 2 3 4 5 6 7 8 9 10 11 12; do
  if curl -sf http://127.0.0.1:3101/health >/dev/null; then
    echo HEALTHY
    break
  fi
  echo waiting
  sleep 3
done
echo "==== jobs ===="
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c "SELECT scope, status, count(*) FROM card_art_assets GROUP BY 1,2 ORDER BY 1,2;"
echo "==== by creature ===="
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c "SELECT creature_id, status, count(*) FROM card_art_assets WHERE scope='CREATURE' GROUP BY 1,2 ORDER BY 1,2;"
echo "==== recent logs ===="
docker logs nexora-alpha-api --since 90s 2>&1 | grep -E 'card-art|enqueue' | tail -30
