"""Exporta FBX Unity-ready: corpo Humanoid, animações e peças skinned ao skeleton canônico."""
from __future__ import annotations

import os
import sys

import bpy
from mathutils import Vector


BONE_RENAME = [
    ("Spine02", "Spine"),
    ("Spine01", "Spine1"),
    ("Spine", "Spine2"),
]


def repo_from_argv() -> str:
    return sys.argv[sys.argv.index("--repo") + 1]


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def import_glb(path: str):
    bpy.ops.import_scene.gltf(filepath=path)


def delete_junk():
    for obj in list(bpy.context.scene.objects):
        key = obj.name.lower()
        if "ico" in key or key.startswith("sphere"):
            bpy.data.objects.remove(obj, do_unlink=True)


def armature():
    return next((o for o in bpy.context.scene.objects if o.type == "ARMATURE"), None)


def meshes():
    return [o for o in bpy.context.scene.objects if o.type == "MESH"]


def clean_name(name: str) -> str:
    n = (name or "").replace("mixamorig:", "").replace("mixamorig|", "").replace("mixamorig_", "")
    return n


def rename_bones(arm):
    if arm is None:
        return
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="EDIT")
    edit = arm.data.edit_bones
    temps = []
    for bone in edit:
        bone.name = clean_name(bone.name)
    mapping = dict(BONE_RENAME)
    for bone in list(edit):
        if bone.name in mapping:
            temps.append((bone, mapping[bone.name] + "__tmp"))
            bone.name = mapping[bone.name] + "__tmp"
    for bone, dest in temps:
        bone.name = dest.replace("__tmp", "")
    # Second pass: Spine__tmp already handled. If original Spine became Spine2 via temp.
    for bone in edit:
        if bone.name.endswith("__tmp"):
            bone.name = bone.name.replace("__tmp", "")
    bpy.ops.object.mode_set(mode="OBJECT")
    arm.name = "GenoryxCanonicalSkeleton"
    arm.data.name = "GenoryxCanonicalSkeleton"


def make_material(name: str, color):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf is not None:
        bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    return mat


def assign_skin_underwear(body_meshes):
    skin = make_material("SkinMaterial", (0.82, 0.64, 0.5))
    underwear = make_material("UnderwearMaterial", (0.86, 0.84, 0.8))
    for obj in body_meshes:
        obj.data.materials.clear()
        if "PELVIS" in obj.name.upper():
            obj.data.materials.append(underwear)
        else:
            obj.data.materials.append(skin)


def export_part(body_src: str, part_src: str, dest: str, slot: str):
    reset()
    import_glb(body_src)
    delete_junk()
    arm = armature()
    rename_bones(arm)
    body_meshes = list(meshes())
    import_glb(part_src)
    delete_junk()
    extra_arms = [o for o in bpy.context.scene.objects if o.type == "ARMATURE" and o != arm]
    part_meshes = [o for o in meshes() if o not in body_meshes]
    if not part_meshes:
        raise SystemExit("Peça sem mesh: " + part_src)
    donor = join_meshes(list(body_meshes), "WeightDonor")
    for obj in extra_arms:
        bpy.data.objects.remove(obj, do_unlink=True)
    for obj in part_meshes:
        obj.name = slot
        fit_mesh_to_slot(obj, arm, slot)
        if donor is not None:
            transfer_weights(donor, obj)
        if arm is not None:
            obj.parent = arm
            obj.matrix_parent_inverse = arm.matrix_world.inverted() @ obj.matrix_world
            for mod in list(obj.modifiers):
                if mod.type == "ARMATURE":
                    mod.object = arm
            if not any(mod.type == "ARMATURE" for mod in obj.modifiers):
                mod = obj.modifiers.new(name="CanonicalSkeleton", type="ARMATURE")
                mod.object = arm
    if donor is not None:
        bpy.data.objects.remove(donor, do_unlink=True)
    rename_bones(arm)
    select_exportables(arm, part_meshes)
    export_fbx(dest, False)
    return dest


