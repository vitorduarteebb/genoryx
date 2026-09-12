#!/usr/bin/env sh
set -eu
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c "SELECT key, name FROM maps;"
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c "SELECT key, name FROM npcs;"
