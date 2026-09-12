"""Copia a peça processada para StreamingAssets e Assets/GENORYX/Characters/Processed."""
from __future__ import annotations

import argparse
import json
import os
import shutil
from datetime import datetime, timezone


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--slot", required=True)
    parser.add_argument("--id", required=True)
    parser.add_argument("--repo", required=True)
    args = parser.parse_args()
    if not os.path.isfile(args.input) or os.path.getsize(args.input) <= 0:
        raise SystemExit("export_unity_part: arquivo inválido")

    processed = os.path.join(args.repo, "apps", "unity-game", "Assets", "GENORYX", "Characters", "Processed", args.slot)
    streaming = os.path.join(
        args.repo,
        "apps",
        "unity-game",
        "Assets",
        "StreamingAssets",
        "GENORYX",
        "Characters",
        "Processed",
        args.slot,
    )
    os.makedirs(processed, exist_ok=True)
    os.makedirs(streaming, exist_ok=True)
    name = args.id + ".glb"
    dest_a = os.path.join(processed, name)
    dest_b = os.path.join(streaming, name)
    shutil.copy2(args.input, dest_a)
    shutil.copy2(args.input, dest_b)
    report = {
        "id": args.id,
        "slot": args.slot,
        "bytes": os.path.getsize(dest_a),
        "processed": dest_a,
        "streaming": dest_b,
        "exportedAt": datetime.now(timezone.utc).isoformat(),
    }
    with open(os.path.join(processed, args.id + ".json"), "w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)
    print(json.dumps(report))


if __name__ == "__main__":
    main()
