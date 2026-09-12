"""
Etapa 5 — TRANSFER WEIGHTS.

Copia pesos de uma peca de referencia (tipicamente a peca V1 procedural exportada
do Unity, ou a HEAD_01 ja aprovada) para uma peca nova do MESMO slot.

Serve para o caso comum: HEAD_05 chegou do Meshy com topologia diferente,
mas precisa deformar identico a HEAD_01 no Idle/Walk/Run. Repintar a mao
quebraria a garantia de "mesmas animacoes para todas as combinacoes".

Uso:
  blender -b -P tools/creature_pipeline/transfer_weights.py -- \
      --source work/HEAD_01_bound.blend --target work/HEAD_05_fit.blend \
      --slot HEAD --output work/HEAD_05_bound.blend
"""

import os

import bpy

import _common as C
import genoryx_chassis


def append_source_mesh(path):
    """Traz a malha de referencia (com vertex groups) do outro .blend."""
    with bpy.data.libraries.load(os.path.abspath(path), link=False) as (source, target):
        target.objects = list(source.objects)

    appended = []
    for obj in target.objects:
        if obj is not None and obj.type == "MESH":
            bpy.context.collection.objects.link(obj)
            appended.append(obj)
    return appended


def main():
    ap = C.parser("Transfere pesos entre pecas do mesmo slot")
    ap.add_argument("--source", required=True, help=".blend de referencia, ja bindado")
    ap.add_argument("--target", required=True, help=".blend da peca nova, ja fitted")
    ap.add_argument("--slot", required=True)
    ap.add_argument("--output", required=True)
    ap.add_argument("--json", default=None)
    args = ap.parse_args(C.argv())

    slot = args.slot.upper()
    if not genoryx_chassis.is_skinned_slot(slot):
        raise SystemExit("slot rigido nao usa pesos: %s" % slot)

    bpy.ops.wm.open_mainfile(filepath=os.path.abspath(args.target))
    targets = C.mesh_objects()
    if not targets:
        raise SystemExit("target sem malha")
    target_mesh = targets[0]

    donors = append_source_mesh(args.source)
    if not donors:
        raise SystemExit("source sem malha")
    donor = donors[0]

    if not donor.vertex_groups:
        raise SystemExit("source sem vertex groups: rode bind_to_skeleton antes")

    bpy.ops.object.select_all(action="DESELECT")
    donor.select_set(True)
    target_mesh.select_set(True)
    bpy.context.view_layer.objects.active = target_mesh

    bpy.ops.object.data_transfer(
        use_reverse_transfer=True,
        vert_mapping="POLYINTERP_NEAREST",
        data_types_verts={"VGROUP_WEIGHTS"},
        layers_select_src="ALL",
        layers_select_dst="NAME",
    )

    # Reordena os vertex groups na ordem canonica: o exportador FBX segue esta lista.
    order = genoryx_chassis.bone_order()
    for name in order:
        if name not in [group.name for group in target_mesh.vertex_groups]:
            target_mesh.vertex_groups.new(name=name)

    transferred = len(target_mesh.vertex_groups)

    bpy.data.objects.remove(donor, do_unlink=True)

    rig = next((obj for obj in bpy.data.objects if obj.type == "ARMATURE"), None)
    if rig is None:
        import bind_to_skeleton
        rig = bind_to_skeleton.build_rig(genoryx_chassis.CONTRACT)

    if not any(modifier.type == "ARMATURE" for modifier in target_mesh.modifiers):
        modifier = target_mesh.modifiers.new(name="GenoryxArmature", type="ARMATURE")
        modifier.object = rig
    target_mesh.parent = rig

    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(args.output))

    payload = {
        "step": "transfer_weights",
        "source": args.source,
        "target": args.target,
        "output": args.output,
        "slot": slot,
        "vertexGroups": transferred,
        "accepted": transferred >= len(order),
    }

    if args.json:
        C.write_json(args.json, payload)
    return C.report(payload)


if __name__ == "__main__":
    main()
