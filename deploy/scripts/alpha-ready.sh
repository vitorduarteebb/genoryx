#!/usr/bin/env sh
set -eu
BASE="${1:-https://127.0.0.1}"
fail=0

check() {
  name="$1"
  url="$2"
  if curl -kfsS "$url" >/tmp/nexora-ready.json 2>/tmp/nexora-ready.err; then
    echo "[ok] ${name} ${url}"
  else
    echo "[fail] ${name} ${url}"
    cat /tmp/nexora-ready.err
    fail=1
  fi
}

check nginx-ready "${BASE}/ready"
check web "${BASE}/"
check api "${BASE}/api/health"
check game "${BASE}/colyseus/health"

exit "$fail"
