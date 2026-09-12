# GENORYX Battle Renderer (Unity POC)

Unity é **somente** presentation layer. O Battle Engine permanece em `@nexora/game-engine`.

Não calcule: dano, crítico, status chance, draw, discard, energy, capture, vitória, RNG.

## Contrato

JS → Unity: `BattleBridge.LoadBattleState(json)` com `BattlePresentationState`.

Unity → JS: `Application.ExternalCall` / `SendMessage` para `window.genoryxBattleIntent(json)` com `{ type, cardInstanceId?, targetId? }`.

Cartas **não** entram na cena Unity. A mão continua HTML/React.

## Cena `GENORYX_BATTLE_ARENA`

Primeira arena: **Verdantis** — chão, vegetação suave, luz inclinada, partículas leves. Sem cenário enorme.

Formação canônica V2 (nunca empilhar no centro):

```
                 [ BACK ]
                [ MIDDLE ]
                 [ FRONT ]
        -------- BATTLE CORE --------
                 [ FRONT ]
                [ MIDDLE ]
                 [ BACK ]
```

Replay V1 ainda pode enviar BACK_LEFT / BACK_RIGHT. Unity só apresenta.

Eventos de apresentação: `FORMATION`, `VALID TARGETS`, `FUSION_AVAILABLE`, `FUSION_PLAYED`, `CONVERGENCE_AVAILABLE`, `CONVERGENCE_PLAYED`, `FORMATION_COLLAPSED`, `MIDDLE_WINDOW_CHANGED`.

Câmera 3D inclinada (tática + monster battle). Estados: `BATTLE_OVERVIEW`, `PLAYER_SELECT_CARD`, `TARGET_SELECT`, `ACTION_FOCUS`, `ULTIMATE_FOCUS`, `KO_FOCUS`, `VICTORY`.

Presença: `PresenceController` (breathing / sway) se o GLB não tiver rig. Temperament e lifeStage só mudam o idle. Capability: STATIC | ROOT_ANIMATED | RIGGED | FULL_ANIMATED.

JS → Unity também: `ApplyBattleEvent`, `SetValidTargets`, `SetSelectedCard`.

## Web build

Exportar WebGL para `apps/web/public/unity-battle/`. A rota `/dev/unity-battle` carrega o build se `createUnityInstance` existir. Não substitui `/game`.

Cliente oficial World+Battle: `apps/unity-game/` e `/game-unity` (ADR 0025).
