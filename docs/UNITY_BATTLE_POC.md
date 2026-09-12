# Unity Battle Renderer — POC

Não substitui `/game`. Rota: `/dev/unity-battle`.

## Divisão

| Camada | Responsável |
| --- | --- |
| Unity / host 3D | arena, criaturas, câmera, VFX |
| React | mão (`GeneticCard`), energia, captura, tooltips |
| Servidor | Battle Engine, RNG, dano, vitória |

## Contrato

`BattlePresentationState` em `@nexora/game-engine`. JS: `SendMessage("BattleBridge", "LoadBattleState", json)`. Unity devolve intenção em `window.genoryxBattleIntent`.

Scaffold C#: `apps/unity-battle-poc/BattleBridge.cs`. WebGL exportado vai em `apps/web/public/unity-battle/`.

## Comparação (preencher após build real)

| Critério | Three.js atual | Unity Web |
| --- | --- | --- |
| Visual / animação | PresenceController + CSS | TBD |
| Workflow de clips | ROOT_ONLY | TBD |
| Bundle / load | já no Next | TBD |
| Mobile FPS / memória | TBD | TBD |
| Integração | nativa | bridge JSON |

Não adotar Unity em produção antes dessa tabela.
