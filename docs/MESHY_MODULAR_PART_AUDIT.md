# Auditoria modular — GLBs Meshy existentes

Inspeção Blender 5.1 (`tools/character_pipeline/inspect_glb.py` + renders em `tools/character_pipeline/_audit/previews/`).

Originais **não** foram alterados.

## Métodos suportados pela integração (sem inventar)

| Modo | Endpoint | No projeto |
| --- | --- | --- |
| Text-to-3D preview/refine | `POST/GET /openapi/v2/text-to-3d` | `MeshyHumanoidClient` |
| Remesh | `POST/GET /openapi/v1/remesh` | `MeshyHumanoidClient` |
| Rigging | `POST/GET /openapi/v1/rigging` | só BODY |
| Animations | `POST/GET /openapi/v1/animations` | só BODY |
| Multi-image-to-3D | `POST/GET /openapi/v1/multi-image-to-3d` | `MeshyMultiImageClient` (criaturas) |
| Image-to-3D | `POST/GET /openapi/v1/image-to-3d` | oficial Meshy; wrapper adicionado só para HAIR_TEST |

## Resultado por asset

| asset | meshes | mats | islands | verts | skeleton | pele≠roupa | visual | veredito |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| hair_01 | 1 | 1 textured | 3186 (triângulos soltos) | 15772 | não | não | **rosto + pescoço + cabelo** | `REJECTED_NOT_MODULAR` |
| hair_02 | 1 | 1 textured | 3479 | 18140 | não | não | cabelo + **volume de crânio/pele** | `REJECTED_NOT_MODULAR` |
| chest_01 | 1 | 1 textured | 2339 | 17153 | não | n/a | **colete oco**, sem anatomia | `SAVED_AS_IS` |
| chest_02 | 1 | 1 textured | 3677 | 20888 | não | n/a | **jaqueta oca**, sem anatomia | `SAVED_AS_IS` |
| legs_01 | 1 | 1 textured | 1485 | 12035 | não | não | calça oca **fundida com tênis** | `REJECTED_NOT_MODULAR` (não é só pants) |
| legs_02 | 1 | 1 textured | 2256 | 14101 | não | não | calça oca **fundida com botas** | `REJECTED_NOT_MODULAR` |
| boots_01 | 1 | 1 textured | 2672 | 13028 | não | n/a | **par de botas oco** | `SAVED_AS_IS` |
| boots_02 | 1 | 1 textured | 1956 | 11375 | não | n/a | **par de botas oco** | `SAVED_AS_IS` |
| body_a_01 | 2 | 1 | 4341 | 36304 | sim (rig FASE 1) | não | Tamer vestido completo | corpo canônico |

`islands` altos = topologia Meshy não soldada, **não** são peças semânticas. Separar por loose parts destruiria o asset. Extração por material impossível (1 material atlas).

## Conclusão

- **Cabelo atual não é salvável.** hair_01 tem cabeça humana. hair_02 tem manequim interno.
- **Chest e Boots atuais já são roupa oca.** Copiados para `Processed/` sem recorte.
- **Legs atuais não são calça modular.** Calça+calçado fundidos no mesmo material.
- Próximo gasto Meshy: **somente HAIR_TEST_01** (image-to-3D com referência só de cabelo).
