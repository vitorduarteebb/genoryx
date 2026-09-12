#!/usr/bin/env sh
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
  "UPDATE card_art_assets SET status='PENDING', failure_reason=NULL, attempt_count=0, next_attempt_at=NOW() + interval '1 hour' WHERE scope='CREATURE' AND status IN ('FAILED','FAILED_REVIEW') AND failure_reason ILIKE '%no credits%';"
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
  "SELECT scope, status, count(*) FROM card_art_assets WHERE scope='CREATURE' GROUP BY 1,2 ORDER BY 2;"
