# Genetic Powers — GENORYX: Genesis

Cada Creature possui **Element + Typology + GeneticPower + 10 cartas derivadas**.

O poder é a identidade mecânica da linhagem. Não é carta. Não é NFT próprio.

## Herança

`RandomService.nextInt(0, 2)`:

| Roll | Resultado |
| --- | --- |
| 0 | Poder do pai (`INHERITED_FATHER`), mesmo `powerLineageId` |
| 1 | Poder da mãe (`INHERITED_MOTHER`), mesmo `powerLineageId` |
| 2 | `GeneticPowerGenerator` cria NEW_POWER |

Herdar não clona as 10 cartas. As manifestações dependem do filho (element, typology, genes, body, mutation).

## Geração

Tudo data-driven em `@nexora/game-engine` (`powers/`). Sem LLM. Mesmo seed + input = mesmo poder e mesmas 10 cartas.

`powerHash` cobre mecânica, não o nome. Similaridade ≥ 0.9 rerrola.

## Alpha

`GENETIC_POWER_V1=false` por padrão. Loci atuais permanecem. Backfill deriva poder da espécie (Pyron BURN, Florune HEAL, Terranox TANK) sem alterar DNA.

Prova: `/dev/genetic-powers`.

Combate competitivo V2 (ADR 0022): as 10 cartas individuais pertencem à Creature. Fusion/Convergence pertencem à **interação da party** e ao que foi jogado. O GeneticPower **não muda** no combate. Ver `docs/COMBAT_MATRIX.md`.
