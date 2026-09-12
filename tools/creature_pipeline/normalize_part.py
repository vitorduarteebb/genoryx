"""
Etapa 2 — NORMALIZE.

Deixa a peca no padrao GENORYX antes de qualquer ajuste ao chassi:
  - unidades em metros, escala 1;
  - eixo frontal +Z, cima +Y (Meshy costuma entregar Z-up);
  - origem no ponto de encaixe do slot, nao no centro do bounding box;
  - normais consistentes, sem loose geometry, sem material herdado do Meshy;
  - decimacao opcional para caber no orcamento de triangulos.

Uso:
  blender -b -P tools/creature_pipeline/normalize_part.py -- \
      --input raw/HORNS_03.glb --slot HORNS --output work/HORNS_03.blend --max-tris 4000
"""

import os

import bpy

import _common as C


# Onde fica a origem da peca depois de normalizar.
# "base"   -> centro da face inferior (chifres, espinhos, cristais crescem daqui)
# "center" -> centro do bounding box (olhos, core)
# "front"  -> centro da face traseira (cabeca e cauda encaixam por tras)
SLOT_ORIGIN = {
    "BODY": "center",
    "HEAD": "front",
    "EYES": "center",
    "HORNS": "base",
    "LIMBS": "top",
    "TAIL": "front",
    "BACK": "base",
    "CORE": "center",
}


def set_origin(obj, mode):
    """Move os vertices para que o ponto de encaixe do slot fique em (0,0,0).
    Exige transform ja aplicado (matrix_world == identidade)."""
    lo, hi, _, center = C.world_bounds(obj)

    if mode == "base":
        pivot = C.vec((center.x, lo.y, center.z))
    elif mode == "top":
        pivot = C.vec((center.x, hi.y, center.z))
    elif mode == "front":
        pivot = C.vec((center.x, center.y, lo.z))
    else:
        pivot = center

    local_pivot = obj.matrix_world.inverted() @ pivot
    for vertex in obj.data.vertices:
        vertex.co -= local_pivot

    obj.data.update()


def main():
    ap = C.parser("Normaliza uma peca de criatura")
    ap.add_argument("--input", required=True)
    ap.add_argument("--slot", required=True)
    ap.add_argument("--output", required=True)
    ap.add_argument("--max-tris", type=int, default=6000)
    ap.add_argument("--zup", action="store_true", help="asset de origem esta em Z-up")
    ap.add_argument("--json", default=None)
    args = ap.parse_args(C.argv())

    C.reset_scene()
    created = C.import_any(args.input)
    merged = C.join_meshes(created, "GENORYX_PART")

    bpy.context.view_layer.objects.active = merged
    bpy.ops.object.select_all(action="DESELECT")
    merged.select_set(True)

    if args.zup:
        merged.rotation_euler = (-1.5707963, 0.0, 0.0)

    C.apply_transform(merged)

    # Limpeza: solda vertices, remove geometria solta, recalcula normais.
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.remove_doubles(threshold=0.0002)
    bpy.ops.mesh.delete_loose()
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode="OBJECT")

    before_tris = C.triangle_count(merged)
    if before_tris > args.max_tris:
        ratio = max(0.02, float(args.max_tris) / float(before_tris))
        modifier = merged.modifiers.new(name="GenoryxDecimate", type="DECIMATE")
        modifier.ratio = ratio
        bpy.ops.object.modifier_apply(modifier=modifier.name)

    # Material do Meshy nao sobrevive: no Unity quem manda e GENORYX/Creature.
    merged.data.materials.clear()

    origin_mode = SLOT_ORIGIN.get(args.slot.upper(), "center")
    set_origin(merged, origin_mode)
    merged.location = (0.0, 0.0, 0.0)
    C.apply_transform(merged)

    lo, hi, size, center = C.world_bounds(merged)
    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(args.output))

    payload = {
        "step": "normalize",
        "input": args.input,
        "output": args.output,
        "slot": args.slot.upper(),
        "originMode": origin_mode,
        "trianglesBefore": before_tris,
        "trianglesAfter": C.triangle_count(merged),
        "size": [round(size.x, 4), round(size.y, 4), round(size.z, 4)],
        "accepted": True,
    }

    if args.json:
        C.write_json(args.json, payload)
    return C.report(payload)


if __name__ == "__main__":
    main()
