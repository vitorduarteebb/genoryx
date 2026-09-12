"""Prepara o corpo canônico e faz fit + transfer de pesos das peças modulares."""
from __future__ import annotations

import json
import os
import shutil
import sys

import bpy
import bmesh
from mathutils import Vector


REGIONS = [
    "HEAD",
    "SCALP",
    "TORSO",
    "UPPER_ARM_L",
    "UPPER_ARM_R",
    "LOWER_ARM_L",
    "LOWER_ARM_R",
    "HAND_L",
    "HAND_R",
    "PELVIS",
    "UPPER_LEG_L",
    "UPPER_LEG_R",
    "LOWER_LEG_L",
    "LOWER_LEG_R",
    "FOOT_L",
    "FOOT_R",
]

SLOT_RATIO = {"HAIR": 0.22, "CHEST": 0.38, "LEGS": 0.48, "BOOTS": 0.20}
SLOT_Z = {"HAIR": 0.93, "CHEST": 0.62, "LEGS": 0.32, "BOOTS": 0.08}


def bone_region(name: str) -> str:
    n = (name or "").lower().replace("mixamorig:", "").replace("mixamorig|", "").replace("_", "").replace(".", "")
    if "toe" in n or "foot" in n:
        return "FOOT_L" if "left" in n else "FOOT_R"
    if "hand" in n or "finger" in n:
        return "HAND_L" if "left" in n else "HAND_R"
    if "forearm" in n or "lowerarm" in n:
        return "LOWER_ARM_L" if "left" in n else "LOWER_ARM_R"
    if "shoulder" in n or n.endswith("arm") or "upperarm" in n:
        return "UPPER_ARM_L" if "left" in n else "UPPER_ARM_R"
    if "upleg" in n or "upperleg" in n or "thigh" in n:
        return "UPPER_LEG_L" if "left" in n else "UPPER_LEG_R"
    if n.endswith("leg") or "lowerleg" in n or "calf" in n:
        return "LOWER_LEG_L" if "left" in n else "LOWER_LEG_R"
    if "head" in n or "jaw" in n or "eye" in n or n == "neck":
        return "HEAD"
    if "hip" in n or "pelvis" in n:
        return "PELVIS"
    return "TORSO"


def world_bounds(objs):
    mins = Vector((1e9, 1e9, 1e9))
    maxs = Vector((-1e9, -1e9, -1e9))
    found = False
    for obj in objs:
        if obj.type != "MESH":
            continue
        found = True
        for corner in obj.bound_box:
            world = obj.matrix_world @ Vector(corner)
            mins.x = min(mins.x, world.x)
            mins.y = min(mins.y, world.y)
            mins.z = min(mins.z, world.z)
            maxs.x = max(maxs.x, world.x)
            maxs.y = max(maxs.y, world.y)
            maxs.z = max(maxs.z, world.z)
    if not found:
        return Vector((0, 0, 0)), Vector((0, 0, 1.8)), Vector((0, 0, 0.9)), Vector((1, 1, 1.8))
    return mins, maxs, (mins + maxs) * 0.5, maxs - mins


def export_selected(path: str, skins: bool):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_skins=skins,
        export_animations=False,
        export_apply=False,
    )


def copy_many(src: str, dests: list[str]):
    for dest in dests:
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        shutil.copy2(src, dest)


def join_meshes(meshes, name: str):
    if not meshes:
        return None
    bpy.ops.object.select_all(action="DESELECT")
    for obj in meshes:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    if len(meshes) > 1:
        bpy.ops.object.join()
    obj = bpy.context.view_layer.objects.active
    obj.name = name
    return obj


def delete_icospheres():
    for obj in list(bpy.context.scene.objects):
        key = obj.name.lower()
        if "ico" in key or key.startswith("sphere"):
            bpy.data.objects.remove(obj, do_unlink=True)


