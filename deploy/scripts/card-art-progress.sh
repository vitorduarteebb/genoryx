#!/usr/bin/env sh
docker exec nexora-alpha-api sh -c 'echo POLICY=$GENETIC_CARD_ART_POLICY IDS=$GENETIC_CARD_ART_CREATURE_IDS PROVIDER=$CARD_ART_PROVIDER'
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c "SELECT scope, status, count(*) FROM card_art_assets GROUP BY 1,2 ORDER BY 1,2;"
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c "SELECT count(*) AS creatures_total FROM creatures WHERE visual_status='READY';"
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c "SELECT count(*) AS creatures_complete FROM (SELECT c.id FROM creatures c JOIN card_art_assets a ON a.creature_id=c.id AND a.scope='CREATURE' AND a.status='READY' WHERE c.visual_status='READY' GROUP BY c.id HAVING count(a.id)>=10) x;"
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c "SELECT count(*) AS creatures_incomplete FROM (SELECT c.id FROM creatures c LEFT JOIN card_art_assets a ON a.creature_id=c.id AND a.scope='CREATURE' AND a.status='READY' WHERE c.visual_status='READY' GROUP BY c.id HAVING count(a.id)<10) x;"
