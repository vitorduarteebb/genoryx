# ADR 0003 — PostgreSQL + Prisma

- Status: aceito
- Data: 2026-09-01

## Contexto

Precisamos de transações ACID (market, ledger, breeding), genealogia relacional e migrations revisáveis.

## Decisão

PostgreSQL 16 + Prisma no package `@nexora/database`. Schema muda só por migrate. Saldos em `BigInt`.

## Consequências

- Redis não substitui o banco para dinheiro ou posse.
- `db push` é proibido em produção.
- Engine de jogo não importa Prisma.
