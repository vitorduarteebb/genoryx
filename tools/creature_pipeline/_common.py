"""Helpers compartilhados dos scripts Blender do pipeline de criaturas."""

import argparse
import json
import os
import sys

try:
    import bpy
    import mathutils
except ImportError:  # permite importar o modulo fora do Blender (lint/testes)
    bpy = None
    mathutils = None

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import genoryx_chassis  # noqa: E402


def argv():
    """Argumentos depois de '--' na linha de comando do Blender."""
    args = sys.argv
    if "--" in args:
        return args[args.index("--") + 1:]
    return []


def parser(description):
    return argparse.ArgumentParser(description=description, prog="genoryx-creature-pipeline")


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.context.scene.unit_settings.scale_length = 1.0


def import_any(path):
    """Importa GLB/GLTF/FBX/OBJ e devolve os objetos criados."""
    before = set(bpy.data.objects)
    lower = path.lower()

    if lower.endswith((".glb", ".gltf")):
        bpy.ops.import_scene.gltf(filepath=path)
    elif lower.endswith(".fbx"):
        bpy.ops.import_scene.fbx(filepath=path)
    elif lower.endswith(".obj"):
        bpy.ops.wm.obj_import(filepath=path)
    else:
        raise SystemExit("formato nao suportado: %s" % path)

    return [obj for obj in bpy.data.objects if obj not in before]


def mesh_objects(objects=None):
    source = objects if objects is not None else bpy.data.objects
    return [obj for obj in source if obj.type == "MESH"]


def join_meshes(objects, name):
    meshes = mesh_objects(objects)
    if not meshes:
        raise SystemExit("nenhuma malha para juntar")

    bpy.ops.object.select_all(action="DESELECT")
    for obj in meshes:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    if len(meshes) > 1:
        bpy.ops.object.join()

    result = bpy.context.view_layer.objects.active
    result.name = name
    result.data.name = name + "_mesh"
    return result


def world_bounds(obj):
    """(min, max, size, center) em espaco de mundo."""
    corners = [obj.matrix_world @ mathutils.Vector(corner) for corner in obj.bound_box]
    lo = mathutils.Vector((min(c.x for c in corners), min(c.y for c in corners), min(c.z for c in corners)))
    hi = mathutils.Vector((max(c.x for c in corners), max(c.y for c in corners), max(c.z for c in corners)))
    return lo, hi, hi - lo, (lo + hi) * 0.5


def triangle_count(obj):
    obj.data.calc_loop_triangles()
    return len(obj.data.loop_triangles)


def apply_transform(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)


def write_json(path, payload):
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False)
    print("[genoryx] escrito %s" % path)


def read_json(path):
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def report(payload):
    """Saida legivel por script e por humano."""
    print("GENORYX_PIPELINE_JSON " + json.dumps(payload, ensure_ascii=False))
    return payload


def contract():
    return genoryx_chassis.CONTRACT


def vec(values):
    return mathutils.Vector(values)
