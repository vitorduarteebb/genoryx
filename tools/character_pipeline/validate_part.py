"""Valida se a peça extraída ainda parece um corpo humano completo."""
from __future__ import annotations

import argparse
import json
import os
import sys

import bpy
from mathutils import Vector


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--slot", required=True)
    parser.add_argument("--out", required=True)
    return parser.parse_args(argv)


def height_and_aspect(obj):
    corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    size = Vector(
        (
            max(c.x for c in corners) - min(c.x for c in corners),
            max(c.y for c in corners) - min(c.y for c in corners),
            max(c.z for c in corners) - min(c.z for c in corners),
        )
    )
    h = max(size.x, size.y, size.z)
    w = min(size.x, size.y, size.z)
    return h, (h / w if w > 0.001 else 99.0)


def main():
    args = parse_args()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=args.input)
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    verts = sum(len(o.data.vertices) for o in meshes)
    height = max((height_and_aspect(o)[0] for o in meshes), default=0)
    aspect = max((height_and_aspect(o)[1] for o in meshes), default=0)
    armature = any(o.type == "ARMATURE" for o in bpy.context.scene.objects)
    looks_human = height >= 1.2 and aspect >= 1.8
    approved = (not looks_human) and verts >= 200
    report = {
        "file": os.path.abspath(args.input),
        "slot": args.slot,
        "meshCount": len(meshes),
        "vertices": verts,
        "height": height,
        "aspect": aspect,
        "hasArmature": armature,
        "looksLikeFullHuman": looks_human,
        "approved": approved,
        "verdict": "APPROVED_PART" if approved else "REJECTED_NOT_MODULAR",
    }
    os.makedirs(os.path.dirname(os.path.abspath(args.out)) or ".", exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)
    print(json.dumps(report))


if __name__ == "__main__":
    main()
