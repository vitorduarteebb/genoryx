"""Normaliza origem da peça e alinha ao corpo canônico sem recorte destrutivo."""
from __future__ import annotations

import argparse
import os
import sys

import bpy
from mathutils import Vector


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--part", required=True)
    parser.add_argument("--body", required=True)
    parser.add_argument("--slot", required=True)
    parser.add_argument("--out", required=True)
    return parser.parse_args(argv)


def bounds(obj):
    corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    mins = Vector((min(c.x for c in corners), min(c.y for c in corners), min(c.z for c in corners)))
    maxs = Vector((max(c.x for c in corners), max(c.y for c in corners), max(c.z for c in corners)))
    return mins, maxs, (mins + maxs) * 0.5


def mesh_union():
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    if not meshes:
        return None
    bpy.ops.object.select_all(action="DESELECT")
    for obj in meshes:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    if len(meshes) > 1:
        bpy.ops.object.join()
    return bpy.context.view_layer.objects.active


def main():
    args = parse_args()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=args.body)
    body = mesh_union()
    if body is None:
        raise SystemExit("Corpo canônico sem mesh.")
    body.name = "CanonicalBody"
    body_min, body_max, body_center = bounds(body)

    bpy.ops.object.select_all(action="DESELECT")
    bpy.ops.import_scene.gltf(filepath=args.part)
    part_meshes = [o for o in bpy.context.scene.objects if o.type == "MESH" and o != body]
    if not part_meshes:
        raise SystemExit("Peça sem mesh.")
    bpy.ops.object.select_all(action="DESELECT")
    for obj in part_meshes:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = part_meshes[0]
    if len(part_meshes) > 1:
        bpy.ops.object.join()
    part = bpy.context.view_layer.objects.active
    part.name = args.slot
    part_min, part_max, part_center = bounds(part)

    slot = args.slot.upper()
    target = Vector(body_center)
    if slot == "HAIR":
        target = Vector((body_center.x, body_center.y, body_max.z - (part_max.z - part_min.z) * 0.35))
    elif slot == "CHEST":
        target.z = body_min.z + (body_max.z - body_min.z) * 0.62
    elif slot == "LEGS":
        target.z = body_min.z + (body_max.z - body_min.z) * 0.32
    elif slot == "BOOTS":
        target.z = body_min.z + (part_max.z - part_min.z) * 0.45

    part.location += target - part_center
    bpy.ops.object.select_all(action="DESELECT")
    part.select_set(True)
    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=args.out, export_format="GLB", use_selection=True, export_skins=False)
    print(args.out)


if __name__ == "__main__":
    main()
