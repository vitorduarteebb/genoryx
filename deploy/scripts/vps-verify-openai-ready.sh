#!/usr/bin/env sh
set -eu
echo "==== health ===="
sleep 3
curl -sS http://127.0.0.1:3101/health; echo
curl -skS https://srv1568762.hstgr.cloud:8443/api/health; echo
curl -skS -o /dev/null -w "web %{http_code}\n" https://srv1568762.hstgr.cloud:8443/
curl -sI https://srv1568762.hstgr.cloud/ | head -5
echo "==== assets ===="
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c 'SELECT provider, status, count(*) FROM creature_visual_assets GROUP BY 1,2 ORDER BY 1,2;'
echo "==== volume ===="
docker exec nexora-alpha-api sh -c 'find /app/var/creature-visuals -type f | wc -l'
echo "==== env flags ===="
sh /tmp/vps-check-openai-key.sh
