#!/usr/bin/env sh
# POC 3D: só Florune. Não imprime a chave.
set -eu
cd /opt/nexora

python3 - <<'PY'
from pathlib import Path
text = Path(".env.production").read_text(encoding="utf-8", errors="replace")
meshy = openai = ""
for line in text.splitlines():
    if line.startswith("MESHY_API_KEY="):
        meshy = line.split("=", 1)[1].strip().strip('"').strip("'")
    if line.startswith("OPENAI_API_KEY="):
        openai = line.split("=", 1)[1].strip().strip('"').strip("'")
print("meshy_key=" + ("present" if meshy else "absent"))
print("openai_key=" + ("present" if openai else "absent"))
if not meshy:
    raise SystemExit(2)
if not openai:
    raise SystemExit(3)
PY

if ! grep -q '^MESHY_AI_MODEL=' .env.production; then
  printf 'MESHY_AI_MODEL=latest\n' >> .env.production
fi
if ! grep -q '^CREATURE_MODEL_STORAGE_DIR=' .env.production; then
  printf 'CREATURE_MODEL_STORAGE_DIR=/app/var/creature-models\n' >> .env.production
fi

docker compose -f docker-compose.vps.yml --env-file .env.production up -d --force-recreate --no-deps api

i=0
while [ "$i" -lt 30 ]; do
  if curl -sfS http://127.0.0.1:3101/health >/dev/null; then
    break
  fi
  i=$((i + 1))
  sleep 2
done
curl -sS http://127.0.0.1:3101/health; echo

echo "==== florune model poc ===="
docker compose -f docker-compose.vps.yml --env-file .env.production run --rm \
  -e SKIP_VISUAL_WORKER=1 \
  --entrypoint node \
  api apps/api/dist/cli/generate-creature-model.js --proof
