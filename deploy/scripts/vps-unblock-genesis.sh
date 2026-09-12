#!/usr/bin/env sh
set -eu
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
  "UPDATE creature_visual_assets
   SET status = 'FAILED_REVIEW', next_attempt_at = NULL
   WHERE status IN ('FAILED','PENDING','GENERATING','VALIDATING')
     AND failure_reason ILIKE '%credits%';"
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
  "UPDATE creatures
   SET reveal_status = 'READY_TO_REVEAL', visual_status = 'FAILED'
   WHERE reveal_status = 'PENDING_VISUAL'
     AND id IN (SELECT creature_id FROM creature_visual_assets WHERE status = 'FAILED_REVIEW');"
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
  "UPDATE egg_visual_assets
   SET status = 'FAILED_REVIEW', next_attempt_at = NULL
   WHERE failure_reason ILIKE '%credits%';"
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
  "SELECT c.id, c.name, c.reveal_status, c.visual_status, a.status
   FROM creatures c
   LEFT JOIN creature_visual_assets a ON a.creature_id = c.id
   WHERE c.origin = 'BRED'
   ORDER BY c.birth_date DESC
   LIMIT 10;"
