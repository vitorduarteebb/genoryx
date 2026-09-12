# Sistema de personagem 3D — GENORYX

Arquitetura definitiva do avatar humano. Direção visual: `docs/CHARACTER_ART.md`. Pipeline Meshy: `docs/MESHY_CHARACTER_PIPELINE.md`. ADR 0028.

## Estado

**FASE 1 (agora):** Tamer 3D real no Unity (`CharacterCreation` + Haven). O preview web com PNG foi removido. O Character Creator definitivo é Unity: `CharacterAssembler` troca mesh/material de verdade. Catálogo mínimo: 1 corpo, 1 rosto, 2 cabelos, 2 peitos, 2 pernas, 2 botas.

**FASE 2 (depois da aprovação visual):** catálogo modular (vários cabelos, peitos, botas, capas) e NPCs no mesmo assembler.

## Skeleton canônico

Unity Humanoid. Gameplay nunca lê nomes originais da Meshy.

| Bone | Uso |
| --- | --- |
| Root | raiz |
| Pelvis | quadril |
| Spine / Chest / UpperChest | tronco |
| Neck / Head | cabeça |
| Left/Right Shoulder, UpperArm, LowerArm, Hand | braços |
| Left/Right UpperLeg, LowerLeg, Foot, Toes | pernas |

`BoneMapper` traduz nomes Meshy → canônico. Avatar Humanoid é validado no Editor.

## Slots

`BODY` `FACE` `HAIR` `EYEBROWS` `BEARD` `CHEST` `LEGS` `GLOVES` `BOOTS` `SHOULDER` `CAPE` `BACK` `ACCESSORY` `WEAPON_RIGHT` `WEAPON_LEFT`

Hierarquia:

```
CharacterRoot          CapsuleCollider, motor, network
  Gameplay
  CreatureFollowAnchor  Pyron segue o root, não um bone
  CharacterVisualRoot
    CanonicalSkeleton
    Body / Head / Hair / Chest / Legs / Gloves / Boots
    Shoulder / Cape / Back
    WeaponRightAnchor / WeaponLeftAnchor
```

FASE 1 instancia um GLB único no `CharacterVisualRoot`. Os slots já existem no payload.

## Persistência

Servidor guarda IDs, nunca GameObject.

```ts
CharacterAppearance {
  bodyType, faceId, skinTone, eyeColor, eyebrowId,
  hairId, hairColor, beardId,
  chestId, legsId, glovesId, bootsId, capeId, backId
}
```

Colunas: `characters.appearance_json`, `characters.appearance_confirmed`.

Fluxo: Account → nome → `/game/appearance` → confirmar → starter → Haven.

O World recusa entrada sem `appearanceConfirmed`.

## Assembly

`CharacterAssembler` consulta `CharacterPartDatabase` (ScriptableObjects). FASE 1: uma definição `phase1_tamer` que aponta para o GLB Meshy.

Cores (pele, cabelo, olhos) usam `MaterialPropertyBlock` + paleta. Não gerar textura nova por tom.

## Animação

`applyRootMotion = false`. O motor move; `Speed` escolhe Idle / Walk / Run.

Mínimo FASE 1: Idle, Walk, Run. Obrigatório do personagem inicial também: Interact, Hit, Death (quando o `action_id` Meshy existir).

Parâmetros: `Speed`, `MovementX`, `MovementY`, `IsMoving`, `IsRunning`, `IsDead`, triggers `Interact` `Hit` `Victory`.

Rotação: slerp / `RotateTowards`, nunca snap de 180°.

Idle: clip Meshy; se a API falhar, respiração leve no mesh real — nunca substituir o corpo por primitiva.

## Performance

Shared materials + MaterialPropertyBlock. CapsuleCollider no root, não na mesh. Cast Shadows on. LODGroup preparado (LOD0 = mesh completa).

`CharacterPerformanceValidator` reporta triângulos, materials, renderers, bones.

## Body Region Mask

Regiões: TORSO, UPPER_ARM, LOWER_ARM, HAND, UPPER_LEG, LOWER_LEG, FOOT. FASE 1: mesh única, máscara reservada.

## Multiplayer

O estado sincronizado é `CharacterAppearance` (IDs). Cada cliente monta o visual. Posição continua authoritative.

## Como adicionar (FASE 2)

1. Gerar peça no pipeline Meshy (mesmo prompt-base).
2. Importar GLB, retarget para o skeleton canônico.
3. Criar `CharacterPartDefinition` com `id`, `slot`, `bodyCompatibility`.
4. Registrar no `CharacterPartDatabase`.
5. Liberar o `id` no catálogo de `@nexora/config`.

Não criar skeleton por peça.
