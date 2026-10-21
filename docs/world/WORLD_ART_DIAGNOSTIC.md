# Diagnóstico visual — World Adventure (antes da Art V2)

Data: 2026-09-12  
Fonte: Alpha publicado + working tree do World Engineer (`apps/web/src/lib/iso/*`, Unity `HavenSliceBuilder` v9).  
Este arquivo é o **BEFORE**. Não é direção visual final.

## O que o jogador vê hoje

O loop jogável do Alpha é `/game/adventure` (canvas 2D isométrico). Unity HavenSlice continua diorama local.

### Problemas confirmados

| Sintoma | Causa |
|---|---|
| Praça vazia, objetos espalhados | Tiles de grama + poucos props; densidade ambiental baixa |
| Core = coluna ciano / cristal cubo | `HavenSliceBuilder.GenesisCore` usa cilindros empilhados (~13 m). Web `kit.ts` `core` ainda é pedestal + polígono |
| Casas = caixas com telhado vermelho | Um `isoBox` de parede + um de telhado. Sem beiral, trim, chaminé consistente |
| Árvores = tronco + bola | `treeL/M/S` = cilindro + ellipses |
| Player pequeno em 390×844 | Tamer 72×110; zoom mobile 1.22 |
| Companion quase invisível | Bake 128px sem âncora de pés explícita; offset atrás do player |
| HUD de dashboard | `GameShell` + caixas `gx-adv__region` / dock retangular |
| Minimap verde + pixel | `drawMinimap` preenche fundo escuro e um stroke de caminho |
| Gating visual fraco Haven → Verdantis | Paleta muda pouco; árvores reutilizam o mesmo sprite |

## O que NÃO deve ser copiado

- Low poly genérico / primitivas coloridas como identidade
- Pixel art, chibi, realismo fotográfico
- Clone de Habbo / Tibia / Pokémon / mapa de campanha mobile

## O que o World Engineer já acertou (não mexer)

- Áreas compactas, tap-to-move, Haven → Green Road → wild → battle → return
- `bakeWorldAvatar` a partir de `CreatureVisualController` (3D real)
- Interacts, blocks, discoveries, minimap marks
- ADR 0040

## Quality bar atual vs alvo

| Critério | Antes | Alvo Art V2 |
|---|---|---|
| Genesis Core ainda primitive? | Sim | Landmark facetado 4,2 m, não torre |
| Casas parecem caixas? | Sim | Base pedra + madeira + roof trim + chaminé |
| Árvores parecem esferas? | Sim | Tronco + 3–4 lóbulos + inclinação |
| Player/companion ilegíveis? | Sim no portrait | Tamer 96×148; avatar LOD + blob shadow |
| Mundo vazio? | Sim | 60–70% composição ambiental |
| UI dashboard? | Sim | HUD compacto / dock flutuante |
| Mobile ilegível? | Risco alto | Framing + minimap collapsed |

## Decisão de pipeline

Web-first (canvas iso) é a prova do Alpha. Unity recebe os **mesmos prefabs visuais** em `Scripts/WorldArt/`, sem segundo estilo.
