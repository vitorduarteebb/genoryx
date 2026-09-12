# Breeding — GENORYX: Genesis

Implementação somente a partir da ordem absoluta 13–15. Este arquivo congela as regras para a engine pura.

## 1. Objetivo

Dois pais geram um ovo. O ovo choca numa criatura cujo DNA deriva dos pais, com chance de recessivo, mutação e dual-element. Fertilidade finita impede inflação.

Breeding é o **núcleo** do GENORYX (GDD §3.1 pilar 5): recombina aparência, cartas, status, mutação e **GeneticPower** (1/3 pai, 1/3 mãe, 1/3 novo) no mesmo ato.

```text
               APARÊNCIA
                  ↑
                  │
CARTAS ←──── BREEDING ────→ STATUS
                  │
                  ↓
               MUTAÇÃO
```

## 2. Entrada do sistema

O cliente envia apenas:

- `parentAId`
- `parentBId`

O servidor carrega as criaturas, valida posse, fertilidade e bloqueios (mercado, batalha, incubação) e chama `calculateBreeding()` em `packages/game-engine`.

## 3. Validações

1. Ambos os pais pertencem ao mesmo personagem (v1; trade-breed é milestone futura).
2. `fertility > 0` nos dois.
3. Nenhum está `LOCKED` (listing, combate, outro breed).
4. Custo em GOLD do **próximo** slot de cada pai é somado e debitado via ledger.
5. Compatibilidade (espécie, geração, eventos) vem de config, não de ifs soltos.

## 4. Custo

Na mesma transação atômica:

- GOLD da fórmula (servidor, `packages/config/src/economy.ts`)
- 1 Genome Catalyst
- 1 fertility de cada pai

```
cost = 250 * (1 + 0.40 * parentA.breedsUsed + 0.40 * parentB.breedsUsed)
```

Primeiro cruzamento (0 usos cada) = 250 GOLD. Sem GOLD, sem catalyst ou sem fertility: rejeitar e rollback. Cliente não manda o valor.

Após commit: ambos `fertility -= 1` e catalyst −1.

## 5. Ovo e incubação

Depois do commit o ovo recebe **GenesisGrade** (COMPLEXIDADE genética, não força de combate) e `hatchesAt` no servidor.

| GenesisGrade | Alpha (hoje) | Produção (config) |
| --- | ---: | ---: |
| COMMON | 0 min | 30 min |
| REFINED | 0 min | 1 h |
| RARE | 0 min | 3 h |
| EXCEPTIONAL | 0 min | 8 h |
| GENESIS | 0 min | 18 h |

Números em `incubationConfig`. `INCUBATION_PROFILE=alpha|production`. O Alpha zera a espera para testar o loop. Pipeline do código: [`SISTEMAS_BREEDING.md`](SISTEMAS_BREEDING.md).

**CrossPotential** (antes do cruzar) ≠ **GenesisGrade** (depois). O preview não revela o filho.

Cada ovo tem arte própria (`EggVisualAsset`) derivada de pistas do ChildGenome. OpenAI não escolhe genes. Falha de imagem não cancela o breed.

Pais **não** ficam locked na incubação. Fertility cai no commit.

`Egg.hatchesAt` é timestamp de servidor. Cliente só lê. Hatch é job/API no servidor.

## 6. Herança de genes (stats)

Para cada gene de atributo (HP, ATK, DEF, MAG, RES, SPD, CRIT, CRIT_DMG, PRECISION, EVASION):

1. Sorteia o gene de A ou de B (pesos em config).
2. Pequena chance de “drift” ±1 rank, clampado em F..SS.
3. Tudo passa pelo `RandomService` da sessão (`BreedingSession.rngSeed`).

## 6b. Herança dos 10 Genetic Card loci

ADR 0011. Independente dos stats. Para **cada** `G1`–`G10`:

```text
alelo A (expressed + recessive)
+ alelo B (expressed + recessive)
+ dominância
+ expressão recessiva
+ recombinação
+ mutação
========
locus do filho (expressed + recessive)
```

Mesmo `rngSeed` + mesmo estado dos pais = mesmo resultado. Só `RandomService`. Sem `Math.random`. Sem fórmula neste arquivo.

