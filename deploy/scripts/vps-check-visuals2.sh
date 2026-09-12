#!/usr/bin/env sh
set -eu
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
  "SELECT c.id, c.name, c.reveal_status, c.visual_status, c.origin, a.status AS job, a.attempt_count, a.next_attempt_at, left(coalesce(a.failure_reason,''), 200) AS fail
   FROM creatures c
   LEFT JOIN creature_visual_assets a ON a.creature_id = c.id
   WHERE c.reveal_status IN ('PENDING_VISUAL','READY_TO_REVEAL')
   ORDER BY a.updated_at DESC NULLS LAST;"
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
  "SELECT left(coalesce(failure_reason,''), 160) AS fail, count(*)
   FROM creature_visual_assets
   GROUP BY 1
   ORDER BY 2 DESC
   LIMIT 12;"
docker logs --tail 120 nexora-alpha-api 2>&1 | grep -E "visual-process-due|creatureId|OpenAI|gpt-image|billing|quota|FAILED" | tail -40
