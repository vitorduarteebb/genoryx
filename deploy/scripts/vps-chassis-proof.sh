#!/usr/bin/env sh
set -eu
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c \
  'select count(*) as rows, count(distinct chassis_signature) as unique_phenotypes from creatures;'
curl -s -o /dev/null -w 'game_creatures=%{http_code}\n' https://127.0.0.1:8443/game/creatures --insecure || true
curl -s http://127.0.0.1:3101/health
echo
