#!/usr/bin/env sh
set -eu
cd /opt/nexora
cp -a .env.production /tmp/nexora.env.production.bak
tar -xzf /tmp/nexora-alpha.tgz -C /opt/nexora
cp -a /tmp/nexora.env.production.bak .env.production
find deploy -type f -name '*.sh' -exec sed -i 's/\r$//' {} +
docker rm -f 5b53d35e1566_nexora-alpha-api >/dev/null 2>&1 || true
sh deploy/scripts/vps-deploy-remote.sh
docker exec nexora-alpha-api sh -c 'echo POLICY=$GENETIC_CARD_ART_POLICY; echo IDS=$GENETIC_CARD_ART_CREATURE_IDS; echo PROVIDER=$CARD_ART_PROVIDER'
