"""
Etapa 8 — GENERATE PREVIEW.

Render rapido da peca (turntable de 4 vistas) para revisao humana sem abrir o Unity.
Serve de prova visual no manifest: cada peca aprovada tem um PNG.

Uso:
  blender -b -P tools/creature_pipeline/generate_preview.py -- \
      --input work/HORNS_03_bound.blend --output var/creature-parts/previews/HORNS_03.png
"""

import math
import os

import bpy

import _common as C


VIEWS = [("front", 0.0), ("side", 90.0), ("back", 180.0), ("three_quarter", 38.0)]


def setup_studio():
    world = bpy.data.worlds.new("GenoryxStudio")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0.04, 0.05, 0.07, 1.0)
    world.node_tree.nodes["Background"].inputs[1].default_value = 1.1
    bpy.context.scene.world = world

    key = bpy.data.objects.new("Key", bpy.data.lights.new("KeyLight", type="AREA"))
    key.data.energy = 320.0
    key.data.size = 2.0
    key.location = (1.6, 2.2, 2.0)
    key.rotation_euler = (math.radians(-45), math.radians(24), 0.0)
    bpy.context.collection.objects.link(key)

    rim = bpy.data.objects.new("Rim", bpy.data.lights.new("RimLight", type="AREA"))
    rim.data.energy = 140.0
    rim.data.size = 3.0
    rim.location = (-2.0, 1.4, -2.2)
    bpy.context.collection.objects.link(rim)

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT" if hasattr(scene, "eevee") else "BLENDER_EEVEE"
    scene.render.film_transparent = False
    scene.render.image_settings.file_format = "PNG"


def frame(camera, target, yaw_degrees):
    _, _, size, center = C.world_bounds(target)
    radius = max(size.x, size.y, size.z)
    distance = max(radius * 2.9, 0.35)
    yaw = math.radians(yaw_degrees)
    pitch = math.radians(14.0)

    camera.location = (
        center.x + math.sin(yaw) * math.cos(pitch) * distance,
        center.y + math.sin(pitch) * distance,
        center.z + math.cos(yaw) * math.cos(pitch) * distance,
    )

    direction = C.vec(center) - C.vec(camera.location)
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def main():
    ap = C.parser("Gera previews de uma peca")
    ap.add_argument("--input", required=True)
    ap.add_argument("--output", required=True)
    ap.add_argument("--width", type=int, default=640)
    ap.add_argument("--height", type=int, default=640)
    ap.add_argument("--json", default=None)
    args = ap.parse_args(C.argv())

    bpy.ops.wm.open_mainfile(filepath=os.path.abspath(args.input))
    meshes = C.mesh_objects()
    if not meshes:
        raise SystemExit("blend sem malha")

    part = meshes[0]

    material = bpy.data.materials.new("GenoryxPreviewClay")
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if bsdf is not None:
        bsdf.inputs["Base Color"].default_value = (0.68, 0.70, 0.74, 1.0)
        bsdf.inputs["Roughness"].default_value = 0.42
    part.data.materials.clear()
    part.data.materials.append(material)

    setup_studio()

    camera = bpy.data.objects.new("PreviewCam", bpy.data.cameras.new("PreviewCam"))
    camera.data.lens = 55.0
    bpy.context.collection.objects.link(camera)
    bpy.context.scene.camera = camera

    scene = bpy.context.scene
    scene.render.resolution_x = args.width
    scene.render.resolution_y = args.height
    scene.render.resolution_percentage = 100

    base, ext = os.path.splitext(os.path.abspath(args.output))
    os.makedirs(os.path.dirname(base), exist_ok=True)
    written = []

    for name, yaw in VIEWS:
        frame(camera, part, yaw)
        path = "%s_%s%s" % (base, name, ext or ".png")
        scene.render.filepath = path
        bpy.ops.render.render(write_still=True)
        written.append(path)

    payload = {
        "step": "generate_preview",
        "input": args.input,
        "outputs": written,
        "accepted": all(os.path.exists(path) for path in written),
    }

    if args.json:
        C.write_json(args.json, payload)
    return C.report(payload)


if __name__ == "__main__":
    main()
