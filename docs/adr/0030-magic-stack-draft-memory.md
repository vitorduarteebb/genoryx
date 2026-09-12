# ADR 0030 — Guerra Mágica e memória tática de draft

- Status: aceito
- Data: 2026-09-05

## Contexto

A Matrix V2 já tem formação F/M/B, usage history e fusão no round 5. Faltava a regra explícita de (1) pesos de compra por tipologia jogada em T / T-1 e (2) pilha LIFO com sobretaxa de fadiga. Sem isso, reação e blefe de mana não têm motor.

## Decisão

1. Formalizar o contrato da carta (`range`, `momentumAltCost`, `interventionTrigger`, `draftWeightBase`) em schema + campos opcionais de `CardDefinition`.
2. Extrair dois módulos puros em `@nexora/game-engine`: `draft-weights` e `magic-stack`, mais `fusion-formula` para \(P_F\) e \(C_F\).
3. **Não ligar ainda ao `reduceBattle`.** PLAY_CARD continua resolvendo na hora. A próxima fatia injeta a pilha atrás de flag, sem reescrever V1 casual.
4. Momentum nunca paga lance de abertura. \(V_{Gen}\) é habilidade da criatura, não dado de chain.
5. Marca: GENORYX. Nada de NEXYROM no código, docs ou UI.

## Consequências

- Spec: `docs/COMBAT_ENGINE.md`.
- Testes em `combat-engine.test.ts` (pesos, fadiga, LIFO, log do turno 5).
- `drawPerRound: 2` permanece no reduce até a presença (1/criatura viva, máx. 3) ser ligada.
