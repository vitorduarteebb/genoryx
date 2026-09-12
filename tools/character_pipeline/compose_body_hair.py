"""Coloca HAIR_TEST no Canonical Body e renderiza frente / 3-4 / costas."""
from __future__ import annotations

import os
import sys

import bpy
from mathutils import Vector


def bounds_of(objs):
    mins = Vector((1e9, 1e9, 1e9))
    maxs = Vector((-1e9, -1e9, -1e9))
    for obj in objs:
        if obj.type != "MESH":
            continue
        for corner in obj.bound_box:
            world = obj.matrix_world @ Vector(corner)
            mins.x = min(mins.x, world.x)
            mins.y = min(mins.y, world.y)
            mins.z = min(mins.z, world.z)
            maxs.x = max(maxs.x, world.x)
            maxs.y = max(maxs.y, world.y)
            maxs.z = max(maxs.z, world.z)
    return mins, maxs, (mins + maxs) * 0.5, maxs - mins


def setup_world():
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


def render_view(out_path: str, center: Vector, size: Vector, yaw_deg: float):
    scene = bpy.context.scene
    for obj in list(scene.objects):
        if obj.type == "CAMERA":
            bpy.data.objects.remove(obj, do_unlink=True)
    cam_data = bpy.data.cameras.new("Cam")
    cam = bpy.data.objects.new("Cam", cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    dist = max(size.length, 0.5) * 1.35
    import math
    yaw = math.radians(yaw_deg)
    cam.location = (
        center.x + math.sin(yaw) * dist,
        center.y - math.cos(yaw) * dist,
        center.z + size.z * 0.12,
    )
    cam.rotation_euler = (center - cam.location).to_track_quat("-Z", "Y").to_euler()
    scene.render.filepath = out_path
    bpy.ops.render.render(write_still=True)
    if not os.path.isfile(out_path) or os.path.getsize(out_path) < 1000:
        raise SystemExit("capture failed: " + out_path)


def main():
    repo = sys.argv[sys.argv.index("--repo") + 1]
    out_dir = sys.argv[sys.argv.index("--out") + 1]
    body = os.path.join(repo, "apps/unity-game/Assets/StreamingAssets/GENORYX/Characters/Generated/Bodies/body_a_01.glb")
    hair = os.path.join(repo, "apps/unity-game/Assets/StreamingAssets/GENORYX/Characters/Generated/Hair/hair_test_01.glb")
    os.makedirs(out_dir, exist_ok=True)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    setup_world()
    bpy.ops.import_scene.gltf(filepath=body)
    body_objs = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    bmin, bmax, bcenter, bsize = bounds_of(body_objs)
    bpy.ops.import_scene.gltf(filepath=hair)
    hair_objs = [o for o in bpy.context.scene.objects if o.type == "MESH" and o not in body_objs]
    hmin, hmax, hcenter, hsize = bounds_of(hair_objs)
    target_h = bsize.z * 0.22
    scale = target_h / max(hsize.z, 0.01)
    head = Vector((bcenter.x, bcenter.y, bmax.z - bsize.z * 0.06))
    for obj in hair_objs:
        obj.scale *= scale
        bpy.context.view_layer.update()
    bpy.context.view_layer.update()
    hmin, hmax, hcenter, hsize = bounds_of(hair_objs)
    delta = head - hcenter
    for obj in hair_objs:
        obj.location += delta

    all_meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    cmin, cmax, ccenter, csize = bounds_of(all_meshes)
    look = Vector((ccenter.x, ccenter.y, (cmin.z + cmax.z) * 0.62))
    span = Vector((csize.x, csize.y, cmax.z - cmin.z))
    render_view(os.path.join(out_dir, "body_plus_hair_front.png"), look, span, 0)
    render_view(os.path.join(out_dir, "body_plus_hair_threequarter.png"), look, span, 40)
    render_view(os.path.join(out_dir, "body_plus_hair_back.png"), look, span, 180)
    print("composed", out_dir)


if __name__ == "__main__":
    main()