def join_meshes(objs, name: str):
    alive = [o for o in objs if o is not None]
    if not alive:
        return None
    bpy.ops.object.select_all(action="DESELECT")
    for obj in alive:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = alive[0]
    if len(alive) > 1:
        bpy.ops.object.join()
    donor = bpy.context.view_layer.objects.active
    donor.name = name
    return donor


def transfer_weights(donor, dest):
    if donor is None or dest is None:
        return
    bpy.ops.object.select_all(action="DESELECT")
    dest.select_set(True)
    bpy.context.view_layer.objects.active = dest
    mod = dest.modifiers.new(name="WeightsFromBody", type="DATA_TRANSFER")
    mod.object = donor
    mod.use_vert_data = True
    try:
        mod.data_types_verts = {"VGROUP_WEIGHTS"}
        mod.vert_mapping = "POLYINTERP_NEAREST"
        mod.mix_mode = "REPLACE"
    except Exception:
        pass
    try:
        bpy.ops.object.modifier_apply(modifier=mod.name)
    except Exception:
        pass


def bone_matrix(arm, names):
    if arm is None:
        return None
    for name in names:
        bone = arm.pose.bones.get(name)
        if bone is not None:
            return arm.matrix_world @ bone.matrix
    return None


def fit_mesh_to_slot(obj, arm, slot):
    bpy.context.view_layer.update()
    dims = obj.dimensions
    height = max(dims.z, dims.y, 0.01)
    target_h = {"HAIR": 0.28, "CHEST": 0.48, "PANTS": 0.62, "BOOTS": 0.24}.get(slot, 0.4)
    factor = target_h / height
    if 0.05 < factor < 12:
        obj.scale *= factor
    bpy.context.view_layer.update()
    center = sum((Vector(b) for b in obj.bound_box), Vector()) / 8.0
    world_center = obj.matrix_world @ center
    targets = {
        "HAIR": ("Head",),
        "CHEST": ("Spine1", "Spine2", "Spine"),
        "PANTS": ("Hips",),
        "BOOTS": ("LeftFoot",),
    }
    mat = bone_matrix(arm, targets.get(slot, ("Hips",)))
    if mat is None:
        return
    dest = mat.translation
    if slot == "BOOTS":
        right = bone_matrix(arm, ("RightFoot",))
        if right is not None:
            dest = (dest + right.translation) * 0.5
            dest.z = min(dest.z, right.translation.z)
    obj.location += dest - world_center
    bpy.context.view_layer.update()
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)


def export_fbx(path: str, anim: bool):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.export_scene.fbx(
        filepath=path,
        use_selection=True,
        object_types={"ARMATURE", "MESH"},
        add_leaf_bones=False,
        bake_anim=anim,
        bake_anim_use_all_bones=True,
        bake_anim_use_nla_strips=False,
        bake_anim_use_all_actions=True,
        armature_nodetype="NULL",
        apply_scale_options="FBX_SCALE_ALL",
        global_scale=1.0,
        axis_forward="-Z",
        axis_up="Y",
        mesh_smooth_type="FACE",
        use_armature_deform_only=True,
        path_mode="COPY",
        embed_textures=True,
    )


def select_exportables(arm, extra_meshes=None):
    bpy.ops.object.select_all(action="DESELECT")
    if arm is not None:
        arm.select_set(True)
        bpy.context.view_layer.objects.active = arm
    for obj in extra_meshes or meshes():
        obj.select_set(True)


