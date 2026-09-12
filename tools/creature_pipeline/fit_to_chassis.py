"""
Etapa 3 — FIT TO CHASSIS.

Escala e posiciona a peca normalizada no socket do GENORYX_CORE_CHASSIS_V1.

Regra do item 5 da spec: o socket NUNCA se move para a peca caber.
Este script sempre transforma a PECA, jamais o contrato.

Uso:
  blender -b -P tools/creature_pipeline/fit_to_chassis.py -- \
      --input work/HORNS_03.blend --slot HORNS --output work/HORNS_03_fit.blend
"""

import os

import bpy

import _common as C
import genoryx_chassis


def uniform_fit(size, budget):
    """Maior escala uniforme que caiba dentro do bounds do socket."""
    factors = []
    for axis in range(3):
        if size[axis] > 1e-6:
            factors.append(budget[axis] / size[axis])
    return min(factors) if factors else 1.0


def main():
    ap = C.parser("Ajusta uma peca ao chassi canonico")
    ap.add_argument("--input", required=True)
    ap.add_argument("--slot", required=True)
    ap.add_argument("--output", required=True)
    ap.add_argument("--fill", type=float, default=0.92, help="fracao do bounds que a peca deve ocupar")
    ap.add_argument("--json", default=None)
    args = ap.parse_args(C.argv())

    bpy.ops.wm.open_mainfile(filepath=os.path.abspath(args.input))
    meshes = C.mesh_objects()
    if not meshes:
        raise SystemExit("blend sem malha: %s" % args.input)

    part = meshes[0]
    slot = args.slot.upper()
    socket = genoryx_chassis.socket_for_slot(slot)
    if socket is None:
        raise SystemExit("slot desconhecido: %s" % slot)

    budget = [value * args.fill for value in genoryx_chassis.socket_bounds(socket)]

    _, _, size, _ = C.world_bounds(part)
    scale = uniform_fit(size, budget)

    part.scale = (scale, scale, scale)
    C.apply_transform(part)

    # A peca fica na origem: o Unity a parenteia ao bone do socket, que ja carrega
    # posicao e rotacao de repouso. Assim o mesmo FBX serve para L e R por espelhamento.
    part.location = (0.0, 0.0, 0.0)
    part.rotation_euler = (0.0, 0.0, 0.0)
    C.apply_transform(part)

    _, _, fitted, _ = C.world_bounds(part)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(args.output))

    payload = {
        "step": "fit_to_chassis",
        "input": args.input,
        "output": args.output,
        "slot": slot,
        "socket": socket,
        "appliedScale": round(scale, 5),
        "socketBudget": [round(value, 4) for value in budget],
        "fittedSize": [round(fitted.x, 4), round(fitted.y, 4), round(fitted.z, 4)],
        "accepted": True,
    }

    if args.json:
        C.write_json(args.json, payload)
    return C.report(payload)


if __name__ == "__main__":
    main()
