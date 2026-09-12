# Unity Game Client — GENORYX: Genesis

ADR: `0025` + `0026`. Experiência do chão: `docs/VISUAL_DESIGN.md`. POC de batalha: `docs/UNITY_BATTLE_POC.md` (não substitui isto).

## Papel

Unity = **GAME CLIENT / RENDERER**.

```
UNITY → intenção → Colyseus/API → servidor valida → estado → Unity apresenta
```

Proibido no Unity: damage, RNG, loot, XP, capture, breeding, evolution, currency, ownership.

## Flags

| Variável | Default | Efeito |
| --- | --- | --- |
| `WORLD_RENDERER` / `NEXT_PUBLIC_WORLD_RENDERER` | `web` | `unity` abre `/game-unity` como world host |
| `BATTLE_RENDERER` / `NEXT_PUBLIC_BATTLE_RENDERER` | `web` | `unity` usa a arena 3D; React continua com a mão |

## Projeto

`apps/unity-game/`

- **HavenSlice** (fundação visual): praça + Genesis Core + rua + portão + borda Verdantis. Menu `GENORYX / Bootstrap Visual Slice`.
- Câmera 48° / yaw 40° / FOV 36 / distância ~20 m. Escala oficial em `WorldScale` (humano 1,8 m, casa 5,6 m, Core 16 m).
- Companion no chão. NPCs com papéis. HUD de jogo.
- Personagens: `docs/CHARACTER_ART.md` + `CharacterKit` (tamer, guarda, comerciante, pesquisador, breeder, aventureiro) e `CreatureKit` (Pyron Baby). Walk/idle procedural.
- Phaser `/game` = **DEV_WORLD** (protótipo técnico). Não é a arte do jogo.
- Battle: CreatureActor, BattleCameraDirector, formação FRONT/MIDDLE/BACK
- Bridge: `WorldBridge` / `BattleBridge` → `window.genoryxWorldIntent` / `window.genoryxBattleIntent`

React overlay: hand, cards (mesmo CardArt da ficha), energy, Fusion/Convergence, menus.

## Loading

Template WebGL GENORYX em `Assets/WebGLTemplates/Genoryx`. Sem splash padrão Unity.

## Limitações Alpha

Sem Editor no CI: não há bundle WebGL oficial, FPS medido nem screenshots de GPU nesta entrega. Scripts, cenas stub e contratos estão no repo. Build local: Unity 6 / URP.
