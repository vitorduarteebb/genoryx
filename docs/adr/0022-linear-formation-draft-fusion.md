# ADR 0022 — Linear Formation, Draft and Genetic Fusion Combat

- Status: aceito
- Data: 2026-09-03

## Contexto

O combate competitivo precisava de draft, formação com profundidade real, targeting, recycle e fusão alimentada pelo que foi jogado — não só pela party. A formação clássica FRONT / BACK_LEFT / BACK_RIGHT não expressa frente/meio/trás.

## Decisão

1. **BattleRulesVersion.** Batalhas antigas = `V1`. Novas com flags = `V2`. Replay usa a versão gravada.
2. **Draft 5 → ban 1 → pick 3.** Uma fica no banco e **não** entra na partida. Sem swap V1.
3. **Formação canônica V2:** FRONT / MIDDLE / BACK. Substitui BACK_LEFT / BACK_RIGHT neste modo. MIDDLE alvo em rounds pares. BACK protegido salvo TargetRule BACKLINE/PIERCE/AOE.
4. **Colapso:** só quando FRONT morre. MIDDLE → FRONT, BACK → MIDDLE. MIDDLE KO não promove BACK.
5. **Fusion ≠ party.** Typologies vivas + usage history + resonance + round. Pool separado da mão. UI: SINERGIA DESPERTADA. Triple na UI = **CONVERGENCE**.
6. **Servidor authoritative.** `validTargets` sai do engine. Unity/web só apresentam. RNG só via `RandomService`.
7. Flags: `COMBAT_DRAFT_V2`, `FORMATION_LINEAR_V2`, `FUSION_V2`, `CONVERGENCE_V1`. Default `false`. Sem deploy até prova local.

## Consequências

- `Combatant.slot` aceita slots clássicos e lineares para replay V1.
- Prisma `battles.rules_version` default `V1`.
- Prova: `/dev/combat-matrix` e `GET /combat-matrix/proof`.
