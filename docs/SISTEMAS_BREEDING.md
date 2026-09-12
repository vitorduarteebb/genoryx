# Breeding — detalhe de implementação (Alpha)

Breeding é o núcleo do GENORYX: o mesmo ato recombina aparência, cartas, status, mutação e (se a flag estiver on) Genetic Power.

Cliente envia **somente** `parentAId` e `parentBId`. DNA, GOLD, fertilidade, incubação e o filho saem do servidor.

Código: `packages/game-engine/src/breeding/`, `packages/game-engine/src/genes/generate.ts` (`blueprintFromParents`), `apps/api/src/modules/breeding/breeding.service.ts`.

Visão complementar: [`BREEDING.md`](BREEDING.md) (algumas tabelas de incubação/custo lá estão **legado** — este arquivo é o que o Alpha executa).

---

## 1. Fluxo completo

```text
POST /breeding/preview     → CrossPotential (não revela o filho)
POST /breeding             → transação atômica → Egg INCUBATING
GET  /eggs                 → hatchesAt (relógio do servidor)
POST /eggs/:id/hatch       → Creature PENDING_VISUAL
POST /creatures/:id/reveal → READY_TO_REVEAL → REVEALED
```

UI: `/game/breeding` (Lyra), `/game/genesis`, `/game/genesis/[id]`.

---

## 2. Preview (`POST /breeding/preview`)

Não chama `calculateBreeding`. Não mostra genes, loci, mutação nem `geneticHash` do filho.

Devolve:

- `costGold` (servidor)
- `catalystRequired` / `catalystOwned`
- fertilidade atual e depois (−1)
- geração do ovo = `max(genA, genB) + 1`
- **CrossPotential** (faixas, não o DNA)

### CrossPotential (`calculateCrossPotential`)

Score 0–100, média ponderada:

| Categoria | Peso | O que sobe |
| --- | ---: | --- |
| Compatibility | 28% | mesma espécie, mesmo elemento, fertilidade alta |
| Genetic Diversity | 32% | espécies/elementos/body/head/typology **diferentes** |
| Lineage Distance | 20% | gap de geração; **penalidade** se parentesco próximo (mesmo avô) |
| Power Resonance | 20% | tipologia+elemento iguais = mais estável; os dois diferentes = UNSTABLE |
| Mutation Potential | — | sempre `UNKNOWN` no preview (não spoila) |

Bandas: LOW < 45 ≤ GOOD < 65 ≤ HIGH < 80 ≤ EXCELLENT. `UNSTABLE` só na resonance quando tipologia e elemento divergem.

Também lista `possibleElements` e `possibleTypologies` dos pais — conjunto, não o resultado.

**CrossPotential ≠ GenesisGrade.** Grade só existe depois do commit.

---

## 3. Validações no commit (`validatePair`)

Tudo recusado com rollback se falhar **dentro** da transação (re-lê lock e fertility):

1. Personagem existe e já escolheu starter
2. Nível ≥ `breedingUnlockLevel` (**1** no Alpha; `bypassBreedingQuest: true`)
3. IDs diferentes
4. Ambos do **mesmo** character (trade-breed não existe)
5. `parentA.gender === MALE`, `parentB.gender === FEMALE`
6. `lock === NONE` (não listado no market, não em combate)
7. `fertility > 0` nos dois
8. Se jobs de arte oficiais estão on: ambos já **revelados** (PENDING_VISUAL não cruza)

Não há checagem de espécie: Pyron × Nympha é válido (mestiço). Compatibilidade vira CrossPotential / GenesisGrade, não hard-block.

---

## 4. Custo (mesma transação)

```text
cost = floor( 250 × (100 + 40×usosA + 40×usosB) / 100 )
usos = max(0, 5 - fertility)     // priorBreedsFromFertility
```

| Cruzamentos já feitos (soma de usos) | GOLD |
| --- | ---: |
| 0 + 0 | 250 |
| 1 + 0 | 350 |
| 2 + 2 | 650 |
| 5 + 5 (impossível: fertility 0 rejeita antes) | — |

Na mesma transação Prisma:

