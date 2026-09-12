# ADR 0024 — Economy Foundation V2 (GOLD)

- Status: aceito
- Data: 2026-09-03

## Contexto

O Alpha mintava GOLD no starter, PvE sem faixa/tier/budget e breeding a custo 0. Taxas de market sumiam sem sink auditável. Precisávamos provar a economia de GOLD em três camadas sem tokenizar moeda nem ligar chain.

## Decisão

1. Camadas: GOLD (gameplay, server-only), NEX (wallet 0, inativa), ASSETS (no banco).
2. Números só em `packages/config/src/economy.ts` com profiles `alpha` e `production`.
3. Tutorial `first-spark` é o primeiro mint: 300 GOLD + 5 NexOrb + 1 Genome Catalyst, via ledger.
4. PvE wild 12–25 com `dailyGoldRewardBudget` 800; PvP casual = 0 Gold.
5. Breeding = GOLD da fórmula + 1 Catalyst + 1 fertility × 2, atômico.
6. Market: listing 1% (mín. 5) e sale 5% creditam a wallet `system@genoryx.internal` (`SYSTEM_SINK`).
7. Shop Alpha: só NexOrbs (40 / 120 / 350 / 1000). Sem genes.
8. Sem ERC-20, sem emissão de NEX, sem compra direta de Gold nesta fatia.

## Consequências

- Starter deixa de creditar GOLD.
- Control Center ganha dashboard interno 24h / 7d / 30d e `EconomyDailySnapshot`.
- Prova e2e: tutorial → PvE → shop → breed → listing → compra, ledger exato.
