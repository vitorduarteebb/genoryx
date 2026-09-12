#!/usr/bin/env sh
# Imprime só metadados. Nunca o valor da chave.
set -eu
cd /opt/nexora
python3 - <<'PY'
import hashlib
from pathlib import Path
text = Path(".env.production").read_text(encoding="utf-8", errors="replace")
value = ""
provider = "unset"
model = "unset"
for line in text.splitlines():
    if line.startswith("OPENAI_API_KEY="):
        value = line.split("=", 1)[1].strip().strip('"').strip("'")
    elif line.startswith("CREATURE_IMAGE_PROVIDER="):
        provider = line.split("=", 1)[1].strip()
    elif line.startswith("OPENAI_CREATURE_IMAGE_MODEL="):
        model = line.split("=", 1)[1].strip()
print(f"provider={provider}")
print(f"model={model}")
if not value:
    print("key=absent")
    raise SystemExit(2)
print("key=present")
print("key_len=" + str(len(value)))
print("key_sha16=" + hashlib.sha256(value.encode("utf-8")).hexdigest()[:16])
print("key_prefix=" + ("sk-" if value.startswith("sk-") else "other"))
PY
