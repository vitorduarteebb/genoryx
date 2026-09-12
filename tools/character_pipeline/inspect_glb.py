"""Audita um GLB Meshy: meshes, materiais, componentes, skeleton, salvabilidade."""
from __future__ import annotations

import argparse
import json
import math
import os
import sys

import bpy
import bmesh
from mathutils import Vector


SKIN_NAME_HINTS = ("skin", "flesh", "body", "face", "head", "nude", "human")
CLOTH_NAME_HINTS = (
    "cloth",
    "fabric",
    "leather",
    "vest",
    "jacket",
    "shirt",
    "coat",
    "pant",
    "boot",
    "shoe",
    "hair",
    "wig",
    "metal",
    "armor",
    "belt",
)
HAIR_NAME_HINTS = ("hair", "wig", "strand")


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--slot", default="")
    parser.add_argument("--out", required=True)
    return parser.parse_args(argv)


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def import_glb(path: str):
    bpy.ops.import_scene.gltf(filepath=path)


def mesh_objects():
    return [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]


def armature_objects():
    return [obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE"]


def island_count(obj) -> int:
    mesh = obj.data
    if mesh is None or len(mesh.vertices) == 0:
        return 0
    bm = bmesh.new()
    bm.from_mesh(mesh)
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


def material_base_color(mat):
    if mat is None or mat.node_tree is None:
        return None
    for node in mat.node_tree.nodes:
        if node.type == "BSDF_PRINCIPLED":
            color = node.inputs.get("Base Color")
            if color is None:
                return None
            if color.is_linked:
                return "textured"
            value = color.default_value
            return [round(value[0], 3), round(value[1], 3), round(value[2], 3), round(value[3], 3)]
    return None


def classify_material(name: str, color) -> str:
    key = (name or "").lower()
    if any(hint in key for hint in HAIR_NAME_HINTS):
        return "hair"
    if any(hint in key for hint in CLOTH_NAME_HINTS):
        return "cloth"
    if any(hint in key for hint in SKIN_NAME_HINTS):
        return "skin"
    if isinstance(color, list) and len(color) >= 3:
        r, g, b = color[0], color[1], color[2]
        max_c = max(r, g, b)
        min_c = min(r, g, b)
        if max_c > 0.15 and (r > g * 1.15) and (r > b * 1.2) and (max_c - min_c) < 0.45:
            return "skin_guess"
        if max_c < 0.22 and (max_c - min_c) < 0.08:
            return "hair_guess"
    return "unknown"


def world_bounds(obj):
    corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    mins = Vector((min(c.x for c in corners), min(c.y for c in corners), min(c.z for c in corners)))
    maxs = Vector((max(c.x for c in corners), max(c.y for c in corners), max(c.z for c in corners)))
    size = maxs - mins
    return {
        "min": [round(mins.x, 4), round(mins.y, 4), round(mins.z, 4)],
        "max": [round(maxs.x, 4), round(maxs.y, 4), round(maxs.z, 4)],
        "size": [round(size.x, 4), round(size.y, 4), round(size.z, 4)],
        "height": round(max(size.x, size.y, size.z), 4),
    }


def inspect(path: str, slot: str) -> dict:
    reset_scene()
    import_glb(path)
    meshes = mesh_objects()
    armatures = armature_objects()
    materials = []
    seen_mats = set()
    classifications = []
    total_verts = 0
    total_faces = 0
    islands = 0
    mesh_reports = []

    for obj in meshes:
        bounds = world_bounds(obj)
        verts = len(obj.data.vertices)
        faces = len(obj.data.polygons)
        total_verts += verts
        total_faces += faces
        parts = island_count(obj)
        islands += parts
        slot_mats = []
        for mat in obj.data.materials:
            if mat is None or mat.name in seen_mats:
                if mat is not None:
                    slot_mats.append(mat.name)
                continue
            seen_mats.add(mat.name)
            color = material_base_color(mat)
            kind = classify_material(mat.name, color)
            classifications.append(kind)
            materials.append({"name": mat.name, "kind": kind, "baseColor": color})
            slot_mats.append(mat.name)
        mesh_reports.append(
            {
                "name": obj.name,
                "vertices": verts,
                "faces": faces,
                "islands": parts,
                "materials": slot_mats,
                "bounds": bounds,
                "hasShapeKeys": bool(obj.data.shape_keys),
            }
        )

    kinds = set(classifications)
    separate_skin_cloth = ("skin" in kinds or "skin_guess" in kinds) and (
        "cloth" in kinds or "hair" in kinds or "hair_guess" in kinds
    )
    multiple_meshes = len(meshes) > 1
    multiple_materials = len(materials) > 1
    multiple_islands = islands > 1
    height = 0.0
    if mesh_reports:
        height = max(item["bounds"]["height"] for item in mesh_reports)
    humanoid_scale = height >= 1.2
    fused = (not multiple_meshes) and (not multiple_materials) and (not multiple_islands)

    if fused and humanoid_scale:
        verdict = "REJECTED_NOT_MODULAR"
        reason = "Mesh única fundida em escala humana. Pele e peça não estão separadas."
    elif humanoid_scale and not separate_skin_cloth and not multiple_islands:
        verdict = "REJECTED_NOT_MODULAR"
        reason = "Escala humana sem materiais/componentes de pele vs peça."
    elif multiple_materials or multiple_islands or multiple_meshes:
        verdict = "SALVAGE_CANDIDATE"
        reason = "Há submesh, material ou componente solto para tentar extração."
    else:
        verdict = "UNKNOWN_SMALL"
        reason = "Não parece corpo humano completo; validar extração."

    return {
        "file": os.path.abspath(path),
        "slot": slot,
        "bytes": os.path.getsize(path),
        "meshCount": len(meshes),
        "materialCount": len(materials),
        "materials": materials,
        "connectedComponents": islands,
        "vertexCount": total_verts,
        "faceCount": total_faces,
        "skeleton": {
            "present": len(armatures) > 0,
            "armatures": [{"name": arm.name, "bones": len(arm.data.bones)} for arm in armatures],
        },
        "meshes": mesh_reports,
        "skinAndClothOnSeparateMeshes": multiple_meshes and separate_skin_cloth,
        "skinAndClothOnDifferentMaterials": separate_skin_cloth,
        "humanoidScale": humanoid_scale,
        "heightMetersApprox": height,
        "verdict": verdict,
        "reason": reason,
    }


def main():
    args = parse_args()
    report = inspect(args.input, args.slot)
    os.makedirs(os.path.dirname(os.path.abspath(args.out)) or ".", exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)
    print(json.dumps({"file": report["file"], "verdict": report["verdict"], "reason": report["reason"]}))


if __name__ == "__main__":
    main()
