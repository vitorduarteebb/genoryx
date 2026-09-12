"""
Contrato do GENORYX_CORE_CHASSIS_V1 / GENORYX_CORE_RIG para o pipeline Blender.

FONTE DE VERDADE: apps/unity-game/Assets/GENORYX/Scripts/Creature/CreatureSockets.cs

O builder do Unity exporta chassis_contract.json ao rodar
"GENORYX/Creatures/Build Creature System V1". Este modulo le esse arquivo.
O fallback embutido existe apenas para permitir rodar o pipeline sem o Unity aberto;
se os dois divergirem, o JSON exportado ganha.
"""

import json
import os

CONTRACT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chassis_contract.json")

FALLBACK = {
    "chassisId": "GENORYX_CORE_CHASSIS_V1",
    "rigId": "GENORYX_CORE_RIG",
    "units": "meters",
    "forwardAxis": "+Z",
    "upAxis": "+Y",
    "dimensions": {"height": 0.60, "length": 0.84, "width": 0.63},
    "boneOrder": [
        "GenoryxRoot", "Body", "Head", "EyeSocket_L", "EyeSocket_R",
        "HornSocket_L", "HornSocket_R", "FrontLimb_L", "FrontFoot_L",
        "FrontLimb_R", "FrontFoot_R", "RearLimb_L", "RearFoot_L",
        "RearLimb_R", "RearFoot_R", "TailRoot", "TailMid", "TailTip",
        "BackSocket_L", "BackSocket_R", "CoreSocket",
    ],
    "parents": {
        "GenoryxRoot": None,
        "Body": "GenoryxRoot",
        "Head": "Body",
        "EyeSocket_L": "Head", "EyeSocket_R": "Head",
        "HornSocket_L": "Head", "HornSocket_R": "Head",
        "FrontLimb_L": "Body", "FrontFoot_L": "FrontLimb_L",
        "FrontLimb_R": "Body", "FrontFoot_R": "FrontLimb_R",
        "RearLimb_L": "Body", "RearFoot_L": "RearLimb_L",
        "RearLimb_R": "Body", "RearFoot_R": "RearLimb_R",
        "TailRoot": "Body", "TailMid": "TailRoot", "TailTip": "TailMid",
        "BackSocket_L": "Body", "BackSocket_R": "Body",
        "CoreSocket": "Body",
    },
    # Posicoes em espaco do CreatureRoot, pose de repouso.
    "restWorld": {
        "GenoryxRoot": [0.0, 0.0, 0.0],
        "Body": [0.0, 0.340, -0.130],
        "Head": [0.0, 0.415, 0.155],
        "EyeSocket_L": [-0.168, 0.455, 0.288],
        "EyeSocket_R": [0.168, 0.455, 0.288],
        "HornSocket_L": [-0.088, 0.520, 0.180],
        "HornSocket_R": [0.088, 0.520, 0.180],
        "FrontLimb_L": [-0.205, 0.195, 0.045],
        "FrontFoot_L": [-0.205, 0.032, 0.045],
        "FrontLimb_R": [0.205, 0.195, 0.045],
        "FrontFoot_R": [0.205, 0.032, 0.045],
        "RearLimb_L": [-0.225, 0.195, -0.310],
        "RearFoot_L": [-0.225, 0.032, -0.310],
        "RearLimb_R": [0.225, 0.195, -0.310],
        "RearFoot_R": [0.225, 0.032, -0.310],
        "TailRoot": [0.0, 0.330, -0.445],
        "TailMid": [0.0, 0.342, -0.560],
        "TailTip": [0.0, 0.352, -0.675],
        "BackSocket_L": [-0.098, 0.566, -0.140],
        "BackSocket_R": [0.098, 0.566, -0.140],
        "CoreSocket": [0.268, 0.415, -0.020],
    },
    "restEuler": {
        "HornSocket_L": [-12.0, 0.0, 14.0],
        "HornSocket_R": [-12.0, 0.0, -14.0],
        "BackSocket_L": [0.0, 0.0, 16.0],
        "BackSocket_R": [0.0, 0.0, -16.0],
        "CoreSocket": [0.0, 0.0, -22.0],
    },
    # Bounds aceitaveis por socket. Peca que estoura isto e REJEITADA.
    "socketBounds": {
        "Head": [0.48, 0.30, 0.36],
        "Body": [0.66, 0.50, 0.64],
        "EyeSocket_L": [0.08, 0.08, 0.10], "EyeSocket_R": [0.08, 0.08, 0.10],
        "HornSocket_L": [0.10, 0.20, 0.14], "HornSocket_R": [0.10, 0.20, 0.14],
        "BackSocket_L": [0.14, 0.18, 0.40], "BackSocket_R": [0.14, 0.18, 0.40],
        "CoreSocket": [0.12, 0.12, 0.12],
        "TailRoot": [0.16, 0.16, 0.42],
        "FrontLimb_L": [0.14, 0.22, 0.14], "FrontLimb_R": [0.14, 0.22, 0.14],
        "RearLimb_L": [0.14, 0.22, 0.14], "RearLimb_R": [0.14, 0.22, 0.14],
    },
    # Peca skinada (bind ao rig) vs peca rigida (parent ao socket).
    "skinnedSlots": ["BODY", "HEAD", "LIMBS", "TAIL"],
    "rigidSlots": ["EYES", "HORNS", "BACK", "CORE"],
    "slotSocket": {
        "BODY": "Body",
        "HEAD": "Head",
        "EYES": "EyeSocket_L",
        "HORNS": "HornSocket_L",
        "LIMBS": "FrontLimb_L",
        "TAIL": "TailRoot",
        "BACK": "BackSocket_L",
        "CORE": "CoreSocket",
    },
}


def load():
    """Contrato canonico. Prefere o JSON exportado pelo Unity."""
    if os.path.exists(CONTRACT_PATH):
        try:
            with open(CONTRACT_PATH, "r", encoding="utf-8") as handle:
                data = json.load(handle)
            merged = dict(FALLBACK)
            merged.update(data)
            return merged
        except (ValueError, OSError) as error:
            print("[genoryx] contrato JSON invalido (%s), usando fallback" % error)
    return dict(FALLBACK)


CONTRACT = load()


def rest_world(bone):
    return CONTRACT["restWorld"].get(bone, [0.0, 0.0, 0.0])


def socket_for_slot(slot):
    return CONTRACT["slotSocket"].get(slot.upper())


def socket_bounds(socket):
    return CONTRACT["socketBounds"].get(socket, [0.2, 0.2, 0.2])


def is_skinned_slot(slot):
    return slot.upper() in CONTRACT["skinnedSlots"]


def bone_order():
    return list(CONTRACT["boneOrder"])
