# Diagnóstico — por que a batalha mostrava quadrados

## Onde a identidade visual se perdia

O Battle Engine já enviava `speciesKey`, `name` e HP. O ponto de perda era a **apresentação**, não o CSS.

1. `BattlesService.viewFor` / `presentBattle` só anexavam retrato quando `unit.creatureId` existia.
2. Encontro selvagem **não tem** Creature instance / NFT antes da captura. `creatureId` é `undefined`.
3. O frontend (`BattleCreature`) caía no compositor/`CreaturePortrait` sem `bodyPlan` → caixa vazia → retângulo da cor do elemento.

Corrigir com CSS (quadrado verde/azul/marrom) seria esconder o bug.

## Resolver canônico

`resolveBattleCreatureVisual()`:

| Prioridade | Fonte | `renderMode` |
| --- | --- | --- |
| 1 | `Creature3DAsset` READY do estágio atual | `MODEL_3D` |
| 2 | Retrato OPENAI/READY da instance | `PORTRAIT` |
| 3 | Master da espécie (wild ou fallback) | `SPECIES_MASTER` |
| 4 | Sem asset | `SILHOUETTE` (`forming` se job PENDING) |

## Wild

Não gastar OpenAI/Meshy por spawn. `speciesBattleVisuals` aponta o master (Florune canônico). Outras espécies reutilizam o primeiro `CreatureVisualAsset` OPENAI READY daquela `species.key`.

## Relatório vivo

Após deploy:

- `GET /battle-visuals/report` — totais de criaturas (OpenAI / mock / 3D / sem visual) e espécies com/sem wild visual.
- `GET /battle-visuals/species` — catálogo usado por `/dev/unity-battle`.
- UI do relatório também em `/dev/unity-battle`.

## O que isto **não** é

Unity não calcula dano. O Battle Engine não conhece partículas. `BATTLE_RENDERER=unity` não substitui `/game/battle` até aprovação de performance.
