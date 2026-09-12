#!/usr/bin/env sh
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
  "SELECT status, left(coalesce(failure_reason,''),100) AS reason, count(*) FROM card_art_assets WHERE scope='CREATURE' AND status IN ('FAILED','FAILED_REVIEW') GROUP BY 1,2 ORDER BY count DESC LIMIT 20;"
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
  "SELECT c.id, s.key, count(a.id) FILTER (WHERE a.status='READY') AS ready, count(a.id) FILTER (WHERE a.status='PENDING') AS pending, count(a.id) FILTER (WHERE a.status IN ('FAILED','FAILED_REVIEW')) AS failed FROM creatures c JOIN creature_species s ON s.id=c.species_id LEFT JOIN card_art_assets a ON a.creature_id=c.id AND a.scope='CREATURE' WHERE c.visual_status='READY' GROUP BY c.id, s.key HAVING count(a.id) FILTER (WHERE a.status='READY') < 10 ORDER BY ready ASC, s.key LIMIT 25;"
