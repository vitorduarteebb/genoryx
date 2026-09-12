# ADR 0020 — Battle Experience V3: visual canônico, wild master e Unity opcional

- Status: aceito
- Data: 2026-09-02

## Contexto

A batalha Alpha conhecia `species`, nome e HP, mas a identidade visual se perdia no DTO. Wild encounters não têm `creatureId`. O presenter só resolvia retrato quando existia instance. O cliente caía em compositor/CSS e pintava **quadrados de cor**. Formação FRONT / BACK_LEFT / BACK_RIGHT existia no estado, mas o layout empilhava tokens. Unity foi pedido como renderer 3D sem migrar o jogo nem o Battle Engine.

## Decisão

1. Um resolver único `resolveBattleCreatureVisual()` em `@nexora/config`. Prioridade: 3D READY → retrato da instance READY → **Species Battle Visual** (master da espécie) → silhueta Genesis. Nunca quadrado de cor em Alpha/Production.
2. Wild **não** gera OpenAI/Meshy por spawn. Usa `SpeciesBattleVisual` / master existente (ex.: Florune `84ae443c-…`). Captura cria a Creature individual depois.
3. `BattlesService.viewFor` resolve **todo** combatente por `creatureId` ou `species:{key}` e anexa `visual` no DTO.
4. Diagnóstico: `GET /battle-visuals/species` e `GET /battle-visuals/report`.
5. Arena React: grid 3×3 (inimigo back/front, core, jogador front/back), cartas `GeneticCard` 170–220px, energia grande, Capturar contextual, Fugir secundário, histórico recolhível.
6. Evolução permanece ADR 0019: BABY 1–9 / YOUNG 10–19 / ADULT 20+. Sem reroll de DNA. `gateCardsByStage` off. Meshy on-demand.
7. Unity é **POC de apresentação**. Contrato: `LoadBattleState` / `ApplyBattleEvent` / `SetValidTargets` / `SetSelectedCard` → JS bridge → React → API. Flag `BATTLE_RENDERER=web|unity`. Renderer atual permanece fallback. Rota `/dev/unity-battle`. Sem migrar o game.

## Consequências

- Silhueta elegante substitui o placeholder de cor quando o asset falta.
- Espécies sem master OPENAI ainda aparecem como silhueta até existir um READY daquela espécie.
- Unity WebGL oficial só após medir bundle, first/warm load, FPS e RAM.
