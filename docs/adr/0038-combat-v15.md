# ADR 0038 — Combat V1.5 (Casual + Ranked no mesmo engine)

- Status: aceito
- Data: 2026-09-12

## Contexto

O Combat V1 já tinha formação 3, deck 30, `sourceCreatureId`, targeting authoritative, Personal Resources e Combat Identity. Faltava a camada tática: fila de ações, chain genética, resonance de time, reaction slot, status formal, pressure anti-stall e a distinção Casual/Ranked **sem** duplicar o motor.

## Decisão

1. Um único Battle Engine. Casual e Ranked recebem `MatchRules` (timer, hints, draft, MMR, pressure). Proibido `CasualBattleEngine` / `if (casual)` no reduce.
2. Pipeline oficial: validar → reservar/pagar → posição → efeito → status → reações → recursos → reaction window → morte → collapse → chain → resonance → vitória → log.
3. Action Queue reserva energia. Invalidação por ação anterior devolve carta e libera reserva. `retargetPolicy` explícito; default `NONE`.
4. Genetic Chain só existe com conexão `produces/reactsTo/consumes` entre criaturas **diferentes**. Recompensa = Team Resonance 0/3, não buff genérico de dano.
5. Reaction Slot: 1 carta, custo pago ao armar, resolve ou expira sem reembolso. Profundidade máxima 3.
6. Status registry + Resolve anti-CC + Battle Pressure (cura/escudo) em config.
7. Ranked: squad 5, ban simultâneo, pick 3, timer 45s + bank 120s (fila válida → AUTO CONFIRM, senão PASS). Replay/reconnect = snapshot + `matchSeed` + ações.
8. Casual Lab (`matchModifier[]`) existe na arquitetura e permanece desligado.

Fusion/resonance de tipologia (V2) continua como camada antiga, distinta de Team Resonance.

## Consequências

- Kits, identities e criaturas persistidas não são regenerados.
- Migrations novas não foram necessárias: estado cabe em `Battle.stateJson`.
- Testes V1/V2 de PLAY_CARD imediato permanecem; a fila é caminho adicional pelo mesmo pipeline.
