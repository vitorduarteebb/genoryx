# ADR 0039 — Combat V2.3 (Timing Engine + Mana do Embate)

- Status: aceito
- Data: 2026-09-12

## Contexto

O Combat V1.5 entregou fila, chain, resonance de time e reaction slot. A Guerra Mágica ainda era só uma pilha LIFO + surcharge. Sem linguagem de tempo, toda carta virava “clicar → alvo → dano” ou “counter em cima de counter”.

## Decisão

1. **Duas economias.** Energy paga Planning / Action Queue. Mana (do time, cap 10, começa em 2, persiste entre rounds) paga Embate, Ímpeto, reação e intervenção. Energy restante no `CONFIRM_TURN` vira Mana (Reserva Arcana). Recurso pessoal e Team Resonance continuam camadas distintas.
2. **Toda manifestação tem `ResolutionProfile`.** `timingClass` ACTION | IMPETUS | REACTION | COUNTER | PREPARATION | CHANNEL | RITUAL | PASSIVE. Kits selados não são rerrolados: o perfil é hidratado no resolver.
3. **Janelas formais.** DECLARE, PRE_IMPACT, POST_IMPACT, STATUS, LETHAL, FUSION. O servidor calcula `eligibleResponses`. Se 0, não pausa.
4. **Intervenções parciais.** CANCEL, MITIGATE, REDIRECT, SUPPRESS, AMPLIFY, TRANSFORM, ECHO, DELAY, SEAL, INTERCEPT, DODGE, LAST_STAND. Counter não anula tudo por padrão. `COUNTER_ANY` é caro.
5. **Fusion V2 e Genetic Power** entram no mesmo resolver como manifestações virtuais. Catálogo de 105 receitas de par (C(15,2)) + triples. Se `INTERRUPTIBLE` e houver resposta, abre FUSION WINDOW.
6. Um único `reduceBattle`. Casual/PvE continuam rápidos (auto-pass). Ranked é onde o Embate deve brilhar.

## Consequências

- `BattleSide.mana` vive em `stateJson`. Sem migration Prisma.
- Criaturas persistidas não são regeneradas.
- Carta rápida (Ímpeto) paga flexibilidade no Timing Power Budget das gerações novas.
- PLAY_CARD imediato permanece para testes/IA.