def split_body_regions(body, armature):
    body.data = body.data.copy()
    region_verts = {region: set() for region in REGIONS}
    for vert in body.data.vertices:
        best_w = -1.0
        best = "TORSO"
        extras = set()
        for group in vert.groups:
            vg = body.vertex_groups[group.group]
            region = bone_region(vg.name)
            if group.weight > best_w:
                best_w = group.weight
                best = region
            if group.weight > 0.18:
                extras.add(region)
        world = body.matrix_world @ vert.co
        if best == "HEAD" and world.z >= 1.58:
            best = "SCALP"
        if best_w < 0:
            z = world.z
            x = world.x
            if z >= 1.58:
                best = "SCALP"
            elif z >= 1.55:
                best = "HEAD"
            elif z >= 1.05:
                best = "TORSO" if abs(x) < 0.22 else ("UPPER_ARM_L" if x < 0 else "UPPER_ARM_R")
            elif z >= 0.9:
                best = "PELVIS"
            elif z >= 0.45:
                best = "UPPER_LEG_L" if x < 0 else "UPPER_LEG_R"
            elif z >= 0.12:
                best = "LOWER_LEG_L" if x < 0 else "LOWER_LEG_R"
            else:
                best = "FOOT_L" if x < 0 else "FOOT_R"
        region_verts[best].add(vert.index)
        for extra in extras:
            region_verts[extra].add(vert.index)

    created = []
    for region in REGIONS:
        keep = region_verts[region]
        if len(keep) < 12:
            continue
        bpy.ops.object.select_all(action="DESELECT")
        body.select_set(True)
        bpy.context.view_layer.objects.active = body
        bpy.ops.object.duplicate()
        clone = bpy.context.view_layer.objects.active
        clone.name = "Body_" + region
        clone.data = clone.data.copy()
        bm = bmesh.new()
        bm.from_mesh(clone.data)
        bm.verts.ensure_lookup_table()
        delete = [vert for vert in bm.verts if vert.index not in keep]
        if delete:
            bmesh.ops.delete(bm, geom=delete, context="VERTS")
        bm.to_mesh(clone.data)
        bm.free()
        clone.data.name = "Body_" + region
        if clone.modifiers.get("Armature") is None and armature is not None:
            mod = clone.modifiers.new(name="CanonicalSkeleton", type="ARMATURE")
            mod.object = armature
        created.append(clone)

    bpy.data.objects.remove(body, do_unlink=True)
    return created


def _norm_bone(name: str) -> str:
    return (name or "").lower().replace("mixamorig:", "").replace("mixamorig|", "").replace("_", "").replace(".", "")


def bone_segment(armature, side: str, kind: str):
    side_tok = "left" if side == "L" else "right"
    rules = {
        "upperarm": (("arm",), ("fore", "hand", "shoulder")),
        "forearm": (("forearm",), ("hand",)),
        "upleg": (("upleg", "upperleg", "thigh"), ("foot", "toe")),
        "leg": (("leg",), ("upleg", "upperleg", "thigh", "foot", "toe")),
        "foot": (("foot",), ("toe",)),
    }
    yes, no = rules[kind]
    for bone in armature.data.bones:
        n = _norm_bone(bone.name)
        if side_tok not in n:
            continue
        if kind == "upperarm" and "upperarm" in n:
            pass
        elif kind == "upperarm" and n.endswith("arm") and "fore" not in n and "hand" not in n:
            pass
        elif not any(token in n for token in yes):
            continue
        if any(token in n for token in no):
            continue
        head = armature.matrix_world @ bone.head_local
        tail = armature.matrix_world @ bone.tail_local
        return head, tail
    return None


def closest_on_segment(point: Vector, a: Vector, b: Vector) -> Vector:
    ab = b - a
    denom = ab.length_squared
    if denom < 1e-8:
        return a.copy()
    t = max(0.0, min(1.0, (point - a).dot(ab) / denom))
    return a + ab * t


def rest_pose_to_a_pose(part, armature, slot: str):
    if armature is None or slot == "HAIR":
        return
    segments = []
    if slot == "CHEST":
        for side in ("L", "R"):
            for kind in ("upperarm", "forearm"):
                seg = bone_segment(armature, side, kind)
                if seg is not None:
                    segments.append((side, seg))
    elif slot == "LEGS":
        for side in ("L", "R"):
            for kind in ("upleg", "leg"):
                seg = bone_segment(armature, side, kind)
                if seg is not None:
                    segments.append((side, seg))
    elif slot == "BOOTS":
        for side in ("L", "R"):
            for kind in ("leg", "foot"):
                seg = bone_segment(armature, side, kind)
                if seg is not None:
                    segments.append((side, seg))
    if not segments:
        return
    radius = 0.09 if slot == "CHEST" else 0.08 if slot == "LEGS" else 0.07
    inv = part.matrix_world.inverted()
    for vert in part.data.vertices:
        world = part.matrix_world @ vert.co
        side = "L" if world.x < 0 else "R"
        if slot == "CHEST" and abs(world.x) < 0.16:
            continue
        if slot == "LEGS" and world.z > 1.05:
            continue
        if slot == "BOOTS" and world.z > 0.42:
            continue
        best = None
        best_dist = 1e9
        for seg_side, (head, tail) in segments:
            if seg_side != side:
                continue
            point = closest_on_segment(world, head, tail)
            dist = (world - point).length
            if dist < best_dist:
                best_dist = dist
                best = point
        if best is None:
            continue
        offset = world - best
        if offset.length < 0.001:
            offset = Vector((world.x, 0.0, 0.0))
        target = best + offset.normalized() * radius
        blend = 0.82 if best_dist > 0.18 else 0.55
        vert.co = inv @ world.lerp(target, blend)
    part.data.update()


