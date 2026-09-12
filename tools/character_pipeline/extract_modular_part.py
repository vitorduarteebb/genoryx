"""Tenta extrair só a peça modular. Não recorta por bbox se isso destruir a peça."""
from __future__ import annotations

import argparse
import json
import os
import sys

import bpy
import bmesh
from mathutils import Vector


KEEP = {
    "HAIR": ("hair", "wig", "strand"),
    "CHEST": ("cloth", "vest", "jacket", "shirt", "coat", "belt", "leather", "armor"),
    "LEGS": ("pant", "cloth", "trouser", "leather"),
    "BOOTS": ("boot", "shoe", "leather"),
}

DROP = (
    "skin",
    "flesh",
    "face",
    "head",
    "eye",
    "ear",
    "neck",
    "hand",
    "arm",
    "leg",
    "foot",
    "body",
    "torso",
    "human",
)


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--slot", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--report", required=True)
    return parser.parse_args(argv)


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def island_count(obj) -> int:
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.verts.ensure_lookup_table()
    seen = set()
    islands = 0
    for start in bm.verts:
        if start.index in seen:
            continue
        islands += 1
        stack = [start]
        seen.add(start.index)
        while stack:
            vert = stack.pop()
            for edge in vert.link_edges:
                other = edge.other_vert(vert)
                if other.index not in seen:
                    seen.add(other.index)
                    stack.append(other)
    bm.free()
    return islands


def height(obj) -> float:
    corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    zs = [c.z for c in corners]
    ys = [c.y for c in corners]
    xs = [c.x for c in corners]
    return max(max(xs) - min(xs), max(ys) - min(ys), max(zs) - min(zs))


def separate_by_material_and_loose():
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    for obj in meshes:
        bpy.ops.object.select_all(action="DESELECT")
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        if len(obj.data.materials) > 1:
            bpy.ops.object.mode_set(mode="EDIT")
            bpy.ops.mesh.separate(type="MATERIAL")
            bpy.ops.object.mode_set(mode="OBJECT")
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    for obj in meshes:
        bpy.ops.object.select_all(action="DESELECT")
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.separate(type="LOOSE")
        bpy.ops.object.mode_set(mode="OBJECT")


def classify_object(obj, slot: str) -> str:
    names = [obj.name.lower()]
    for mat in obj.data.materials:
        if mat:
            names.append(mat.name.lower())
    blob = " ".join(names)
    keep_hints = KEEP.get(slot.upper(), ())
    if any(hint in blob for hint in keep_hints) and not any(hint in blob for hint in DROP):
        return "keep"
    if any(hint in blob for hint in DROP):
        return "drop"
    if any(hint in blob for hint in keep_hints):
        return "keep"
    return "unknown"


def extract(path: str, slot: str, out_path: str) -> dict:
    reset_scene()
    bpy.ops.import_scene.gltf(filepath=path)
    before = {
        "meshes": len([o for o in bpy.context.scene.objects if o.type == "MESH"]),
        "islands": sum(island_count(o) for o in bpy.context.scene.objects if o.type == "MESH"),
        "materials": len({m.name for o in bpy.context.scene.objects if o.type == "MESH" for m in o.data.materials if m}),
        "height": max((height(o) for o in bpy.context.scene.objects if o.type == "MESH"), default=0),
    }
    separate_by_material_and_loose()
    kept = []
    dropped = []
    unknown = []
    for obj in list(bpy.context.scene.objects):
        if obj.type != "MESH":
            if obj.type == "ARMATURE":
                bpy.data.objects.remove(obj, do_unlink=True)
            continue
        verdict = classify_object(obj, slot)
        if verdict == "keep":
            kept.append(obj.name)
        elif verdict == "drop":
            dropped.append(obj.name)
            bpy.data.objects.remove(obj, do_unlink=True)
        else:
            unknown.append(obj.name)

    remaining = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    remaining_height = max((height(o) for o in remaining), default=0)
    remaining_islands = sum(island_count(o) for o in remaining)
    remaining_verts = sum(len(o.data.vertices) for o in remaining)

    salvageable = bool(kept) and remaining_height < before["height"] * 0.72 and remaining_verts > 200
    if remaining and remaining_height >= 1.2 and not kept:
        salvageable = False

    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
    exported = False
    if salvageable and remaining:
        bpy.ops.object.select_all(action="DESELECT")
        for obj in remaining:
            obj.select_set(True)
        bpy.ops.export_scene.gltf(
            filepath=out_path,
            export_format="GLB",
            use_selection=True,
            export_animations=False,
            export_skins=False,
        )
        exported = True

    return {
        "input": os.path.abspath(path),
        "slot": slot,
        "before": before,
        "kept": kept,
        "dropped": dropped,
        "unknown": unknown,
        "remainingMeshes": len(remaining),
        "remainingHeight": remaining_height,
        "remainingIslands": remaining_islands,
        "remainingVertices": remaining_verts,
        "salvageable": salvageable,
        "exported": exported,
        "output": os.path.abspath(out_path) if exported else None,
        "verdict": "EXTRACTED" if exported else "REJECTED_NOT_MODULAR",
    }


def main():
    args = parse_args()
    report = extract(args.input, args.slot, args.out)
    os.makedirs(os.path.dirname(os.path.abspath(args.report)) or ".", exist_ok=True)
    with open(args.report, "w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)
    print(json.dumps({"verdict": report["verdict"], "kept": report["kept"], "dropped": report["dropped"]}))


if __name__ == "__main__":
    main()
