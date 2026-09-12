#!/usr/bin/env sh
set -eu
echo "==== model row ===="
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c "SELECT m.id, m.status, m.version, left(m.model_hash,16) AS mhash, c.genetic_hash, v.image_hash IS NOT NULL AS portrait_hash_kept FROM creature_model_assets m JOIN creatures c ON c.id=m.creature_id JOIN creature_visual_assets v ON v.id=m.source_visual_asset_id WHERE c.id='84ae443c-a1e8-41eb-afe1-aff5763eaf01';"
echo "==== files ===="
docker exec nexora-alpha-api sh -c 'find /app/var/creature-models -type f | sort'
echo "==== http ===="
curl -sS -o /tmp/florune.glb -w "glb %{http_code} %{size_download}\n" "http://127.0.0.1:3101/creature-models/1c7b8287-8107-4b47-9a28-798090e4729d/model"
curl -skS -o /dev/null -w "glb-public %{http_code} %{size_download}\n" "https://srv1568762.hstgr.cloud:8443/api/creature-models/1c7b8287-8107-4b47-9a28-798090e4729d/model?v=58d7781eac4307b7"
for view in front side back; do
  curl -sS -o /dev/null -w "${view} %{http_code} %{size_download}\n" "http://127.0.0.1:3101/creature-models/1c7b8287-8107-4b47-9a28-798090e4729d/views/${view}"
done
python3 - <<'PY'
from pathlib import Path
b=Path("/tmp/florune.glb").read_bytes()
print("glb_magic", b[:4]==b"glTF", "bytes", len(b))
PY