def shrinkwrap_to_body(part, body, offset: float):
    from mathutils.kdtree import KDTree

    body.data.update()
    tree = KDTree(len(body.data.vertices))
    world_verts = []
    normals = []
    normal_matrix = body.matrix_world.to_3x3()
    for i, vert in enumerate(body.data.vertices):
        world = body.matrix_world @ vert.co
        world_verts.append(world)
        local_n = vert.normal
        if local_n.length < 0.001:
            local_n = Vector((0.0, 0.0, 1.0))
        normals.append((normal_matrix @ local_n).normalized())
        tree.insert(world, i)
    tree.balance()
    inv = part.matrix_world.inverted()
    for vert in part.data.vertices:
        world = part.matrix_world @ vert.co
        _co, index, dist = tree.find(world)
        if index is None:
            continue
        target = world_verts[index] + normals[index] * offset
        blend = 0.85 if dist > 0.35 else 0.65
        vert.co = inv @ world.lerp(target, blend)
    part.data.update()


def bake_skin_mask(body, dest_png: str):
    import bpy

    size = 512
    image = bpy.data.images.new("SkinTintMask", width=size, height=size, alpha=False)
    pixels = [1.0] * (size * size * 4)
    uv = body.data.uv_layers.active
    if uv is None:
        image.filepath_raw = dest_png
        image.file_format = "PNG"
        image.save()
        return dest_png
    body.data.calc_loop_triangles()
    underwear = set()
    for vert in body.data.vertices:
        world = body.matrix_world @ vert.co
        hips = 0.0
        for group in vert.groups:
            name = body.vertex_groups[group.group].name.lower()
            if "hip" in name or "pelvis" in name:
                hips = max(hips, group.weight)
        if hips > 0.35 and 0.88 <= world.z <= 1.08:
            underwear.add(vert.index)
    for tri in body.data.loop_triangles:
        if not any(v in underwear for v in tri.vertices):
            continue
        for loop_index in tri.loops:
            u, v = uv.data[loop_index].uv
            x = min(size - 1, max(0, int(u * (size - 1))))
            y = min(size - 1, max(0, int(v * (size - 1))))
            for dx in range(-1, 2):
                for dy in range(-1, 2):
                    px = min(size - 1, max(0, x + dx))
                    py = min(size - 1, max(0, y + dy))
                    i = (py * size + px) * 4
                    pixels[i] = 0.0
                    pixels[i + 1] = 0.0
                    pixels[i + 2] = 0.0
                    pixels[i + 3] = 1.0
    image.pixels = pixels
    os.makedirs(os.path.dirname(dest_png), exist_ok=True)
    image.filepath_raw = dest_png
    image.file_format = "PNG"
    image.save()
    return dest_png


