# ADR 0002 — Servidor authoritative

- Status: aceito
- Data: 2026-09-01

## Contexto

O jogo tem economia, captura, breeding e PvP. Qualquer cálculo dessas regras no cliente é explorável.

## Decisão

Cliente envia intenção. Servidor valida, aplica `packages/game-engine` e persiste. Frontend pode prever para UX; previsão não grava Gold, XP, loot, dano, captura, breed ou vitória.

## Consequências

- Phaser é apresentação.
- Endpoints que aceitam `amount` ou `damage` do client são bugs.
- Colyseus também é servidor: o socket não “confirma” vitória do cliente.
