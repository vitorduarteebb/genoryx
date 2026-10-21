# WORLD ART — PERFORMANCE + SCREENSHOT NOTES

Medição completa do `/game/adventure` exige sessão logada + bake WebGL. Este relatório fixa **orçamentos** e como medir depois da integração. Art não publicou Alpha.

## Viewports obrigatórios

| Viewport | Papel |
|---|---|
| 390×844 | Portrait mobile — player precisa ler imediato |
| 844×390 | Landscape mobile ≈ desktop compacto |
| 1920×1080 | Desktop |

Board de arte (sem login): `/dev/world-art`.

## Orçamentos visuais (não gameplay)

| Preset | Particles | Creature FPS | Avatar LOD | Draw intent |
|---|---|---|---|---|
| WORLD_MOBILE_LOW | 8 | 8 | far | Plaza + 1 companion + 0 wild anim full |
| WORLD_MOBILE_MEDIUM | 18 | 12 | medium | Padrão celular |
| WORLD_HIGH | 36 | 20 | near | Desktop |

## Cenário de teste (pós-integração)

1 player + 1 companion + 7 NPC + 3 wild + props Haven + motes + UI.

Alvos:

- Portrait: ≥ 30 FPS estável no canvas 2D (bake de avatar é one-shot).
- Desktop: ≥ 50 FPS.
- Draw: um canvas, sprites blit — não Three.js no mapa após bake.
- Texture memory: atlas em RAM por criatura (near 160² × 8 dirs × ~10 frames). Não persistir centenas de PNG.

## Métricas já expostas pelo Engineer

`AdventureHudState.metrics`: `fps`, `sprites`, `avatar`.

Depois do swap, `avatar` deve ser `sprite-atlas` quando o 3D bakeia, ou fallback com manifest `WORLD_AVATAR_PENDING`.

## O que não medir como “arte ruim”

Fog/bloom não entram neste kit de propósito. Geometria/silhueta primeiro.

## Screenshots

BEFORE = captura atual do Alpha (diorama/protótipo).  
AFTER = `/dev/world-art` + `/game/adventure` após o Integration aplicar o contrato.

Arquivos de captura manuais podem viver em `docs/world/shots/` quando o Integration rodar o browser. Esta pasta Art não fez deploy e não gravou PNGs autenticados do mundo live.
