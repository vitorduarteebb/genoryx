#!/usr/bin/env sh
set -eu
while true; do
  docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
    "UPDATE card_art_assets SET status='PENDING', failure_reason=NULL, next_attempt_at=NOW() WHERE scope='CREATURE' AND status='FAILED' AND (failure_reason ILIKE '%rate limit%' OR failure_reason ILIKE '%try again%' OR failure_reason ILIKE '%no credits%' OR failure_reason ILIKE '%billing%');" >/dev/null
  docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
    "UPDATE card_art_assets SET status='PENDING', failure_reason=NULL, attempt_count=0, next_attempt_at=NOW()+interval '1 hour' WHERE scope='CREATURE' AND status='FAILED_REVIEW' AND failure_reason ILIKE '%no credits%';" >/dev/null
  docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
    "UPDATE card_art_assets SET status='PENDING', next_attempt_at=NOW() WHERE scope='CREATURE' AND status IN ('GENERATING','VALIDATING') AND updated_at < NOW()-interval '4 minutes';" >/dev/null
  line=$(docker exec nexora-alpha-postgres psql -U nexora -d nexora -tAc \
    "SELECT 'ready='||count(*) FILTER (WHERE status='READY')||' pending='||count(*) FILTER (WHERE status='PENDING')||' gen='||count(*) FILTER (WHERE status='GENERATING')||' failed='||count(*) FILTER (WHERE status IN ('FAILED','FAILED_REVIEW')) FROM card_art_assets WHERE scope='CREATURE';")
  miss=$(docker exec nexora-alpha-postgres psql -U nexora -d nexora -tAc \
    "SELECT count(*) FROM (SELECT c.id FROM creatures c LEFT JOIN card_art_assets a ON a.creature_id=c.id AND a.scope='CREATURE' AND a.status='READY' GROUP BY c.id HAVING count(a.id)<10) x;")
  echo "$(date -u +%H:%M:%SZ) $line incomplete_creatures=$miss"
  if [ "$miss" = "0" ]; then
    echo "ALL_CREATURES_HAVE_10_READY"
    break
  fi
  sleep 30
done
