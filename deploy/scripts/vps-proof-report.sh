#!/usr/bin/env sh
set -eu
mkdir -p /tmp/genoryx-proof
docker exec nexora-alpha-postgres psql -U nexora -d nexora -c "SELECT c.id, s.key, c.life_stage, c.temperament, c.genetic_hash, c.visual_seed, a.provider, a.model, a.status, a.prompt_hash, a.image_hash, a.public_url FROM creatures c JOIN creature_species s ON s.id=c.species_id JOIN creature_visual_assets a ON a.creature_id=c.id WHERE a.provider='OPENAI' ORDER BY s.key;"
for id in 37bcd811-da9d-439d-80c3-637c24bf6482 415b3bf8-0c2c-4dc0-989c-8716157ba856 e84abcf9-4f8a-4af4-8340-2f8d479ed549; do
  curl -sS -o "/tmp/genoryx-proof/${id}.png" "http://127.0.0.1:3101/creature-visuals/${id}/image"
  python3 - <<PY
from pathlib import Path
p=Path("/tmp/genoryx-proof/${id}.png")
b=p.read_bytes()
print("${id}", "bytes", len(b), "png", b[:8]==bytes([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]))
PY
done
curl -sS http://127.0.0.1:3101/health; echo
