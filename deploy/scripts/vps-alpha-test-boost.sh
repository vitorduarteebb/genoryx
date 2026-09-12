#!/usr/bin/env sh
set -eu
cd /opt/nexora
token=$(grep '^CHASSIS_RESEED_TOKEN=' .env.production | cut -d= -f2)
if [ -z "$token" ]; then
  echo "sem CHASSIS_RESEED_TOKEN"
  exit 1
fi
curl -sS -X POST -H "x-reseed-token: $token" http://127.0.0.1:3101/internal/alpha-test-boost
echo
