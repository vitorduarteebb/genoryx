#!/usr/bin/env sh
set -eu
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
  "SELECT reveal_status, visual_status, count(*) FROM creatures GROUP BY 1,2 ORDER BY 1,2;"
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
  "SELECT status, provider, count(*) FROM creature_visual_assets GROUP BY 1,2 ORDER BY 1,2;"
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
  "SELECT c.name, c.reveal_status, c.visual_status, a.status AS job, a.attempt_count, left(coalesce(a.failure_reason,''), 140) AS fail, a.next_attempt_at, a.updated_at
   FROM creatures c
   LEFT JOIN creature_visual_assets a ON a.creature_id = c.id
   WHERE c.reveal_status IN ('PENDING_VISUAL','READY_TO_REVEAL') OR c.origin = 'BRED'
   ORDER BY c.created_at DESC
   LIMIT 20;"
docker logs --tail 80 nexora-alpha-api 2>&1 | grep -E "visual-process-due|QA recusou|OpenAI|FAILED|worker visual" || true
