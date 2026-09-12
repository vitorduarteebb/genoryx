"""Renderiza frente/lado de cada GLB de peça."""
from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from render_glb import scene_bounds  # noqa: E402

import bpy
from mathutils import Vector


FILES = [
    "Hair/hair_01.glb",
    "Hair/hair_02.glb",
    "Chest/chest_01.glb",
    "Chest/chest_02.glb",
    "Legs/legs_01.glb",
    "Legs/legs_02.glb",
    "Boots/boots_01.glb",
    "Boots/boots_02.glb",
    "Bodies/body_a_01.glb",
]


def render_current(out_path: str, view: str):
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1024
    scene.render.resolution_y = 1024
    scene.render.film_transparent = False
    if scene.world is None:
        scene.world = bpy.data.worlds.new("World")
    scene.world.use_nodes = True
    scene.world.node_tree.nodes["Background"].inputs[0].default_value = (0.08, 0.09, 0.12, 1)
    for obj in list(scene.objects):
        if obj.type == "CAMERA":
            bpy.data.objects.remove(obj, do_unlink=True)
    center, size = scene_bounds()
    cam_data = bpy.data.cameras.new("AuditCam")
    cam = bpy.data.objects.new("AuditCam", cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    distance = size * 1.7
    if view == "side":
        cam.location = (center.x + distance, center.y, center.z)
    else:
        cam.location = (center.x, center.y - distance, center.z + size * 0.05)
    cam.rotation_euler = (center - cam.location).to_track_quat("-Z", "Y").to_euler()
    if not any(o.type == "LIGHT" for o in scene.objects):
        light_data = bpy.data.lights.new("Key", "SUN")
        light_data.energy = 3.2
        light = bpy.data.objects.new("Key", light_data)
        light.rotation_euler = (0.6, 0.2, 0.4)
        scene.collection.objects.link(light)
    scene.render.filepath = out_path
    bpy.ops.render.render(write_still=True)


def main():
    repo = sys.argv[sys.argv.index("--repo") + 1]
    out_dir = sys.argv[sys.argv.index("--out") + 1]
    generated = os.path.join(repo, "apps", "unity-game", "Assets", "StreamingAssets", "GENORYX", "Characters", "Generated")
    os.makedirs(out_dir, exist_ok=True)
    for relative in FILES:
        path = os.path.join(generated, relative.replace("/", os.sep))
        stem = os.path.splitext(os.path.basename(relative))[0]
        bpy.ops.wm.read_factory_settings(use_empty=True)
        bpy.ops.import_scene.gltf(filepath=path)
        render_current(os.path.join(out_dir, stem + "_front.png"), "front")
        render_current(os.path.join(out_dir, stem + "_side.png"), "side")
        print("rendered", stem)


if __name__ == "__main__":
    main()