Mutações podem alterar um locus, vários loci, variante, elemento, família ou modifiers. Raras podem tocar G9/G10. Engine data-driven; sem switch por mutação.

## 7. Dominante e recessivo

- O filhote recebe um trait **visível** (dominante) e um **oculto** (recessivo) nos stats **e** em cada locus de carta.
- Chance de o recessivo de um pai virar expressed no filho: config (`recessiveRevealChance`).
- Linhagens existem para o jogador perseguir traits e cartas escondidas.

## 8. Elementos

- Primário: um dos primários dos pais, com viés para o dominante da espécie.
- Secundário: possível se um pai tiver secundário, ou se mutação/evento exigir (ex.: Pyron Tempestade = Fogo / Elétrico).

## 9. Pureza

Percentual de quão próximos os genes estão da linhagem “pura” da espécie.

- Não é poder.
- Mestiços podem ser mais fortes.
- UI deve explicar isso para não criar meta falsa.

## 10. Mutação

Chance baixa (`mutationChance` em config). Eventos somam modificador (Genetic Surge +5%, Eclipse Lunar do Noctyr +10%).

Condições possíveis: horário, evento, item, região, clima, artefato, nível, geração, composição genética.

Mutação sem condição satisfeita = não rola o branch, mesmo que o RNG “queira”.

O hatch é rápido: cria a Creature, enfileira o job visual e devolve `AWAITING_GENESIS_REVEAL`. O jogador **não** vê o retrato completo até o Genesis Reveal. Recessivos nunca entram nessa animação.

Pais com `PENDING_VISUAL` ou `READY_TO_REVEAL` não cruzam.

## 11. Genealogia

Persistir sempre:

- `fatherId`, `motherId`, `breederId`, `generation`, `birthDate`

Árvore na UI: pais, avós, bisavós, criador original. Geração 0 = selvagem ou starter.

## 12. Quest de desbloqueio

Breeding libera ~nível 10 com a quest **The Genesis Code**. API recusa breed antes do unlock.

## 13. O que a M0 entrega

- Tabelas `BreedingSession` e `Egg` no schema.
- Números em `@nexora/config`.
- **Nenhuma** rota de breed e nenhum cálculo de filhote.

## 14. Testes obrigatórios (M6)

- Fertilidade 0 rejeita.
- Custo usa a tabela e gera ledger.
- Mesmo seed + mesmos pais = mesmo filhote.
- Recessivo pode aparecer; mutação respeita condição.
- Rollback se o débito de Gold falhar.

## 15. NFT (alvo, não M6)

Breed continua **server authoritative**. A chain não sorteia DNA.

Fluxo futuro: validar posse de jogo + fertility → `RandomService` → Postgres (ovo + ledger) → job de mint do Egg NFT. No hatch: criar Creature no banco → burn/consume do ovo on-chain → mint da Creature. Tudo assíncrono; incubação e hatch **não** esperam bloco.

Depois do commit do hatch: job de arte (BABY) → storage → `CreatureVisualAsset`. OpenAI **fora** da transação de breeding. Falha de imagem não desfaz o filho.

`geneticHash` (determinístico no servidor) poderá ir na metadata. A imagem tem `imageHash` separado e **não** altera o DNA. O cliente não envia DNA nem hash para persistir.

Ver `docs/WEB3.md` e `docs/AI_CREATURE_GENERATION.md`.

## 16. Genes e o deck (alvo)

O DNA do filhote **é** o deckbuilding **e** o fenótipo: 10 loci recombinados (ADR 0011) + stats (soma das partes com teto, GDD §3.1 pilar 3) + camadas físicas (body, head, e depois eyes/horns/membros/cauda/pattern/asas/aura) + recessivos + elemento + mutação + genealogia.

Unlock, replace, custo, alvo, elemento, status, comportamento (ADR 0009). Nenhuma parte física sozinha define o filho.

Testes de M6: mesmo seed → mesmos 10 pares expressed/recessive + mesmos stats. Quando o catálogo existir, o mesmo seed deve gerar o mesmo pool.

Spec: `docs/COMBAT.md`.
