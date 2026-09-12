#!/usr/bin/env sh
set -eu
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c "SELECT status, count(*) FROM creature_visual_assets GROUP BY 1 ORDER BY 1;"
docker exec nexora-alpha-api sh -c 'find /app/var/creature-visuals -type f | wc -l'
curl -sS http://127.0.0.1:3101/health; echo
curl -skS https://srv1568762.hstgr.cloud:8443/api/health; echo
