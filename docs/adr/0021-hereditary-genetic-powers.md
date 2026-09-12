# ADR 0021 — Hereditary Genetic Powers and Typology Fusion

- Status: aceito
- Data: 2026-09-02

## Contexto

Os 10 Genetic Card Loci (ADR 0011) descrevem alelos, mas não uma identidade mecânica de linhagem. Breeding recombina cartas sem um núcleo herdável. Sinergia de composição (Fornalha Viva) existia só como TODO.

## Decisão

1. Toda Creature tem **1 GeneticPower** + **10 manifestações** (G1–G10 reinterpretados). O poder não é carta nem NFT separado.
2. `powerId` identifica a definição mecânica (`powerHash`). `powerLineageId` rastreia o sangue. Herdar mantém lineage; NEW_POWER cria os dois.
3. Breeding: `nextInt(0,2)` → pai / mãe / novo. Sem float 33.33. `RandomService` obrigatório.
4. Cartas derivadas são `EffectDefinitions` estruturadas. Texto é apresentação. OpenAI não gera poder nem balanceia combate.
5. Fusão data-driven: 5 doubles V1 + 1 triple `PHOENIX_CYCLE`. C(15,2)/C(15,3) só como identidade, sem 105 classes. Unlock round 5 / triple 7. Pool separado da mão.
6. Flag `GENETIC_POWER_V1`. Alpha atual continua com o catálogo G1–G10. Backfill determinístico a partir de espécie + element + loci + geneticHash, sem reroll de DNA.
7. Unity só apresenta `FUSION_AVAILABLE` / `FUSION_PLAYED`. Engine decide.

## Consequências

- Schema: `genetic_powers`, `genetic_power_lineages`, `creature_powers`, `fusion_discoveries`.
- BattleState ganha `fusion` opcional. Sem a flag, o reduce não acorda fusão.
- Prova: `/dev/genetic-powers` e `GET /genetic-powers/proof`.
