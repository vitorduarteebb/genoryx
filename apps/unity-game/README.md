# GENORYX Unity Game Client

Renderer oficial V1 de **World** e **Battle**. O servidor (`@nexora/game-engine`, Nest, Colyseus) continua autoridade.

Não calcule no Unity: dano, RNG, loot, XP, captura, breed, evolução, moeda, posse.

## Abrir

Unity 6 (6000) + **URP**. Abra `apps/unity-game`.

Menu `GENORYX / Bootstrap Visual Slice` cria **HavenSlice** (fundação estética).  
Menu `GENORYX / Bootstrap DEV_WORLD Scenes` cria o protótipo técnico (não é a arte).

## Cenas

| Cena | Papel |
| --- | --- |
| `Haven` | Hub: Lab, Shop, Arena Gate, Quest, Genesis Chamber |
| `Verdantis` | Bioma denso, landmarks, mobs visíveis, companion |
| `BattleArena` | Formação F/M/B, CreatureActor, câmera, VFX hooks |

## Bridges

JS → Unity: `WorldBridge.ApplyWorldState`, `BattleBridge.LoadBattleState`.

Unity → JS: `window.genoryxWorldIntent` / `window.genoryxBattleIntent`.

Cartas, deck, Fusion/Convergence UI: React.

## WebGL

Template: `Assets/WebGLTemplates/Genoryx`.

Exportar para `apps/web/public/unity-game/`. Rota experimental: `/game-unity`.

Flags: `WORLD_RENDERER=unity`, `BATTLE_RENDERER=unity`. Default permanece `web`.

## Performance

LOD, texture compression, Addressables, pooling, GPU instancing. Desktop primeiro; WebGL depois.

## Limitações desta entrega

Sem Unity Editor no CI: sem bundle WebGL oficial, sem FPS/RAM medidos, sem screenshots de GPU. Scripts e bootstrap de cena estão no repo.