def fit_and_bind(part_path: str, slot: str, body_path: str, out_path: str):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=body_path)
    delete_icospheres()
    armature = next((o for o in bpy.context.scene.objects if o.type == "ARMATURE"), None)
    if armature is not None:
        armature.name = "GenoryxCanonicalSkeleton"
    body_meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    body = join_meshes(body_meshes, "WeightSource")
    bmin, bmax, bcenter, bsize = world_bounds([body] if body else [])

    bpy.ops.import_scene.gltf(filepath=part_path)
    part_meshes = [o for o in bpy.context.scene.objects if o.type == "MESH" and o != body]
    part = join_meshes(part_meshes, slot)
    if part is None:
        raise SystemExit("Peça sem mesh: " + part_path)

    pmin, pmax, pcenter, psize = world_bounds([part])
    target_h = max(bsize.z * SLOT_RATIO[slot], 0.05)
    scale = target_h / max(psize.z, 0.01)
    part.scale *= scale
    bpy.context.view_layer.update()
    pmin, pmax, pcenter, psize = world_bounds([part])
    dest = Vector(bcenter)
    dest.z = bmin.z + bsize.z * SLOT_Z[slot]
    if slot == "HAIR":
        dest.z = bmax.z - psize.z * 0.35
    part.location += dest - pcenter
    bpy.context.view_layer.update()
    bpy.ops.object.select_all(action="DESELECT")
    part.select_set(True)
    bpy.context.view_layer.objects.active = part
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    if slot != "HAIR":
        rest_pose_to_a_pose(part, armature, slot)
        shrinkwrap_to_body(part, body, 0.018 if slot != "BOOTS" else 0.012)

    if slot != "HAIR" and armature is not None and body is not None:
        bpy.ops.object.select_all(action="DESELECT")
        part.select_set(True)
        bpy.context.view_layer.objects.active = part
        transfer = part.modifiers.new(name="DataTransfer", type="DATA_TRANSFER")
        transfer.object = body
        transfer.use_vert_data = True
        transfer.data_types_verts = {"VGROUP_WEIGHTS"}
        transfer.vert_mapping = "POLYINTERP_NEAREST"
        bpy.ops.object.datalayout_transfer(modifier="DataTransfer")
        try:
            bpy.ops.object.modifier_apply(modifier="DataTransfer")
        except Exception:
            pass
        if part.modifiers.get("Armature") is None:
            arm_mod = part.modifiers.new(name="CanonicalSkeleton", type="ARMATURE")
            arm_mod.object = armature
        part.parent = armature
        part.matrix_parent_inverse = armature.matrix_world.inverted() @ part.matrix_world

    bpy.data.objects.remove(body, do_unlink=True)
    bpy.ops.object.select_all(action="DESELECT")
    part.select_set(True)
    if armature is not None and slot != "HAIR":
        armature.select_set(True)
        bpy.context.view_layer.objects.active = part
        export_selected(out_path, True)
    else:
        bpy.context.view_layer.objects.active = part
        export_selected(out_path, False)
    return out_path


def process_body(src: str, dest: str):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=src)
    delete_icospheres()
    armature = next((o for o in bpy.context.scene.objects if o.type == "ARMATURE"), None)
    if armature is None:
        raise SystemExit("Canonical body sem armature.")
    armature.name = "GenoryxCanonicalSkeleton"
    body = next((o for o in bpy.context.scene.objects if o.type == "MESH"), None)
    if body is None:
        raise SystemExit("Canonical body sem mesh.")
    mask = os.path.join(os.path.dirname(dest), "skin_tint_mask.png")
    bake_skin_mask(body, mask)
    regions = split_body_regions(body, armature)
    bpy.ops.object.select_all(action="DESELECT")
    armature.select_set(True)
    for obj in regions:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = armature
    export_selected(dest, True)
    return [obj.name for obj in regions]


