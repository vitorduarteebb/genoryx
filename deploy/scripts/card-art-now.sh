#!/usr/bin/env sh
set -eu
echo "==== health ===="
curl -sk -o /dev/null -w "%{http_code}\n" https://127.0.0.1:8443/api/health || curl -sk -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3001/health || true
echo "==== env ===="
docker exec nexora-alpha-api sh -c 'echo POLICY=$GENETIC_CARD_ART_POLICY IDS=$GENETIC_CARD_ART_CREATURE_IDS PROVIDER=$CARD_ART_PROVIDER'
echo "==== jobs ===="
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c "SELECT scope, status, count(*) FROM card_art_assets GROUP BY 1,2 ORDER BY 1,2;"
echo "==== incomplete ===="
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c "SELECT count(*) AS incomplete FROM (SELECT c.id FROM creatures c LEFT JOIN card_art_assets a ON a.creature_id=c.id AND a.scope='CREATURE' AND a.status='READY' GROUP BY c.id HAVING count(a.id)<10) x;"
echo "==== by species ready ===="
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c "SELECT s.key, count(DISTINCT c.id) AS creatures, count(a.id) FILTER (WHERE a.status='READY') AS ready, count(a.id) FILTER (WHERE a.status='PENDING') AS pending, count(a.id) FILTER (WHERE a.status='GENERATING') AS generating, count(a.id) FILTER (WHERE a.status='FAILED') AS failed FROM creatures c JOIN creature_species s ON s.id=c.species_id LEFT JOIN card_art_assets a ON a.creature_id=c.id AND a.scope='CREATURE' GROUP BY s.key ORDER BY s.key;"
echo "==== watch ===="
tail -n 6 /var/log/nexora-card-art-drain.log 2>/dev/null || true
echo "==== api card-art logs ===="
docker logs --since 3m nexora-alpha-api 2>&1 | grep -E 'card-art|CardArt|rate.?limit|openai|enqueue' | tail -n 30 || true
