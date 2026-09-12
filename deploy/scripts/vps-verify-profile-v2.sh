#!/usr/bin/env sh
set -eu
echo "==== health ===="
curl -sS -o /tmp/h.json -w "local %{http_code}\n" http://127.0.0.1:3101/health || true
python3 - <<'PY'
import json
print(json.load(open("/tmp/h.json")))
PY
echo "==== florune intact ===="
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c "SELECT c.id, c.genetic_hash, c.visual_seed IS NOT NULL AS has_seed, c.temperament, c.life_stage, c.body_plan_expressed, m.id AS model_id, m.status, left(m.model_hash,16) AS mhash, v.image_hash IS NOT NULL AS portrait_kept FROM creatures c LEFT JOIN creature_model_assets m ON m.creature_id=c.id LEFT JOIN creature_visual_assets v ON v.id=m.source_visual_asset_id WHERE c.id='84ae443c-a1e8-41eb-afe1-aff5763eaf01';"
echo "==== model http ===="
curl -skS -o /dev/null -w "glb %{http_code} %{size_download}\n" "https://127.0.0.1:8443/api/creature-models/1c7b8287-8107-4b47-9a28-798090e4729d/model?v=58d7781eac4307b7"
curl -skS -o /dev/null -w "web %{http_code}\n" "https://127.0.0.1:8443/game/creatures/84ae443c-a1e8-41eb-afe1-aff5763eaf01"
