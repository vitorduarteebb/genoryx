#!/usr/bin/env sh
set -eu
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
  "UPDATE creatures
   SET reveal_status = 'REVEALED'
   WHERE reveal_status IN ('PENDING_VISUAL','READY_TO_REVEAL');"
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
  "SELECT reveal_status, count(*) FROM creatures GROUP BY 1 ORDER BY 1;"
