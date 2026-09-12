"""
Etapa 1 — INSPECT.

Le um asset cru (tipicamente GLB vindo do Meshy) e responde:
  - quantas malhas / triangulos / materiais;
  - dimensoes reais;
  - se o asset parece ser uma PECA ISOLADA ou um CORPO INTEIRO.

A ultima checagem e a regra mais importante do item 18 da spec:
se o Meshy devolveu um corpo, a peca e REJEITADA. Nao se esconde corpo extra no Unity.

Uso:
  blender -b -P tools/creature_pipeline/inspect_asset.py -- \
      --input var/creature-parts/raw/HORNS_03_CRYSTAL.glb --slot HORNS --json out.json
"""

import os

import _common as C


# Heuristica de rejeicao: proporcao maxima esperada da peca contra o chassi inteiro.
SLOT_MAX_SPAN = {
    "BODY": 1.10,
    "HEAD": 0.45,
    "EYES": 0.10,
    "HORNS": 0.26,
    "LIMBS": 0.60,
    "TAIL": 0.85,
    "BACK": 0.50,
    "CORE": 0.14,
}


def main():
    ap = C.parser("Inspeciona um asset cru de peca de criatura")
    ap.add_argument("--input", required=True)
    ap.add_argument("--slot", required=True)
    ap.add_argument("--json", default=None)
    args = ap.parse_args(C.argv())

    C.reset_scene()
    created = C.import_any(args.input)
    meshes = C.mesh_objects(created)

    if not meshes:
        return C.report({
            "step": "inspect",
            "input": args.input,
            "slot": args.slot,
            "accepted": False,
            "reason": "asset sem malha",
        })

    merged = C.join_meshes(meshes, "InspectTarget")
    C.apply_transform(merged)
    lo, hi, size, center = C.world_bounds(merged)

    span = max(size.x, size.y, size.z)
    limit = SLOT_MAX_SPAN.get(args.slot.upper(), 0.5)
    chassis_length = C.contract()["dimensions"]["length"]
    ratio = span / chassis_length if chassis_length else 0.0

    tris = C.triangle_count(merged)
    materials = sorted({slot.material.name for slot in merged.material_slots if slot.material})

    problems = []
    if ratio > limit:
        problems.append(
            "peca ocupa %.2f do comprimento do chassi (limite %.2f) — provavel corpo inteiro" % (ratio, limit)
        )

    # Peca isolada quase nunca tem mais de 4 materiais nem centenas de milhares de tris.
    if len(materials) > 4:
        problems.append("materiais=%d — asset provavelmente composto" % len(materials))
    if tris > 200000:
        problems.append("tris=%d acima do orcamento; precisa de remesh" % tris)
    if len(meshes) > 6:
        problems.append("malhas separadas=%d — verifique se veio criatura completa" % len(meshes))

    payload = {
        "step": "inspect",
        "input": args.input,
        "slot": args.slot.upper(),
        "meshCount": len(meshes),
        "triangles": tris,
        "materials": materials,
        "size": [round(size.x, 4), round(size.y, 4), round(size.z, 4)],
        "center": [round(center.x, 4), round(center.y, 4), round(center.z, 4)],
        "spanRatioVsChassis": round(ratio, 4),
        "spanLimit": limit,
        "accepted": not problems,
        "problems": problems,
    }

    if args.json:
        C.write_json(args.json, payload)
    return C.report(payload)


if __name__ == "__main__":
    main()
