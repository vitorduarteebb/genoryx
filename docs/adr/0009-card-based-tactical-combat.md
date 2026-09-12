# ADR 0009 — Combate tático baseado em cartas

- Status: aceito (documentação; **não implementado**)
- Data: 2026-09-01

## Contexto

A v1 documentada era combate por turnos com 3 criaturas e 1 ativa, skills fixas e SPD como initiative. O produto passa a ser um **CARD-BASED TACTICAL RPG**: cartas são a UI das habilidades RPG, não um TCG autônomo. Deck = build (personagem, 3 criaturas, genes, mutações, equipamento, relíquias, classe, formação).

Implementar isso na M2 atrasaria Haven. A M4 (ordem absoluta 08) é o motor; a M3 só precisa não gerar um kit de 4 skills rígido que impeça o pool de cartas.

## Decisão

1. **Não é TCG.** Cartas derivam dos assets. Cartas comuns **não** são NFT (ADR 0008).
2. **Party:** 1 Character + 3 Creatures. Formação FRONT / BACK_LEFT / BACK_RIGHT. Servidor é autoridade da posição.
3. **Pool ~20–30 → deck ~16** (números em `@nexora/config`, não no código de regra).
4. **Energy + Momentum.** Energy por round para jogar cartas; Momentum alimenta ultimates e skills de personagem/gene.
5. **Motor puro:** `BattleState + Action + Seed → NewBattleState` em `@nexora/game-engine`. Replay = seed + actions. Sem Phaser, Prisma ou WebSocket nos testes.
6. **Data-driven:** `CardDefinition`, `EffectResolver`, `StatusDefinition`, `SynergyDefinition`, `InteractionDefinition`. Sem classe TypeScript por carta.
7. **Genes, mutações, equipamento e relíquias alteram o pool e o comportamento das cartas**, não só números.
8. **Cliente envia intenção** (`PLAY_CARD`, `END_ROUND`, formação pré-batalha). Draw, dano, alvo válido, RNG e vitória são servidor.
9. **Sem implementação nesta decisão.** Sem migration. Sem Battle Engine. M2 inalterada (Haven/Phaser/Colyseus).
10. Colyseus/npm continua ADR **0010** (não este arquivo).

Especificação: `docs/COMBAT.md`.

## Consequências

- `combatConfig.teamSize` / `activeCreatures: 1` da M0 fica **obsoleto** na M4; até lá não refatorar o package só por isso.
- Breeding (M6) passa a ser deckbuilding: DNA muda cartas, custo, elemento e sinergia. Os 10 loci (ADR 0011) são o eixo dessa herança.
- PvE e PvP usam o mesmo engine. Modos Draft/Equalized são depois.
- Raridade NFT **não** decide vitória.
