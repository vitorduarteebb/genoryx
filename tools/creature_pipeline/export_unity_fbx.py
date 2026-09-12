"""
Etapa 7 — EXPORT UNITY FBX.

Exporta a peca aprovada para Assets/GENORYX/Creatures/CoreV1/<Pasta>/.

Ajustes obrigatorios para o Unity nao inverter nada:
  - eixo primario -Z forward, secundario Y up;
  - escala global 1.0, apply_unit_scale;
  - armature sem "leaf bones" (o Unity criaria bones extra e quebraria a ordem);
  - sem animacao no FBX de peca: os clipes vivem em Animations/ e sao compartilhados.

Uso:
  blender -b -P tools/creature_pipeline/export_unity_fbx.py -- \
      --input work/HEAD_03_bound.blend --slot HEAD --part-id HEAD_03_DRACONIC \
      --unity-root apps/unity-game
"""

import os

import bpy

import _common as C
import genoryx_chassis


SLOT_FOLDER = {
    "BODY": "Bodies",
    "HEAD": "Heads",
    "EYES": "Eyes",
    "HORNS": "Horns",
    "LIMBS": "Limbs",
    "TAIL": "Tails",
    "BACK": "Back",
    "CORE": "Cores",
}


def main():
    ap = C.parser("Exporta uma peca aprovada como FBX para o Unity")
    ap.add_argument("--input", required=True)
    ap.add_argument("--slot", required=True)
    ap.add_argument("--part-id", required=True)
    ap.add_argument("--unity-root", default="apps/unity-game")
    ap.add_argument("--json", default=None)
    args = ap.parse_args(C.argv())

    slot = args.slot.upper()
    folder = SLOT_FOLDER.get(slot)
    if folder is None:
        raise SystemExit("slot desconhecido: %s" % slot)

    bpy.ops.wm.open_mainfile(filepath=os.path.abspath(args.input))

    target_dir = os.path.abspath(os.path.join(
        args.unity_root, "Assets", "GENORYX", "Creatures", "CoreV1", folder, "Source"))
    os.makedirs(target_dir, exist_ok=True)
    fbx_path = os.path.join(target_dir, args.part_id + ".fbx")

    skinned = genoryx_chassis.is_skinned_slot(slot)
    object_types = {"MESH", "ARMATURE"} if skinned else {"MESH"}

    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.fbx(
        filepath=fbx_path,
        use_selection=True,
        object_types=object_types,
        apply_unit_scale=True,
        global_scale=1.0,
        apply_scale_options="FBX_SCALE_NONE",
        axis_forward="-Z",
        axis_up="Y",
        mesh_smooth_type="FACE",
        use_mesh_modifiers=False,
        add_leaf_bones=False,
        primary_bone_axis="Y",
        secondary_bone_axis="X",
        bake_anim=False,
        path_mode="COPY",
        embed_textures=False,
    )

    payload = {
        "step": "export_unity_fbx",
        "input": args.input,
        "output": fbx_path,
        "slot": slot,
        "partId": args.part_id,
        "skinned": skinned,
        "accepted": os.path.exists(fbx_path),
        "next": "aponte CreaturePartDefinition.mesh para a malha deste FBX; "
                "o CreatureAssembler passa a usar o asset em vez do procedural",
    }

    if args.json:
        C.write_json(args.json, payload)
    return C.report(payload)


if __name__ == "__main__":
    main()
