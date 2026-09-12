# ADR 0034 — Kit G1–G10 derivado do DNA

- Status: aceito
- Data: 2026-09-11

## Contexto

ADR 0011 fixou 10 loci por criatura. No Alpha o catálogo era fino: Sparkyn/Voltaris só tinham `spark_jolt`. `cardsForLocus` caía no catálogo inteiro da espécie, `generatePowerCards` pegava a primeira carta do papel e a UI chamava `presentCard(catalogKey)`. Resultado: 10× “Faísca Elétrica”, custo = rank.

## Decisão

1. O kit é uma **expressão** dos loci existentes (`CreatureLocus.expressedJson`). Sem genoma paralelo, sem migration.
2. Algoritmo versionado `CARD_GEN_VERSION = gxr-kit-v1`. Kit já selado com essa versão **não** é regenerado em silêncio. v2 exige versão nova e backfill explícito.
3. Seed = `creatureId + geneticHash + CARD_GEN_VERSION` via `RandomService`. Nascimento em memória usa `genesis:{hash}` / `bred:{hash}` até persistir; legado no banco sela com o `id` real na primeira leitura.
4. Papéis G1–G10, energia 1–4, G9 SIGNATURE, G10 SUPREME. Sorte só escolhe dentro do pool genético (espécie, elemento, chassi, genes, mutação, pais). Híbrido elemental exige mutação, secundário ou pai compatível.
5. Combate lê `CardInstance.resolved` (ficha do kit). Catálogo só ancora `cardFamily` para arte/tipagem.
6. Cliente não gera o kit. `GET /creatures/:id` e party/batalha chamam `ensureCreatureCardKit`. Debug owner: `GET /creatures/:id/card-kit`.
7. Sem arte nova nesta fatia.

## Consequências

- `alignCreatureLoci` não sobrescreve manifesto v1 com `expressionFromCard`.
- Aba Cards e a mão de batalha mostram nome/texto/custo do kit.
- ROADMAP: kit G1–G10 derivado do DNA.
