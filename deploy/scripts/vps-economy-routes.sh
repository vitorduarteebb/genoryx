#!/usr/bin/env sh
set -eu
for path in / /login /game /game/lab /game/market /game/shop /game/starter /game/breeding; do
  code=$(curl -skS -o /dev/null -w "%{http_code}" "https://127.0.0.1:8443$path")
  echo "$code $path"
done
echo "--- shop catalog (expect 401 without token) ---"
curl -skS -o /tmp/shop.json -w "shop=%{http_code}\n" https://127.0.0.1:8443/api/economy/shop || true
head -c 200 /tmp/shop.json; echo
echo "--- containers health ---"
docker ps --format '{{.Names}} {{.Status}}' --filter name=nexora-alpha
