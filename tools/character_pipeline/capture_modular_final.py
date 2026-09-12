"""Monta corpo + peças processadas e renderiza modular-character-final."""
from __future__ import annotations

import math
import os
import sys

import bpy
from mathutils import Vector


HIDE = {
    "chest": {"TORSO"},
    "chest2": {"TORSO", "UPPER_ARM_L", "UPPER_ARM_R"},
    "pants": {"PELVIS", "UPPER_LEG_L", "UPPER_LEG_R"},
    "boots_tall": {"FOOT_L", "FOOT_R", "LOWER_LEG_L", "LOWER_LEG_R"},
    "boots_short": {"FOOT_L", "FOOT_R"},
}


def bounds_of(objs):
    mins = Vector((1e9, 1e9, 1e9))
    maxs = Vector((-1e9, -1e9, -1e9))
    found = False
    for obj in objs:
        if obj.type != "MESH" or obj.hide_render:
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


def setup():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    if scene.world is None:
        scene.world = bpy.data.worlds.new("World")
    scene.world.use_nodes = True
    scene.world.node_tree.nodes["Background"].inputs[0].default_value = (0.08, 0.09, 0.12, 1)
    light_data = bpy.data.lights.new("Key", "SUN")
    light_data.energy = 3.4
    light = bpy.data.objects.new("Key", light_data)
    light.rotation_euler = (0.7, 0.15, 0.35)
    scene.collection.objects.link(light)
    fill_data = bpy.data.lights.new("Fill", "SUN")
    fill_data.energy = 0.8
    fill = bpy.data.objects.new("Fill", fill_data)
    fill.rotation_euler = (0.4, 2.4, 0.1)
    scene.collection.objects.link(fill)


def hide_junk():
    for obj in bpy.context.scene.objects:
        key = obj.name.lower()
        if "ico" in key or key.startswith("sphere"):
            obj.hide_render = True
            obj.hide_viewport = True


def hide_regions(regions):
    for obj in bpy.context.scene.objects:
        if obj.name.startswith("Body_") and obj.name[5:] in regions:
            obj.hide_render = True
            obj.hide_viewport = True


