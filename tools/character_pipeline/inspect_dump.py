"""Dump meshes, bones, bounds and a PNG preview for a GLB."""
from __future__ import annotations

import json
import os
import sys

import bpy
from mathutils import Vector


def bounds(obj):
    corners = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
    mins = Vector((min(c.x for c in corners), min(c.y for c in corners), min(c.z for c in corners)))
    maxs = Vector((max(c.x for c in corners), max(c.y for c in corners), max(c.z for c in corners)))
    size = maxs - mins
    return {
        "min": [round(v, 4) for v in mins],
        "max": [round(v, 4) for v in maxs],
        "size": [round(v, 4) for v in size],
        "height": round(max(size), 4),
    }


def main():
    argv = sys.argv[sys.argv.index("--") + 1 :]
    path = argv[0]
    out_json = argv[1]
    out_png = argv[2] if len(argv) > 2 else ""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=path)
    meshes = []
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH":
            continue
        vgs = [g.name for g in obj.vertex_groups]
        meshes.append(
            {
                "name": obj.name,
                "verts": len(obj.data.vertices),
                "faces": len(obj.data.polygons),
                "materials": [m.name for m in obj.data.materials if m],
                "vertexGroups": vgs[:40],
                "bounds": bounds(obj),
            }
        )
    armatures = []
    for obj in bpy.context.scene.objects:
        if obj.type != "ARMATURE":
            continue
        armatures.append({"name": obj.name, "bones": [b.name for b in obj.data.bones]})
    report = {
        "file": os.path.abspath(path),
        "bytes": os.path.getsize(path),
        "meshes": meshes,
        "armatures": armatures,
    }
    os.makedirs(os.path.dirname(os.path.abspath(out_json)), exist_ok=True)
    with open(out_json, "w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)
    if out_png:
        scene = bpy.context.scene
        scene.render.engine = "BLENDER_EEVEE"
        scene.render.resolution_x = 960
        scene.render.resolution_y = 720
        if scene.world is None:
            scene.world = bpy.data.worlds.new("World")
        scene.world.use_nodes = True
        scene.world.node_tree.nodes["Background"].inputs[0].default_value = (0.08, 0.09, 0.12, 1)
        light_data = bpy.data.lights.new("Key", "SUN")
        light_data.energy = 3.2
        light = bpy.data.objects.new("Key", light_data)
        light.rotation_euler = (0.7, 0.2, 0.4)
        scene.collection.objects.link(light)
        mesh_objs = [o for o in scene.objects if o.type == "MESH"]
        mins = Vector((1e9, 1e9, 1e9))
        maxs = Vector((-1e9, -1e9, -1e9))
        for obj in mesh_objs:
            for corner in obj.bound_box:
                world = obj.matrix_world @ Vector(corner)
                mins.x = min(mins.x, world.x)
                mins.y = min(mins.y, world.y)
                mins.z = min(mins.z, world.z)
                maxs.x = max(maxs.x, world.x)
                maxs.y = max(maxs.y, world.y)
                maxs.z = max(maxs.z, world.z)
        center = (mins + maxs) * 0.5
        size = maxs - mins
        cam_data = bpy.data.cameras.new("Cam")
        cam = bpy.data.objects.new("Cam", cam_data)
        scene.collection.objects.link(cam)
        scene.camera = cam
        dist = max(size.length, 0.5) * 1.3
        cam.location = (center.x + dist * 0.35, center.y - dist, center.z + size.z * 0.08)
        cam.rotation_euler = (center - cam.location).to_track_quat("-Z", "Y").to_euler()
        os.makedirs(os.path.dirname(os.path.abspath(out_png)), exist_ok=True)
        scene.render.filepath = out_png
        bpy.ops.render.render(write_still=True)
    print(json.dumps({"file": path, "meshes": len(meshes), "bones": armatures[0]["bones"][:8] if armatures else []}))


if __name__ == "__main__":
    main()
