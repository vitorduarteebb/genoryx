# ADR 0019 — Apresentação de batalha V2 e evolução por idade

- Status: aceito
- Data: 2026-09-02

## Contexto

CardArt READY existia, mas a batalha mostrava cartas sem ilustração. A UI era um painel de texto. `lifeStage` existia sem regra de XP. Uma POC Unity foi pedida sem migrar autoridade.

## Decisão

1. A batalha usa o mesmo `resolveCanonicalCardArt(cardDefinitionId, variant)` da ficha: OPENAI READY → fallback READY → placeholder. URL `?v={imageHash}`.
2. Formação canônica `FRONT` / `BACK_LEFT` / `BACK_RIGHT` no `Combatant.slot`. O reduce não muda fórmulas; só apresenta e loga eventos (`CARD_PLAYED`, `DAMAGE`, `CREATURE_KO`, …).
3. Cliente envia intenção (`PLAY_CARD` + `cardInstanceId` + `targetId`). Servidor resolve.
4. Evolução: config `creatureLifeStageConfig`. XP de vitória PvE calcula level. Cruzar 10 ou 20 marca `READY_TO_EVOLVE`. Jogador confirma. Mesmo Creature ID / DNA / loci. Visual via `evolveCreatureVisual`. Meshy não bloqueia.
5. `gateCardsByStage` desligado no Alpha (BABY atuais manteriam G1–G10).
6. Unity Web é rota experimental `/dev/unity-battle`. Cartas ficam no React. Unity não calcula dano/RNG/vitória.

## Consequências

- Batalhas persistidas sem `slot` recebem slot por índice na apresentação.
- Unity oficial só após comparar bundle, FPS e mobile com o renderer atual.