1. Cria `BreedingSession` (status PENDING, `rngSeed`)
2. `debitWallet` GOLD, source `BREEDING_COST`, `referenceId` = session
3. Consome **1** `genome_catalyst`
4. `fertility -= 1` nos dois pais; `lock` permanece NONE
5. Session COMPLETED
6. Cria `Egg` INCUBATING com `hatchesAt`, `geneticSeed`, `geneticHash` do filho **já calculado**

Sem GOLD, sem catalyst ou fertility 0 → exception → rollback. Pais **não** ficam locked durante a incubação.

Ignore `breedingConfig.costsGoldByPriorBreeds` (`[2000, 5000, …]`): é tabela morta. A fórmula viva está em `economy.ts` + `breedingCostGold()`.

---

## 5. RNG e reprodutibilidade

`seed = seedFromParts([characterId, parentAId, parentBId, Date.now()])`.

O `Date.now()` entra no seed do **commit**, então o preview **não** pode coincidir com o filho — de propósito. Dentro do commit, o mesmo seed alimenta:

- `blueprintFromParents`
- `scoreGenesisComplexity`
- herança de Genetic Power (se ligada)
- `breedChassisDna` / `rollChassisDna`

`RandomService` seeded. Sem `Math.random`. Teste obrigatório: mesmo seed + mesmos blueprints = mesmo offspring.

---

## 6. Herança — o que o filho recebe

Função: `blueprintFromParents` em `genes/generate.ts`.

### Espécie

50% espécie do pai, 50% da mãe. Elemento primário = elemento **da espécie sorteada** (não média).

### Stats (cada gene HP, ATK, DEF, MAG, RES, SPD, CRIT, …)

1. Copia o rank de A ou de B (50/50)
2. Chance `rankDriftChance` **8%**: ±1 rank, clamp F..SS

Starter nasce com pool D–A. Selvagem F–A. Filho deriva dos pais, não rerola o pool selvagem.

### 10 loci de carta (independente dos stats)

Para **cada** G1–G10:

1. Escolhe o locus de A ou B como `source` (50/50); o outro é `other`
2. Chance `recessiveRevealChance` **20%**: o **recessive** do source vira expressed do filho
3. Senão: o expressed do source
4. Recessive do filho: 50% expressed do other, 50% recessive do other
5. `clampAlleleToSpecies`: se a carta não pertence à espécie do filho, tenta o outro alelo; se nenhum servir, sorteia do pool da espécie

Kit G1–G10 é **selado de novo** no filho (`assembleCreatureCardKit` com famílias dos pais como hint de herança híbrida 34%). Combate usa esse kit, não o catálogo fino.

### Corpo e cabeça

Body expressed/recessive e head expressed/recessive: cada um 50/50 entre os pais. Não força o body canônico da espécie filha — mestiço visual é possível.

### Chassi 3D

Se os dois pais têm `chassis`, `breedChassisDna` recombina alelos (d / r1 / r2) por peça. Senão, `rollChassisDna` fallback. Assinatura unique no banco — colisão recusada no persist.

### Gênero, geração, origem

- Gênero 50/50 MALE/FEMALE
- `generation = max(pais) + 1`
- `origin = BRED`
- `level = 1`, `lifeStage = BABY`, `fertility = 5` (o filhote começa cheio)
- Tags = união (espécie + pais)

### Pureza

```text
purity = max(40, round((purityA + purityB) / 2) - 4)
```

Starter vale 100; selvagem 92. Pureza **não** é poder. UI deve dizer isso.

### Mutação (Alpha)

Chance `alphaConfig.mutationChance` **8%**:

| Key | Elemento secundário |
| --- | --- |
| PLASMA | ELECTRIC |
| MAGMA | FIRE |
| ANCIENT | (não força secundário) |
| VOID | DARK |

Um locus aleatório ganha `mutationState` nessa key. Condições de evento (Eclipse, item, bioma) estão no GDD — **não ligadas** no Alpha.

Elemento secundário também pode vir de um pai que já tinha secundário, mesmo sem mutação nova.

---

## 7. GenesisGrade (depois do filho existir)

`scoreGenesisComplexity` — score 0–100, **ignora ATK/HP**. É complexidade da recombinação, não força.

Base **20**, soma pesos se a condição for verdadeira:

