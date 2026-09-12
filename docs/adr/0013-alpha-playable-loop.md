# ADR 0013 — Alpha Playable Loop V1

- Status: aceito
- Data: 2026-09-02

## Contexto

As milestones M3–M6+mercado+PvP estavam isoladas. O Alpha só tinha conta → personagem → andar. A direção pediu um loop jogável fino, ponta a ponta, sem atalho inseguro.

## Decisão

1. Comprimir criatura, cartas, combate, captura, inventário, GOLD, shop, breeding, ovos, marketplace e PvP casual numa entrega **fina**.
2. Regras continuam em `@nexora/game-engine`. Números em `@nexora/config` (`alphaConfig` para testes).
3. GOLD só via ledger. RNG só `RandomService`. Cliente manda intenção.
4. 10 loci × 2 alelos persistidos em `creature_loci`. `CreatureSkill` não define arquitetura.
5. Batalha HTTP + engine puro. PvP casual reusa o mesmo `reduceBattle`.
6. NFT, NEX, guildas, ranked e admin completo continuam fora.

## Consequências

- Testers jogam o loop sem esperar a ordem absoluta §99 completa em profundidade.
- Dívida: fila PvP usa `Character.title` temporariamente; reaction window não interrompe; incubação Alpha é curta.
