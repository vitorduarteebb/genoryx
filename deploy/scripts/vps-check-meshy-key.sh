#!/usr/bin/env sh
set -eu
cd /opt/nexora
python3 - <<'PY'
from pathlib import Path
text = Path(".env.production").read_text(encoding="utf-8", errors="replace")
key = ""
model = "unset"
for line in text.splitlines():
    if line.startswith("MESHY_API_KEY="):
        key = line.split("=", 1)[1].strip()
    if line.startswith("MESHY_AI_MODEL="):
        model = line.split("=", 1)[1].strip()
print("meshy_model=" + model)
print("meshy_key=" + ("present" if key else "absent"))
print("meshy_len=" + str(len(key)))
PY
curl -sS http://127.0.0.1:3101/health; echo
curl -skS -o /dev/null -w "web %{http_code}\n" https://srv1568762.hstgr.cloud:8443/
