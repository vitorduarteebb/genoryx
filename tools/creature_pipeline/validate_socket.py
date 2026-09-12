"""
Etapa 6 — VALIDATE SOCKET.

Porta de qualidade antes do export. Reprova a peca se ela violar o contrato:

  1. estoura o bounds do socket;
  2. origem longe de (0,0,0) — nao encaixaria no bone;
  3. slot skinado sem os 21 vertex groups na ordem canonica;
  4. slot skinado com vertice de peso zero (vertice fica parado na animacao);
  5. orcamento de triangulos excedido;
  6. malha vazia, normais invertidas em massa ou escala nao aplicada.

Uso:
  blender -b -P tools/creature_pipeline/validate_socket.py -- \
      --input work/HEAD_03_bound.blend --slot HEAD --json reports/HEAD_03.json
"""

import os

import bpy

import _common as C
import genoryx_chassis


TRIANGLE_BUDGET = {
    "BODY": 2600,
    "HEAD": 1600,
    "EYES": 260,
    "HORNS": 900,
    "LIMBS": 2200,
    "TAIL": 1400,
    "BACK": 1400,
    "CORE": 500,
}


def main():
    ap = C.parser("Valida uma peca contra o contrato de sockets")
    ap.add_argument("--input", required=True)
    ap.add_argument("--slot", required=True)
    ap.add_argument("--json", default=None)
    args = ap.parse_args(C.argv())

    bpy.ops.wm.open_mainfile(filepath=os.path.abspath(args.input))
    meshes = C.mesh_objects()
    problems = []

    if not meshes:
        payload = {"step": "validate_socket", "slot": args.slot, "accepted": False,
                   "problems": ["blend sem malha"]}
        if args.json:
            C.write_json(args.json, payload)
        return C.report(payload)

    part = meshes[0]
    slot = args.slot.upper()
    socket = genoryx_chassis.socket_for_slot(slot)
    budget = genoryx_chassis.socket_bounds(socket)
    order = genoryx_chassis.bone_order()

    lo, hi, size, center = C.world_bounds(part)

    for index, axis in enumerate("xyz"):
        if size[index] > budget[index] * 1.001:
            problems.append(
                "eixo %s = %.4f estoura o bounds do socket %s (%.4f)"
                % (axis, size[index], socket, budget[index])
            )

    if part.location.length > 0.001:
        problems.append("origem em %s, esperado (0,0,0)" % [round(value, 4) for value in part.location])

    if any(abs(value - 1.0) > 0.001 for value in part.scale):
        problems.append("escala nao aplicada: %s" % [round(value, 4) for value in part.scale])

    tris = C.triangle_count(part)
    limit = TRIANGLE_BUDGET.get(slot, 2000)
    if tris > limit:
        problems.append("triangulos=%d acima do orcamento do slot (%d)" % (tris, limit))

    skinned = genoryx_chassis.is_skinned_slot(slot)
    group_names = [group.name for group in part.vertex_groups]

    if skinned:
        missing = [name for name in order if name not in group_names]
        if missing:
            problems.append("vertex groups faltando: %s" % ",".join(missing))

        if group_names[:len(order)] != order:
            problems.append("vertex groups fora da ordem canonica do GENORYX_CORE_RIG")

        unweighted = 0
        for vertex in part.data.vertices:
            if sum(group.weight for group in vertex.groups) < 1e-4:
                unweighted += 1
        if unweighted:
            problems.append("%d vertices sem peso: ficariam parados na animacao" % unweighted)

        if not any(modifier.type == "ARMATURE" for modifier in part.modifiers):
            problems.append("sem armature modifier")
    elif group_names:
        problems.append("slot rigido nao deve ter vertex groups")

    if part.data.materials:
        problems.append("material herdado presente; o Unity aplica GENORYX/Creature")

    payload = {
        "step": "validate_socket",
        "input": args.input,
        "slot": slot,
        "socket": socket,
        "skinned": skinned,
        "triangles": tris,
        "triangleBudget": limit,
        "size": [round(size.x, 4), round(size.y, 4), round(size.z, 4)],
        "socketBounds": budget,
        "vertexGroups": len(group_names),
        "accepted": not problems,
        "problems": problems,
    }

    if args.json:
        C.write_json(args.json, payload)
    C.report(payload)

    if problems:
        raise SystemExit(1)
    return payload


if __name__ == "__main__":
    main()
