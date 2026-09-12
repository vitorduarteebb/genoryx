#!/usr/bin/env sh
set -eu
echo "==== files ===="
docker exec nexora-alpha-api sh -c 'ls -la /app/var/card-art/*/*/*.png 2>/dev/null | awk "{print \$5, \$9}"'
echo "==== headers ===="
docker exec nexora-alpha-api python3 - <<'PY'
import os, pathlib
root = pathlib.Path("/app/var/card-art")
for p in sorted(root.rglob("*.png")):
    data = p.read_bytes()[:8]
    ok = data == b"\x89PNG\r\n\x1a\n"
    print(p.stat().st_size, "OK" if ok else "BAD", p)
PY
echo "==== HTTP each asset ===="
for id in 4b864480-2d8d-4a9e-bfb0-a65cdec65415 ef51818e-90ee-467b-b625-eba3fb9c150d 49e1df06-c3e7-4ae3-b427-2ee780c8ae5d 82474616-1640-4926-920b-f2701fb2100a b976c0f2-0644-4e9a-8fd6-ffd9b67affee 233026ca-5f83-4fe9-9d3d-f55ff7ff2f4c 2dbf7f7e-6baa-43e8-9d21-960173a868e7 f3d6c393-4c78-4f40-949a-d7157cd7e7ee fc8ed535-5a24-44f9-8495-336060862031 4ee4a2b7-281b-4a59-8247-1ff0dc1fccfe; do
  curl -sS -o /tmp/c.png -w "$id %{http_code} %{size_download}\n" "http://127.0.0.1:3101/card-art/$id/image"
done
echo "==== CARD_ART_STORAGE_DIR ===="
docker exec nexora-alpha-api sh -c 'echo DIR=$CARD_ART_STORAGE_DIR; echo cwd=$(pwd)'