| Sinal | Peso | Quando |
| --- | ---: | --- |
| geneticNovelty | 10 | espécie mista **ou** filho difere em species/body/head |
| powerOriginNew | 20 | Genetic Power nova (não herdada) |
| mutationEvent | 15 | `mutationKey` no filho |
| lineageDistance | 10 | espécies diferentes **ou** gap de geração ≥ 1 |
| rareMorphology | 10 | body GOLEM, AVIAN, ABYSSAL, SERPENT_WYRM, FLOATING, INSECTOID_BIPED |
| typologyCombination | 10 | tipologias dos pais diferentes |
| elementCombination | 10 | elementos mistos, dual no filho, ou primário inédito |

| Score | Grade | Incubação Alpha | Incubação production (config) |
| ---: | --- | ---: | ---: |
| < 35 | COMMON | **0 min** | 30 min |
| ≥ 35 | REFINED | 0 | 1 h |
| ≥ 50 | RARE | 0 | 3 h |
| ≥ 70 | EXCEPTIONAL | 0 | 8 h |
| ≥ 85 | GENESIS | 0 | 18 h |

Profile: `INCUBATION_PROFILE=alpha` (default). `Egg.hatchesAt` é timestamp de servidor. Cliente só lê. NEX não zera incubação.

Raridade do ovo (item) deriva do grade: COMMON → COMMON, REFINED → UNCOMMON, RARE → RARE, EXCEPTIONAL → EPIC, GENESIS → LEGENDARY. Isso é label do ovo, não DPS.

---

## 8. Ovo, visual e hatch

No commit o servidor já conhece o ChildGenome. `deriveEggVisualGenome` gera pistas (cor, casca, grade) para `EggVisualAsset`. OpenAI **não** escolhe genes. Falha de imagem não desfaz o breed.

Cascos 3D (ADR 0033): incubar / rachar / eclodir na UI da Lyra e no Genesis Reveal. Animação lê `hatchesAt`.

Hatch (`POST /eggs/:id/hatch`):

- Recusa se `now < hatchesAt` (no Alpha hatchesAt ≈ now)
- Cria Creature com o blueprint já gravado no ovo (seed/hash)
- Status visual `PENDING_VISUAL` → job de arte/chassi → `READY_TO_REVEAL`
- Jogador confirma Reveal: **não altera DNA**
- Recessivos não aparecem na animação de reveal

Genealogia persistida: `fatherId`, `motherId`, `breederId`, `generation`, `birthDate`. Geração 0 = starter ou selvagem.

---

## 9. Fertilidade — anti-inflação

Máximo 5. Cada breed −1 em **cada** pai. Em 0, a criatura nunca mais reproduz. Não há item no shop que restaure fertility. GOLD/NEX não compram slot extra.

O filhote nasce 5/5. Linhagem longa = pais velhos estéreis + filhos férteis.

---

## 10. Genetic Power (flag)

Se `GENETIC_POWER_V1 === "true"`: 1/3 herda do pai, 1/3 da mãe, 1/3 novo (`inheritGeneticPower`). Origem NEW aumenta GenesisGrade (`powerOriginNew` +20). Default Alpha: framework existe, deploy da flag off.

---

## 11. O que o breeding **não** faz (ainda)

- Pais de contas diferentes (trade-breed)
- Mutação condicional de evento/bioma/hora
- Custo crescente da tabela 2000/5000 (morta)
- Incubação longa no Alpha (sempre 0)
- NFT do ovo / burn on-chain (docs `WEB3.md`)
- Preview que mostre o filho

---

## 12. Arquivos

| Peça | Caminho |
| --- | --- |
| Custo / incubação ms | `packages/game-engine/src/breeding/calculate.ts` |
| Grade | `packages/game-engine/src/breeding/genesis-complexity.ts` |
| Preview | `packages/game-engine/src/breeding/cross-potential.ts` |
| DNA do filho | `packages/game-engine/src/genes/generate.ts` (`blueprintFromParents`) |
| Chassi | `packages/game-engine/src/chassis/dna.ts` |
| HTTP | `apps/api/src/modules/breeding/breeding.service.ts` |
| Config | `economy.ts`, `incubation.ts`, `genesis-complexity.ts`, `alpha.ts`, `breeding.ts` |
