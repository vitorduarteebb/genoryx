# ADR 0037 — Deck de 30 cartas + targeting por formação

- Status: aceito
- Data: 2026-09-11

## Contexto

O deck de batalha cortava as manifestações em `competitiveDeckSize = 16` e completava com cartas genéricas. Três criaturas (30 cartas G1–G10) perdiam dono e kit. O targeting V1 devolvia qualquer inimigo vivo; o V2 abria o MIDDLE em rounds pares. A formação não protegia ninguém.

## Decisão

1. O deck é a união das manifestações persistidas: 10 por criatura viva. Sem fallback, sem sinergia no baralho de 30, sem `slice(0, 16)`.
2. Embaralhamento e recycle usam `RandomService` + `matchSeed`. Mão inicial garante 1 carta de cada criatura viva; o resto segue o shuffle.
3. Carta morta: mão recusada, draw pile não compra, discard não volta no reshuffle (vai para exile). Dados da partida não são apagados.
4. Linha tática `FRONT → MID → BACKLINE` mapeia slots clássicos (`BACK_LEFT` = MID, `BACK_RIGHT` = BACKLINE) e lineares (`MIDDLE`/`BACK`).
5. Ataque normal só acerta a linha exposta. Exceções vêm das tags da carta: `MOBILITY`/`PIERCE` (MID), `EXECUTE`/`ASSASSIN` (BACKLINE), `AOE` (todos). Servidor rejeita `INVALID_TARGET · FRONTLINE_BLOCKING`.
6. Taunt filtra alvos já legais. Guard redireciona dano posterior se o FRONT tiver o estado. Stealth está no resolver, sem cartas inventadas.
7. `MOBILITY` avança o dono para FRONT. `PULL` troca FRONT e MID inimigos.
8. Log: `NOME usa CARTA`. Recurso usa o nome do jogador (Calor), não o id técnico.

## Consequências

- Formação passa a ter valor. Assassin/AoE/Control são exceções genéticas, não o padrão.
- Testes de deck 16 e “MIDDLE em round par” foram atualizados.
- Kits G1–G10 e Combat Identity não são regenerados.
