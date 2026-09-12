# ADR 0006 — Regras puras em packages/game-engine

- Status: aceito
- Data: 2026-09-01

## Contexto

Combate, captura e breeding precisam de testes sem I/O e de replay com seed.

## Decisão

`@nexora/game-engine` contém funções puras + `RandomService`. Não importa Nest, Prisma, Redis, React ou Phaser.

Na M0 só existem RNG seedável e multiplicador elemental. `calculateDamage` / **battle reduce de cartas** (ADR 0009), `calculateCaptureChance` e `calculateBreeding` entram nas milestones respectivas.

## Consequências

- API e game-server dependem da engine, nunca o contrário.
- `Math.random` é proibido em regras importantes.
