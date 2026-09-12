"""Transfere pesos do Canonical Body para a peça (Data Transfer / nearest face)."""
from __future__ import annotations

import argparse
import os
import sys

import bpy


SLOT_BONES = {
    "HAIR": ("Head", "Neck"),
    "CHEST": ("Spine", "Chest", "UpperChest", "Shoulder", "UpperArm", "LeftShoulder", "RightShoulder", "LeftUpperArm", "RightUpperArm"),
    "LEGS": ("Pelvis", "Hips", "UpperLeg", "LowerLeg", "LeftUpperLeg", "RightUpperLeg", "LeftLowerLeg", "RightLowerLeg"),
    "BOOTS": ("LowerLeg", "Foot", "Toes", "LeftLowerLeg", "RightLowerLeg", "LeftFoot", "RightFoot", "LeftToes", "RightToes"),
}


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--body", required=True)
    parser.add_argument("--part", required=True)
    parser.add_argument("--slot", required=True)
    parser.add_argument("--out", required=True)
    return parser.parse_args(argv)


def first(kind: str):
    for obj in bpy.context.scene.objects:
        if obj.type == kind:
            return obj
    return None


def main():
    args = parse_args()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=args.body)
    armature = first("ARMATURE")
    body = first("MESH")
    if body is None:
        raise SystemExit("Canonical body sem mesh para doar pesos.")
    body.name = "WeightSource"

    bpy.ops.import_scene.gltf(filepath=args.part)
    part = None
    for obj in bpy.context.scene.objects:
        if obj.type == "MESH" and obj != body:
            part = obj
    if part is None:
        raise SystemExit("Peça sem mesh.")
    part.name = args.slot

    if armature is None:
        os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
        bpy.ops.object.select_all(action="DESELECT")
        part.select_set(True)
        bpy.ops.export_scene.gltf(filepath=args.out, export_format="GLB", use_selection=True, export_skins=False)
        print("NO_ARMATURE " + args.out)
        return

    bpy.ops.object.select_all(action="DESELECT")
    part.select_set(True)
    bpy.context.view_layer.objects.active = part
    transfer = part.modifiers.new(name="DataTransfer", type="DATA_TRANSFER")
    transfer.object = body
    transfer.use_vert_data = True
    transfer.data_types_verts = {"VGROUP_WEIGHTS"}
    transfer.vert_mapping = "POLYINTERP_NEAREST"
    bpy.ops.object.datalayout_transfer(modifier="DataTransfer")
    bpy.ops.object.modifier_apply(modifier="DataTransfer")

    if part.modifiers.get("Armature") is None:
        arm_mod = part.modifiers.new(name="CanonicalSkeleton", type="ARMATURE")
        arm_mod.object = armature

    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    part.select_set(True)
    armature.select_set(True)
    bpy.context.view_layer.objects.active = part
    bpy.ops.export_scene.gltf(filepath=args.out, export_format="GLB", use_selection=True, export_skins=True)
    print(args.out)


if __name__ == "__main__":
    main()
