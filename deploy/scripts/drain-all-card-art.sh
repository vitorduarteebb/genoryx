#!/usr/bin/env sh
# Reseta falhas, enfileira quem falta e deixa o worker gerar 1 a 1.
set -eu
echo "==== reset failed ===="
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
  "UPDATE card_art_assets SET status='PENDING', failure_reason=NULL, next_attempt_at=NOW() WHERE scope='CREATURE' AND status IN ('FAILED','FAILED_REVIEW');"
echo "==== reset stale generating ===="
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
  "UPDATE card_art_assets SET status='PENDING', next_attempt_at=NOW() WHERE scope='CREATURE' AND status IN ('GENERATING','VALIDATING') AND updated_at < NOW()-interval '3 minutes';"
echo "==== status ===="
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c "SELECT scope, status, count(*) FROM card_art_assets GROUP BY 1,2 ORDER BY 1,2;"
echo "==== missing creatures ===="
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c "SELECT count(*) AS creatures_incomplete FROM (SELECT c.id FROM creatures c LEFT JOIN card_art_assets a ON a.creature_id=c.id AND a.scope='CREATURE' AND a.status='READY' GROUP BY c.id HAVING count(a.id) < 10) x;"
