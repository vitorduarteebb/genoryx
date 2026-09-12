#!/usr/bin/env sh
set -eu
pkill -f '/tmp/watch-card-art-drain.sh' 2>/dev/null || true
nohup sh /tmp/watch-card-art-drain.sh > /var/log/nexora-card-art-drain.log 2>&1 &
echo started
sleep 12
echo "==== watch ===="
tail -n 8 /var/log/nexora-card-art-drain.log
echo "==== jobs ===="
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c "SELECT scope, status, count(*) FROM card_art_assets GROUP BY 1,2 ORDER BY 1,2;"
echo "==== zero-job ===="
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c "SELECT s.key, c.id FROM creatures c JOIN creature_species s ON s.id=c.species_id WHERE NOT EXISTS (SELECT 1 FROM card_art_assets a WHERE a.creature_id=c.id AND a.scope='CREATURE') ORDER BY s.key;"
echo "==== incomplete ===="
docker exec nexora-alpha-postgres psql -U nexora -d nexora -tAc "SELECT count(*) FROM (SELECT c.id FROM creatures c LEFT JOIN card_art_assets a ON a.creature_id=c.id AND a.scope='CREATURE' AND a.status='READY' GROUP BY c.id HAVING count(a.id)<10) x;"
