"""Inspeciona todos os GLBs de peças no mesmo processo Blender."""
from __future__ import annotations

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from inspect_glb import inspect  # noqa: E402


ASSETS = [
    ("HAIR", "Hair/hair_01.glb"),
    ("HAIR", "Hair/hair_02.glb"),
    ("CHEST", "Chest/chest_01.glb"),
    ("CHEST", "Chest/chest_02.glb"),
    ("LEGS", "Legs/legs_01.glb"),
    ("LEGS", "Legs/legs_02.glb"),
    ("BOOTS", "Boots/boots_01.glb"),
    ("BOOTS", "Boots/boots_02.glb"),
    ("BODY", "Bodies/body_a_01.glb"),
]


def main():
    repo = sys.argv[sys.argv.index("--repo") + 1]
    out_dir = sys.argv[sys.argv.index("--out") + 1]
    generated = os.path.join(
        repo,
        "apps",
        "unity-game",
        "Assets",
        "StreamingAssets",
        "GENORYX",
        "Characters",
        "Generated",
    )
    os.makedirs(out_dir, exist_ok=True)
    reports = []
    for slot, relative in ASSETS:
        path = os.path.join(generated, relative.replace("/", os.sep))
        report = inspect(path, slot)
        name = os.path.splitext(os.path.basename(relative))[0]
        with open(os.path.join(out_dir, name + ".json"), "w", encoding="utf-8") as handle:
            json.dump(report, handle, indent=2)
        reports.append(report)
        print(f"{relative} {report['verdict']} meshes={report['meshCount']} mats={report['materialCount']} islands={report['connectedComponents']} verts={report['vertexCount']} h={report['heightMetersApprox']}")
    with open(os.path.join(out_dir, "summary.json"), "w", encoding="utf-8") as handle:
        json.dump(reports, handle, indent=2)


if __name__ == "__main__":
    main()
