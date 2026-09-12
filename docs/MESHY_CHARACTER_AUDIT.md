# Auditoria Meshy — personagem 3D

Nenhum asset desta lista é PNG de preview. Magic `glTF` confirmado em todos os GLB.

| assetId | tipo | task refine/rig | status | arquivo local | bytes | créditos |
| --- | --- | --- | --- | --- | --- | --- |
| phase1_tamer | character + rig | `01a069c8-5b92-72cd-bd06-dbee856ac406` | SUCCEEDED | `phase1/tamer.rigged.glb` | 7 924 084 | 38 |
| body_a_01 | cópia do tamer rigado | mesmo rig | SUCCEEDED | `Generated/Bodies/body_a_01.glb` | 7 924 084 | 0 |
| hair_01_short | refine GLB | `01a06a4a-4e55-7743-976c-6597391dfe08` | SUCCEEDED | `Generated/Hair/hair_01.glb` | 5 084 048 | 30 |
| hair_02_messy | refine GLB | `01a06a4c-9d3e-701f-8b04-c2f233f3af53` | SUCCEEDED | `Generated/Hair/hair_02.glb` | 5 935 104 | 30 |
| chest_novice_tamer | refine GLB | `01a06a4f-2c5d-71a8-ab80-c7f17c827ab8` | SUCCEEDED | `Generated/Chest/chest_01.glb` | 7 671 032 | 30 |
| chest_field_explorer | refine GLB | `01a06a51-7c0e-7048-9b0a-f2dce5d91227` | SUCCEEDED | `Generated/Chest/chest_02.glb` | 7 922 172 | 30 |
| legs_explorer | refine GLB | `01a06a53-85a5-7759-a62d-d8a7c05738af` | SUCCEEDED | `Generated/Legs/legs_01.glb` | 6 750 908 | 30 |
| legs_reinforced | refine GLB | `01a06a55-f44e-772b-a57d-9017235b2e0b` | SUCCEEDED | `Generated/Legs/legs_02.glb` | 6 602 908 | 30 |
| boots_explorer | refine GLB | `01a06a58-21d8-7713-99b8-7e6d0492bf77` | SUCCEEDED | `Generated/Boots/boots_01.glb` | 8 914 612 | 30 |
| boots_leather | refine GLB | `01a06a5a-7242-723a-bc32-eeeb8f6be270` | SUCCEEDED | `Generated/Boots/boots_02.glb` | 6 149 540 | 30 |

Animações do corpo (mesmo rig): `anim.idle.glb`, `anim.walk.glb`, `anim.run.glb`.

Peças de roupa/cabelo **não** passam por auto-rig (não são humanoides). O `CharacterAssembler` instancia o GLB e parenta no bone canônico (`Head`, `Chest`, `Pelvis`). O Animator único fica no Body.

O creator web com `phase1-tamer.png` foi removido. Preview definitivo: cena Unity `CharacterCreation`.