def main():
    repo = sys.argv[sys.argv.index("--repo") + 1]
    stream = os.path.join(repo, "apps/unity-game/Assets/StreamingAssets/GENORYX/Characters")
    editor = os.path.join(repo, "apps/unity-game/Assets/GENORYX/Characters")
    report = {"regions": [], "parts": {}}

    body_src = os.path.join(stream, "phase1/canonical.rigged.glb")
    body_tmp = os.path.join(stream, "Processed/Bodies/canonical_body.glb")
    report["regions"] = process_body(body_src, body_tmp)
    copy_many(body_tmp, [os.path.join(editor, "Processed/Bodies/canonical_body.glb")])
    mask = os.path.join(stream, "Processed/Bodies/skin_tint_mask.png")
    if os.path.isfile(mask):
        copy_many(mask, [os.path.join(editor, "Processed/Bodies/skin_tint_mask.png")])
    weight_src = body_src

    parts = [
        ("HAIR", os.path.join(stream, "Generated/Hair/hair_test_01.glb"), os.path.join(stream, "Processed/Hair/hair_test_01.glb")),
        ("HAIR", os.path.join(stream, "Generated/Hair/hair_test_02.glb"), os.path.join(stream, "Processed/Hair/hair_02.glb")),
        ("CHEST", os.path.join(stream, "Generated/Chest/chest_01.glb"), os.path.join(stream, "Processed/Chest/chest_01.glb")),
        ("CHEST", os.path.join(stream, "Generated/Chest/chest_02.glb"), os.path.join(stream, "Processed/Chest/chest_02.glb")),
        ("LEGS", os.path.join(stream, "Generated/Legs/pants_01.glb"), os.path.join(stream, "Processed/Legs/pants_01.glb")),
        ("LEGS", os.path.join(stream, "Generated/Legs/pants_02.glb"), os.path.join(stream, "Processed/Legs/pants_02.glb")),
        ("BOOTS", os.path.join(stream, "Generated/Boots/boots_01.glb"), os.path.join(stream, "Processed/Boots/boots_01.glb")),
        ("BOOTS", os.path.join(stream, "Generated/Boots/boots_02.glb"), os.path.join(stream, "Processed/Boots/boots_02.glb")),
    ]
    for slot, src, dest in parts:
        if not os.path.isfile(src):
            report["parts"][os.path.basename(dest)] = "MISSING " + src
            continue
        tmp = dest + ".tmp.glb"
        fit_and_bind(src, slot, weight_src, tmp)
        os.replace(tmp, dest)
        editor_dest = os.path.join(editor, "Processed", os.path.relpath(dest, os.path.join(stream, "Processed")))
        copies = [editor_dest]
        if os.path.basename(dest) == "hair_test_01.glb":
            copies.extend(
                [
                    os.path.join(stream, "Processed/Hair/hair_01.glb"),
                    os.path.join(editor, "Processed/Hair/hair_01.glb"),
                ]
            )
        copy_many(dest, copies)
        report["parts"][os.path.basename(dest)] = "hair-fit" if slot == "HAIR" else "bound"

    catalog = {
        "version": 1,
        "parts": [
            {"id": "canonical_body", "slot": "BODY", "file": "Bodies/canonical_body.glb", "bone": "", "displayName": "Canonical Body", "hiddenBodyRegions": "", "rarity": "COMMON", "compatibleBody": "canonical_body"},
            {"id": "hair_01", "slot": "HAIR", "file": "Hair/hair_test_01.glb", "bone": "Head", "displayName": "Hair 01", "hiddenBodyRegions": "SCALP", "rarity": "COMMON", "compatibleBody": "canonical_body"},
            {"id": "hair_02", "slot": "HAIR", "file": "Hair/hair_02.glb", "bone": "Head", "displayName": "Hair 02", "hiddenBodyRegions": "SCALP", "rarity": "COMMON", "compatibleBody": "canonical_body"},
            {"id": "chest_01", "slot": "CHEST", "file": "Chest/chest_01.glb", "bone": "Chest", "displayName": "Chest 01", "hiddenBodyRegions": "", "rarity": "COMMON", "compatibleBody": "canonical_body"},
            {"id": "chest_02", "slot": "CHEST", "file": "Chest/chest_02.glb", "bone": "Chest", "displayName": "Chest 02", "hiddenBodyRegions": "", "rarity": "COMMON", "compatibleBody": "canonical_body"},
            {"id": "pants_01", "slot": "LEGS", "file": "Legs/pants_01.glb", "bone": "Hips", "displayName": "Pants 01", "hiddenBodyRegions": "", "rarity": "COMMON", "compatibleBody": "canonical_body"},
            {"id": "pants_02", "slot": "LEGS", "file": "Legs/pants_02.glb", "bone": "Hips", "displayName": "Pants 02", "hiddenBodyRegions": "", "rarity": "COMMON", "compatibleBody": "canonical_body"},
            {"id": "boots_01", "slot": "BOOTS", "file": "Boots/boots_01.glb", "bone": "Hips", "displayName": "Boots 01", "hiddenBodyRegions": "", "rarity": "COMMON", "compatibleBody": "canonical_body"},
            {"id": "boots_02", "slot": "BOOTS", "file": "Boots/boots_02.glb", "bone": "Hips", "displayName": "Boots 02", "hiddenBodyRegions": "", "rarity": "COMMON", "compatibleBody": "canonical_body"},
        ],
    }
    for dest in (
        os.path.join(stream, "Processed/catalog.json"),
        os.path.join(stream, "Generated/catalog.json"),
        os.path.join(editor, "Processed/catalog.json"),
        os.path.join(editor, "Generated/catalog.json"),
    ):
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, "w", encoding="utf-8") as handle:
            json.dump(catalog, handle, indent=2)
            handle.write("\n")

    audit = os.path.join(repo, "tools/character_pipeline/_audit/bind_canonical.json")
    with open(audit, "w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)
    print(json.dumps(report))


if __name__ == "__main__":
    main()
