"""
Etapa 4 — BIND TO SKELETON.

Constroi o GENORYX_CORE_RIG dentro do .blend e faz o bind da peca.

Critico: a ORDEM DOS BONES tem que ser exatamente boneOrder do contrato.
O CreatureAssembler do Unity monta SkinnedMeshRenderer.bones nessa ordem;
se o FBX exportar outra ordem, a peca deforma errado.

Slots rigidos (EYES/HORNS/BACK/CORE) nao ganham armature: o Unity parenteia
o MeshRenderer direto no bone do socket. Rodar este script neles e no-op registrado.

Uso:
  blender -b -P tools/creature_pipeline/bind_to_skeleton.py -- \
      --input work/HEAD_03_fit.blend --slot HEAD --output work/HEAD_03_bound.blend
"""

import os

import bpy
import mathutils

import _common as C
import genoryx_chassis


def build_rig(contract):
    """Cria a armature canonica com bones na ordem do contrato."""
    armature_data = bpy.data.armatures.new(contract["rigId"])
    rig = bpy.data.objects.new(contract["rigId"], armature_data)
    bpy.context.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode="EDIT")

    order = contract["boneOrder"]
    parents = contract["parents"]
    rest = contract["restWorld"]
    created = {}

    for name in order:
        bone = armature_data.edit_bones.new(name)
        head = mathutils.Vector(rest[name])
        bone.head = head

        # Bones de folha recebem um tail curto no eixo do pai para nao degenerar.
        children = [child for child in order if parents.get(child) == name]
        if children:
            tail = mathutils.Vector(rest[children[0]])
            if (tail - head).length < 1e-4:
                tail = head + mathutils.Vector((0.0, 0.04, 0.0))
        else:
            tail = head + mathutils.Vector((0.0, 0.05, 0.0))

        bone.tail = tail
        bone.use_connect = False
        created[name] = bone

    for name in order:
        parent = parents.get(name)
        if parent:
            created[name].parent = created[parent]

    bpy.ops.object.mode_set(mode="OBJECT")
    return rig


def weight_paint(part, rig, slot, contract):
    """Pesos deterministicos por proximidade aos bones relevantes do slot.
    Espelha a logica de CreatureMeshLab.BoneWeights no C#, para que asset autorado
    e malha procedural deformem igual."""
    relevant = {
        "BODY": ["Body", "Head", "TailRoot"],
        "HEAD": ["Head", "Body"],
        "LIMBS": [
            "FrontLimb_L", "FrontFoot_L", "FrontLimb_R", "FrontFoot_R",
            "RearLimb_L", "RearFoot_L", "RearLimb_R", "RearFoot_R", "Body",
        ],
        "TAIL": ["TailRoot", "TailMid", "TailTip"],
    }.get(slot.upper(), ["Body"])

    groups = {}
    for name in contract["boneOrder"]:
        groups[name] = part.vertex_groups.new(name=name)

    rest = contract["restWorld"]
    for vertex in part.data.vertices:
        position = part.matrix_world @ vertex.co
        scored = []
        for bone in relevant:
            distance = (position - mathutils.Vector(rest[bone])).length
            scored.append((1.0 / max(distance, 0.02) ** 2.0, bone))

        scored.sort(reverse=True)
        scored = scored[:4]
        total = sum(weight for weight, _ in scored)
        for weight, bone in scored:
            groups[bone].add([vertex.index], weight / total, "REPLACE")

    modifier = part.modifiers.new(name="GenoryxArmature", type="ARMATURE")
    modifier.object = rig
    part.parent = rig


def main():
    ap = C.parser("Faz bind de uma peca ao GENORYX_CORE_RIG")
    ap.add_argument("--input", required=True)
    ap.add_argument("--slot", required=True)
    ap.add_argument("--output", required=True)
    ap.add_argument("--json", default=None)
    args = ap.parse_args(C.argv())

    bpy.ops.wm.open_mainfile(filepath=os.path.abspath(args.input))
    meshes = C.mesh_objects()
    if not meshes:
        raise SystemExit("blend sem malha: %s" % args.input)

    part = meshes[0]
    slot = args.slot.upper()
    contract = genoryx_chassis.CONTRACT

    if not genoryx_chassis.is_skinned_slot(slot):
        bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(args.output))
        payload = {
            "step": "bind_to_skeleton",
            "slot": slot,
            "skinned": False,
            "reason": "slot rigido: Unity parenteia MeshRenderer no bone do socket",
            "output": args.output,
            "accepted": True,
        }
        if args.json:
            C.write_json(args.json, payload)
        return C.report(payload)

    rig = build_rig(contract)
    weight_paint(part, rig, slot, contract)

    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(args.output))

    payload = {
        "step": "bind_to_skeleton",
        "input": args.input,
        "output": args.output,
        "slot": slot,
        "skinned": True,
        "rig": contract["rigId"],
        "boneCount": len(contract["boneOrder"]),
        "vertexGroups": len(part.vertex_groups),
        "accepted": True,
    }

    if args.json:
        C.write_json(args.json, payload)
    return C.report(payload)


if __name__ == "__main__":
    main()
