#!/usr/bin/env sh
set -eu
cd /opt/nexora

echo "==== health ===="
curl -sf http://127.0.0.1:3101/health >/dev/null && echo API_OK || { echo API_DOWN; exit 1; }

echo "==== reset failures ===="
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
  "UPDATE card_art_assets SET status='PENDING', failure_reason=NULL, next_attempt_at=NOW() WHERE scope='CREATURE' AND status IN ('FAILED','FAILED_REVIEW');"
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
  "UPDATE card_art_assets SET status='PENDING', next_attempt_at=NOW() WHERE scope='CREATURE' AND status IN ('GENERATING','VALIDATING') AND updated_at < NOW()-interval '5 minutes';"

echo "==== enqueue missing ===="
docker cp /tmp/enqueue-all-card-art.mjs nexora-alpha-api:/app/enqueue-all-card-art.mjs
docker exec -w /app -e SKIP_VISUAL_WORKER=1 -e GENETIC_CARD_ART_POLICY=FULL_CREATURE -e GENETIC_CARD_ART_CREATURE_IDS= nexora-alpha-api \
  node enqueue-all-card-art.mjs

echo "==== queue ===="
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c "SELECT scope, status, count(*) FROM card_art_assets GROUP BY 1,2 ORDER BY 1,2;"
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
  "SELECT count(*) AS creatures_incomplete FROM (SELECT c.id FROM creatures c LEFT JOIN card_art_assets a ON a.creature_id=c.id AND a.scope='CREATURE' AND a.status='READY' GROUP BY c.id HAVING count(a.id)<10) x;"

echo "==== start drain monitor (background) ===="
pkill -f watch-card-art-drain.sh 2>/dev/null || true
nohup sh /tmp/watch-card-art-drain.sh > /tmp/card-art-drain.log 2>&1 &
echo "monitor /tmp/card-art-drain.log"
tail -5 /tmp/card-art-drain.log 2>/dev/null || true