def import_glb(path, keep_armature=False):
    if not path or not os.path.isfile(path):
        return []
    before = set(bpy.context.scene.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    hide_junk()
    imported = [o for o in list(bpy.context.scene.objects) if o not in before]
    mesh_names = [o.name for o in imported if o.type == "MESH"]
    if not keep_armature:
        for obj in list(imported):
            if obj.type != "ARMATURE":
                continue
            for child in list(obj.children):
                world = child.matrix_world.copy()
                child.parent = None
                child.matrix_world = world
            bpy.data.objects.remove(obj, do_unlink=True)
    return [bpy.data.objects[name] for name in mesh_names if name in bpy.data.objects]


def import_raw(path):
    return import_glb(path, keep_armature=True)


def import_fit(path, slot, body_min, body_max, body_center, body_size):
    part = import_glb(path, keep_armature=False)
    if not part:
        return []
    pmin, pmax, pcenter, psize = bounds_of(part)
    ratios = {"HAIR": 0.22, "CHEST": 0.38, "LEGS": 0.48, "BOOTS": 0.20}
    target = body_size.z * ratios.get(slot, 0.3)
    scale = target / max(psize.z, 0.01)
    dest = Vector(body_center)
    if slot == "HAIR":
        dest.z = body_max.z - body_size.z * 0.04
    elif slot == "CHEST":
        dest.z = body_min.z + body_size.z * 0.62
    elif slot == "LEGS":
        dest.z = body_min.z + body_size.z * 0.32
    elif slot == "BOOTS":
        dest.z = body_min.z + body_size.z * 0.08
    for obj in part:
        obj.scale *= scale
    bpy.context.view_layer.update()
    pmin, pmax, pcenter, psize = bounds_of(part)
    delta = dest - pcenter
    for obj in part:
        obj.location += delta
    return part


def tint_body(color):
    mat = bpy.data.materials.new("SkinTint")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    for obj in bpy.context.scene.objects:
        if obj.type == "MESH" and obj.name.startswith("Body_"):
            obj.data.materials.clear()
            obj.data.materials.append(mat)


def tint_hair(color):
    mat = bpy.data.materials.new("HairTint")
    mat.use_nodes = True
    mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (*color, 1)
    for obj in bpy.context.scene.objects:
        if obj.type == "MESH" and "hair" in obj.name.lower():
            obj.data.materials.clear()
            obj.data.materials.append(mat)


def steal_action(path):
    if not path or not os.path.isfile(path):
        return None
    before_obj = set(bpy.context.scene.objects)
    before_act = set(bpy.data.actions.keys())
    bpy.ops.import_scene.gltf(filepath=path)
    action = next((a for a in bpy.data.actions if a.name not in before_act), None)
    for obj in list(bpy.context.scene.objects):
        if obj not in before_obj:
            bpy.data.objects.remove(obj, do_unlink=True)
    return action


def pose_armature(action, frame):
    if action is None:
        return
    armature = next((o for o in bpy.context.scene.objects if o.type == "ARMATURE" and "Canonical" in o.name), None)
    if armature is None:
        armature = next((o for o in bpy.context.scene.objects if o.type == "ARMATURE"), None)
    if armature is None:
        return
    armature.animation_data_create()
    armature.animation_data.action = action
    bpy.context.scene.frame_set(frame)
    bpy.context.view_layer.update()


def render_view(path, center, size, yaw, pitch=0.08):
    scene = bpy.context.scene
    for obj in list(scene.objects):
        if obj.type == "CAMERA":
            bpy.data.objects.remove(obj, do_unlink=True)
    cam_data = bpy.data.cameras.new("Cam")
    cam = bpy.data.objects.new("Cam", cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    dist = max(size.length, 0.8) * 1.45
    yaw_r = math.radians(yaw)
    cam.location = (
        center.x + math.sin(yaw_r) * dist,
        center.y - math.cos(yaw_r) * dist,
        center.z + size.z * pitch,
    )
    cam.rotation_euler = (center - cam.location).to_track_quat("-Z", "Y").to_euler()
    os.makedirs(os.path.dirname(path), exist_ok=True)
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    if not os.path.isfile(path) or os.path.getsize(path) < 1000:
        raise SystemExit("capture failed " + path)


def first_existing(paths):
    for path in paths:
        if path and os.path.isfile(path):
            return path
    return None


def assemble(files, hair=None, chest=None, pants=None, boots=None, skin=None, hair_color=None):
    setup()
    import_raw(files["body"])
    hide_junk()
    for obj in bpy.context.scene.objects:
        if obj.type == "MESH" and not obj.name.startswith("Body_"):
            obj.hide_render = True
            obj.hide_viewport = True
    bmin, bmax, bcenter, bsize = bounds_of([o for o in bpy.context.scene.objects if o.type == "MESH" and not o.hide_render])
    regions = set()
    if chest:
        import_fit(chest, "CHEST", bmin, bmax, bcenter, bsize)
        regions |= HIDE["chest2"] if chest == files["chest_02"] else HIDE["chest"]
    if pants:
        import_fit(pants, "LEGS", bmin, bmax, bcenter, bsize)
        regions |= HIDE["pants"]
    if boots:
        import_fit(boots, "BOOTS", bmin, bmax, bcenter, bsize)
        regions |= HIDE["boots_tall"] if boots == files["boots_01"] else HIDE["boots_short"]
    if hair:
        import_fit(hair, "HAIR", bmin, bmax, bcenter, bsize)
    # Máscaras no Unity; o render de prova mantém o corpo visível sob a roupa oca.
    if skin:
        tint_body(skin)
    if hair_color:
        tint_hair(hair_color)
    allm = [o for o in bpy.context.scene.objects if o.type == "MESH" and not o.hide_render]
    return bounds_of(allm)


def main():
    repo = sys.argv[sys.argv.index("--repo") + 1]
    out = sys.argv[sys.argv.index("--out") + 1]
    stream = os.path.join(repo, "apps/unity-game/Assets/StreamingAssets/GENORYX/Characters")
    files = {
        "body": first_existing(
            [
                os.path.join(stream, "Processed/Bodies/canonical_body.glb"),
                os.path.join(stream, "phase1/canonical.rigged.glb"),
            ]
        ),
        "hair_01": first_existing(
            [
                os.path.join(stream, "Processed/Hair/hair_test_01.glb"),
                os.path.join(stream, "Processed/Hair/hair_01.glb"),
            ]
        ),
        "hair_02": os.path.join(stream, "Processed/Hair/hair_02.glb"),
        "chest_01": os.path.join(stream, "Processed/Chest/chest_01.glb"),
        "chest_02": os.path.join(stream, "Processed/Chest/chest_02.glb"),
        "pants_01": os.path.join(stream, "Processed/Legs/pants_01.glb"),
        "pants_02": os.path.join(stream, "Processed/Legs/pants_02.glb"),
        "boots_01": os.path.join(stream, "Processed/Boots/boots_01.glb"),
        "boots_02": os.path.join(stream, "Processed/Boots/boots_02.glb"),
        "idle": first_existing(
            [os.path.join(stream, "Processed/Bodies/anim.idle.glb"), os.path.join(stream, "phase1/canonical.idle.glb")]
        ),
        "walk": first_existing(
            [os.path.join(stream, "Processed/Bodies/anim.walk.glb"), os.path.join(stream, "phase1/canonical.walk.glb")]
        ),
        "run": first_existing(
            [os.path.join(stream, "Processed/Bodies/anim.run.glb"), os.path.join(stream, "phase1/canonical.run.glb")]
        ),
    }
    os.makedirs(out, exist_ok=True)

    def shot(name, hair, chest, pants, boots, yaw=18, skin=None, hair_color=None):
        cmin, cmax, ccenter, csize = assemble(files, hair, chest, pants, boots, skin, hair_color)
        look = Vector((ccenter.x, ccenter.y, (cmin.z + cmax.z) * 0.55))
        render_view(os.path.join(out, name), look, csize, yaw)
        print("shot", name)

    shot("01_body_clean.png", None, None, None, None)
    shot("02_hair_01.png", files["hair_01"], None, None, None)
    shot("03_hair_02.png", files["hair_02"], None, None, None)
    shot("04_chest_01.png", files["hair_01"], files["chest_01"], None, None)
    shot("05_chest_02.png", files["hair_01"], files["chest_02"], None, None)
    shot("06_pants_01.png", files["hair_01"], files["chest_01"], files["pants_01"], None)
    shot("07_pants_02.png", files["hair_01"], files["chest_01"], files["pants_02"], None)
    shot("08_boots_01.png", files["hair_01"], files["chest_01"], files["pants_01"], files["boots_01"])
    shot("09_boots_02.png", files["hair_01"], files["chest_01"], files["pants_01"], files["boots_02"])
    shot("10_skin_light.png", files["hair_01"], files["chest_01"], files["pants_01"], files["boots_01"], skin=(0.96, 0.86, 0.78))
    shot("11_skin_dark.png", files["hair_01"], files["chest_01"], files["pants_01"], files["boots_01"], skin=(0.16, 0.1, 0.08))

    cmin, cmax, ccenter, csize = assemble(
        files, files["hair_01"], files["chest_01"], files["pants_01"], files["boots_01"]
    )
    look = Vector((ccenter.x, ccenter.y, (cmin.z + cmax.z) * 0.55))
    render_view(os.path.join(out, "12_full_front.png"), look, csize, 0)
    render_view(os.path.join(out, "13_full_threequarter.png"), look, csize, 40)
    render_view(os.path.join(out, "14_full_side.png"), look, csize, 90)
    render_view(os.path.join(out, "15_full_back.png"), look, csize, 180)

    def posed(name, anim_key, frame):
        cmin, cmax, ccenter, csize = assemble(
            files, files["hair_01"], files["chest_01"], files["pants_01"], files["boots_01"]
        )
        pose_armature(steal_action(files[anim_key]), frame)
        look = Vector((ccenter.x, ccenter.y, (cmin.z + cmax.z) * 0.55))
        render_view(os.path.join(out, name), look, csize, 25)
        print("shot", name)

    posed("16_idle.png", "idle", 8)
    posed("17_walk.png", "walk", 10)
    posed("18_run.png", "run", 6)

    shot("19_creator_variant_a.png", files["hair_01"], files["chest_01"], files["pants_01"], files["boots_01"], yaw=22, skin=(0.82, 0.64, 0.5), hair_color=(0.07, 0.06, 0.06))
    shot("20_creator_variant_b.png", files["hair_02"], files["chest_02"], files["pants_02"], files["boots_02"], yaw=22, skin=(0.16, 0.1, 0.08), hair_color=(0.86, 0.72, 0.38))
    shot("21_haven_variant_a.png", files["hair_01"], files["chest_01"], files["pants_01"], files["boots_01"], yaw=35, skin=(0.82, 0.64, 0.5), hair_color=(0.07, 0.06, 0.06))
    shot("22_haven_variant_b.png", files["hair_02"], files["chest_02"], files["pants_02"], files["boots_02"], yaw=35, skin=(0.16, 0.1, 0.08), hair_color=(0.86, 0.72, 0.38))
    print("final captures", out)


if __name__ == "__main__":
    main()
