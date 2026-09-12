# Evolução de criatura (Alpha)

A criatura é o **mesmo indivíduo**. Evoluir não altera Creature ID, NFT futuro, pais, geração, `geneticHash`, GeneticPower, 10 loci, body/head/eyes/horns/tail, mutação.

ADR: `0025`. Números em `creatureLifeStageConfig` + `xpConfig` + `maturationConfig`.

## Dois eixos

| Eixo | Campo | Significa |
| --- | --- | --- |
| Combate | `xp`, `level` | Progressão de luta |
| Maturação | `maturationXp` | Crescimento biológico/genético no World |

BABY **não** amadurece parado. Precisa participar de PvE no World.

## Limiares Alpha (config)

| Transição | Level | Maturation XP acumulado |
| --- | --- | --- |
| BABY → YOUNG | ≥ 10 | ≥ 100 |
| YOUNG → ADULT | ≥ 20 | ≥ 350 |

## Como ganha Maturation XP

Só party ativa, numa Battle PvE. Idempotente: `battleId + creatureId`.

Famílias de encontro (não é rarity NFT):

| Família | XP base |
| --- | --- |
| COMMON | 2 |
| UNCOMMON | 4 |
| ELITE | 10 |
| BOSS | 25 |

Participation (0.25–1.0): cartas jogadas, dano, cura, shield, status/control, rounds vivo. KO não zera se participou. Derrota: fração config (`lossShare`, Alpha 25%).

Diversidade: repetir a mesma species no dia reduz o ganho (100% / 70% / 40%), nunca zera. Primeira vitória da species no biome: bônus.

NEX e GOLD **não** vendem Growth XP.

## Fluxo

1. Servidor aplica Combat XP e Maturation XP depois da Battle.
2. Se level **e** maturation cruzam o limiar: `evolutionStatus = READY_TO_EVOLVE`, `readyToEvolveAt` preenchido. `lifeStage` **não** muda no meio da luta.
3. Feedback: `+N MATURATION`. Ao cruzar: GENETIC MATURATION COMPLETE.
4. Jogador volta a Haven → **Genesis Chamber** → confirma `POST /creatures/:id/evolve`.
5. Servidor muda só `lifeStage` e enfileira visual do novo stage com a fase anterior como referência. Gameplay não espera OpenAI. 3D Meshy continua on-demand.

## Cartas por estágio

`gateCardsByStage` (default `false` no Alpha): BABY G1–G6, YOUNG G1–G8, ADULT G1–G10. Ligar depois de existir população YOUNG/ADULT.

## NFT / Market

Mesmo tokenId. Market pode mostrar `BABY 42%` / `YOUNG 71%` / `ADULT Mature`. Maturation vai junto na venda.