def export_body(src: str, dest: str):
    reset()
    import_glb(src)
    delete_junk()
    arm = armature()
    rename_bones(arm)
    body = meshes()
    assign_skin_underwear(body)
    scalp = [m for m in body if "SCALP" in m.name.upper()]
    pelvis = [m for m in body if "PELVIS" in m.name.upper()]
    skin = [m for m in body if m not in scalp and m not in pelvis]
    joined = []
    if skin:
        bpy.ops.object.select_all(action="DESELECT")
        for obj in skin:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = skin[0]
        if len(skin) > 1:
            bpy.ops.object.join()
        skin_obj = bpy.context.view_layer.objects.active
        skin_obj.name = "Body_Skin"
        joined.append(skin_obj)
    joined.extend(scalp)
    joined.extend(pelvis)
    for obj in joined:
        if "PELVIS" in obj.name.upper() or obj.name == "Body_PELVIS":
            obj.name = "Body_PELVIS"
        if "SCALP" in obj.name.upper():
            obj.name = "Body_SCALP"
    if arm is not None:
        arm.location = (0.0, 0.0, 0.0)
    select_exportables(arm, joined)
    export_fbx(dest, False)
    return dest


def export_anim(src: str, dest: str):
    reset()
    import_glb(src)
    delete_junk()
    arm = armature()
    rename_bones(arm)
    # animações Mixamo: exportar armature + mesh placeholder se existir
    select_exportables(arm, meshes())
    export_fbx(dest, True)
    return dest


def main():
    repo = repo_from_argv()
    processed = os.path.join(repo, "apps/unity-game/Assets/StreamingAssets/GENORYX/Characters/Processed")
    phase1 = os.path.join(repo, "apps/unity-game/Assets/StreamingAssets/GENORYX/Characters/phase1")
    dest_root = os.path.join(repo, "apps/unity-game/Assets/GENORYX/Characters/UnityReady")
    body_glb = os.path.join(processed, "Bodies/canonical_body.glb")
    if not os.path.isfile(body_glb):
        body_glb = os.path.join(phase1, "canonical.rigged.glb")

    report = {}
    report["body"] = export_body(body_glb, os.path.join(dest_root, "Bodies/GenoryxCanonicalBody.fbx"))

    anims = [
        ("Idle.fbx", os.path.join(phase1, "canonical.idle.glb"), os.path.join(processed, "Bodies/anim.idle.glb")),
        ("Walk.fbx", os.path.join(phase1, "canonical.walk.glb"), os.path.join(processed, "Bodies/anim.walk.glb")),
        ("Run.fbx", os.path.join(phase1, "canonical.run.glb"), os.path.join(processed, "Bodies/anim.run.glb")),
    ]
    for name, primary, fallback in anims:
        src = primary if os.path.isfile(primary) else fallback
        report[name] = export_anim(src, os.path.join(dest_root, "Animations", name)) if os.path.isfile(src) else "MISSING"

    parts = [
        ("Hair/Hair_01.fbx", os.path.join(processed, "Hair/hair_01.glb"), "HAIR"),
        ("Hair/Hair_02.fbx", os.path.join(processed, "Hair/hair_02.glb"), "HAIR"),
        ("Chest/Chest_01.fbx", os.path.join(processed, "Chest/chest_01.glb"), "CHEST"),
        ("Chest/Chest_02.fbx", os.path.join(processed, "Chest/chest_02.glb"), "CHEST"),
        ("Legs/Pants_01.fbx", os.path.join(processed, "Legs/pants_01.glb"), "PANTS"),
        ("Legs/Pants_02.fbx", os.path.join(processed, "Legs/pants_02.glb"), "PANTS"),
        ("Boots/Boots_01.fbx", os.path.join(processed, "Boots/boots_01.glb"), "BOOTS"),
        ("Boots/Boots_02.fbx", os.path.join(processed, "Boots/boots_02.glb"), "BOOTS"),
    ]
    for rel, src, slot in parts:
        if os.path.isfile(src):
            report[rel] = export_part(body_glb, src, os.path.join(dest_root, rel), slot)
        else:
            report[rel] = "MISSING " + src

    print(report)


if __name__ == "__main__":
    main()
