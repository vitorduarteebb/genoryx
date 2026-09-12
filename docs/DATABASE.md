# Banco de dados — GENORYX: Genesis

Fonte de design: `docs/GAME_DESIGN.md`. Schema executável: `packages/database/prisma/schema.prisma`.

## 1. Tecnologia

- PostgreSQL 16
- Prisma ORM
- Toda mudança de schema via `prisma migrate`
- IDs: UUID
- Saldos monetários: `BigInt` (inteiros). Nunca `Float` para Gold/NEX

## 2. Convenções

- Tabelas e campos em `camelCase` no Prisma; PostgreSQL mapeia para o padrão do client.
- Soft delete apenas onde o GDD exige histórico (usuários). Criaturas vendidas mudam de dono, não desaparecem.
- Toda tabela de economia e admin tem `createdAt`.
- Relacionamentos de genealogia usam `onDelete: Restrict` para não apagar linhagens.

## 3. Decisão: carteira na conta, não no personagem

O GDD lista ouro e cristais no personagem. A implementação persiste saldo em `Wallet` por `userId`.

Motivo: marketplace, taxa e auditoria são da conta. O personagem apenas exibe o saldo. Há um personagem principal por conta na v1 (`Character.userId` único).

Se no futuro existirem vários personagens por conta com economias separadas, isso vira ADR e migration.

## 4. Mapa de tabelas por domínio

### Identidade

| Tabela | Uso | Milestone |
| --- | --- | --- |
| `User` | credenciais | 0–1 |
| `Profile` | dados públicos da conta | 1 |
| `Session` | sessão autenticada | 0–1 |
| `RefreshToken` | refresh rotacionável e revogável | 0–1 |

### Personagem e progresso

| Tabela | Uso | Milestone |
| --- | --- | --- |
| `Character` | avatar, nível, classe, posição | 1 |
| `CharacterProfession` | profissão + XP | 24 |
| `Quest` / `QuestProgress` | missões | 21 |
| `Achievement` / `CharacterAchievement` | conquistas | 21 |

### Mundo

| Tabela | Uso | Milestone |
| --- | --- | --- |
| `GameMap` | Haven, Verdantis, Emberfall | 2 |
| `MapSpawn` | spawn table | 9 |
| `Npc` | Kael, Lyra, Orin, Theo, Arena Master | 2 |

### Criaturas

| Tabela | Uso | Milestone |
| --- | --- | --- |
| `CreatureSpecies` | 12 espécies | 3 |
| `Mutation` | Infernal, Magma, Lunar… | 7 |
| `Creature` | instância com DNA | 3 |
| `CreatureTrait` | gene dominante/recessivo | 3 / 7 |
| `CreatureSkill` | legado; **não** define o deck | — |
| `CreatureLocus` | 10 loci × 2 alelos (ADR 0011) | Alpha Loop |
| `GeneticPower` / `CreaturePower` / `GeneticPowerLineage` | Poder de linhagem + 10 manifestações (ADR 0021). Flag `GENETIC_POWER_V1`. | V1 framework |
| `CreatureAncestry` | denormalização opcional da árvore | 15 |
| `CreatureVisualAsset` | arte canônica por life stage (ADR 0015) | Alpha visual |

`Creature` ganha `lifeStage`, `evolutionStatus` (`NONE` | `READY_TO_EVOLVE` | `EVOLVING`), `temperament`, `visualSeed`, `visualStatus`, `visualGenomeJson`, `revealStatus` (`NOT_REQUIRED` | `PENDING_VISUAL` | `READY_TO_REVEAL` | `REVEALED`). Criaturas anteriores à feature ficam `REVEALED` e `evolutionStatus=NONE`. Unique do asset: `creatureId + lifeStage + generationKey`. Bytes da imagem ficam no object storage persistente (`var/creature-visuals` / volume Docker), não no Postgres. Evolução não altera `id`, `geneticHash`, pais, loci nem partes físicas.

Maturação (ADR 0025): `Creature.maturationXp`, `maturationState` (`GROWING` | `READY` | `MATURE`), `readyToEvolveAt`. Evento `MaturationEvent` (`source`, `battleId`, `creatureId`, `mobSpecies`, `amount`, `participation`) com unique `(battleId, creatureId)` para não pagar duas vezes. Progresso percentual é derivado da config, não coluna solta.

Genealogia mínima já está em `Creature.fatherId`, `motherId`, `breederId`, `generation`.

### Breeding

| Tabela | Uso | Milestone |
| --- | --- | --- |
| `BreedingSession` | pais, custo, seed, resultado | 13 |
| `Egg` | incubação até `hatchesAt`, `genesisGrade`, `complexityScore`, `incubationStartedAt` | 14 |
| `EggVisualAsset` | arte única do ovo (job async, sem DNA no DTO público) | 14 |

### Itens

| Tabela | Uso | Milestone |
| --- | --- | --- |
| `ItemTemplate` | definição (Flame Sword, NexOrb) | 12 |
| `Item` | instância (`ItemInstance` no modelo Web3) com affixes | 11 |
| `InventorySlot` | posse por personagem | 11 |
| `Equipment` | slots do personagem | 11 |
| `CreatureEquipment` | rune / artifact / charm | 11 |

### Economia

| Tabela | Uso | Milestone |
| --- | --- | --- |
| `Wallet` | saldo GOLD / NEX | 16 |
| `CurrencyTransaction` | ledger | 16 |
| `MarketListing` | anúncio bloqueado | 18 |
| `MarketTransaction` | compra, taxa, transferência | 18 |

### Combate e PvP

| Tabela | Uso | Milestone |
| --- | --- | --- |
| `Battle` | PvE/PvP, seed, vencedor | 8 / 19 |
| `BattleLog` | replay: actions de carta + seed | 8 |
| Catálogo de cartas (alvo) | `CardDefinition` e afins — só na M4 | 8 |
| `CardArtAsset` | ilustração por definição+variant; bytes no volume `card-art` | Alpha / ADR 0018 |
| `PvpMatch` | fila, MMR delta | 19 |
| `Ranking` | season + rank | 20 |

### Social e eventos

| Tabela | Uso | Milestone |
| --- | --- | --- |
| `Guild` / `GuildMember` | guildas | 26 |
| `WorldEvent` | World Director | 27 |
| `AdminActionLog` | auditoria admin | 29 |

## 5. Entidade Creature (campos do GDD)

| Campo | Tipo | Nota |
| --- | --- | --- |
| `ownerCharacterId` | UUID | dono atual |
| `speciesId` | UUID | espécie |
| `name` | string | apelido opcional |
| `level` / `xp` | int | progressão |
| `gender` | enum | breeding |
| `generation` | int | 0 = selvagem / starter |
| `fatherId` / `motherId` | UUID? | linhagem |
| `breederId` | UUID? | character que cruzou |
| `fertility` | int | 0–5 |
| `elementPrimary` / `elementSecondary` | enum | dual-element |
| `*Gene` | `GeneRank` | HP, ATK, DEF, MAG, RES, SPD, CRIT, critDmg, precision, evasion |
| `mutationId` | UUID? | |
| `geneticPurity` | Decimal(5,2) | 0–100; não é poder |
| `birthDate` | DateTime | |
| ponte NFT | opcional | `tokenId` **não** é PK. Só na milestone Web3. `docs/WEB3.md` |

## 6. Ledger

Regra: **nunca** `UPDATE wallets SET balance = balance + N` isolado.

Fluxo obrigatório dentro de uma transação Prisma:

1. Ler `Wallet` com lock (`update` na mesma `$transaction`).
2. Calcular `balanceAfter`.
3. Recusar se débito deixaria saldo negativo.
4. Persistir `Wallet.balance`.
5. Inserir `CurrencyTransaction` com `source`, `referenceId`, `balanceBefore`, `balanceAfter`.

`source` canônicos (ADR 0024): `QUEST_REWARD`, `PVE_REWARD`, `PVP_REWARD`, `BREEDING_COST`, `SHOP_PURCHASE`, `MARKET_LISTING_FEE`, `MARKET_SALE`, `MARKET_FEE`, `CRAFT_COST`, `SYSTEM_GRANT`, `ADMIN_ADJUSTMENT`, `SYSTEM_SINK`.

`ItemFlow` audita grant/consume de materiais (Genome Catalyst). `EconomyDailySnapshot` guarda o dia UTC. Fees de market creditam a wallet do usuário sistema `system@genoryx.internal`.

## 7. Mercado (contrato, não implementação)

1. Listing cria registro e marca o ativo (`Item` ou `Creature`) como `LOCKED`.
2. Compra ocorre em transação única: débito comprador, crédito vendedor líquido, débito taxa (sink), troca de dono, `MarketTransaction`, unlock.
3. Qualquer erro faz rollback. Não há “Gold sumiu e item ficou no limbo”.

Alvo Web3: mercado interno e mercado on-chain **não** podem divergir. Serviço de reconciliação de posse antes de abrir chain market. Nenhum dos dois na M2.

## 8. Índices iniciais

- `User.email` unique
- `Character.userId` unique
- `Character.nameNormalized` unique (comparação de nome; ver política abaixo)
- `Wallet (userId, currency)` unique
- `Creature.ownerCharacterId`
- `MarketListing` por status + createdAt
- `CurrencyTransaction (userId, createdAt)`
- `RefreshToken.tokenHash` unique

## 9. Seed da M0

O seed popula catálogo, não jogadores:

- 12 espécies
- mapas Haven, Verdantis, Emberfall
- spawn tables das seções 22 e 80 do GDD
- NPCs de Haven
- templates de NexOrb (catálogo; captura só na M5)

## 10. Migrations

```bash
npm run db:migrate -- --name descricao_curta
npm run db:seed
```

Proibido editar migration já aplicada. Correção = nova migration.

## 11. Política de nome de personagem (M1)

- Cliente envia só `name`.
- Display: NFKC, trim, espaços internos colapsados. 3–20 caracteres. Letras/números Unicode, espaço, hífen, apóstrofo. Sem controles.
- `nameNormalized` = display em minúsculas. Unique no banco. `Kael` e `kael` colidem.
- Email da conta é independente do nome público.

## 12. Wallets na M1

Registro cria GOLD e NEX com `balance = 0`. **Não** há `CurrencyTransaction` de genesis: zero não é crédito. Ledger entra quando o primeiro valor real se mover.

## 13. O que a M0 não faz

- Não cria contas de jogadores no seed.
- Não implementa serviços de breeding, combate ou marketplace.
- Não expõe endpoints que mutam Gold.

## 14. Modelo Web3 (alvo — sem migration agora)

Não aplicar no Prisma até a milestone Web3. M2 não depende disto.

| Conceito | Papel |
| --- | --- |
| Ponte NFT no asset | `tokenId`, `chainId`, `contractAddress`, `mintStatus`, `mintTxHash`, `metadataUri`, `metadataHash` — todos opcionais; UUID interno é PK |
| `UserWallet` | address, chainId, type EMBEDDED/EXTERNAL, isPrimary |
| `AssetOwnership` | assetType + assetId + userId + walletId?; `userId` ≠ dono on-chain para sempre |
| `BlockchainTransaction` | fila mint/transfer/burn; PENDING → CONFIRMED/FAILED |
| `geneticHash` em Creature | prova de DNA; calculado no servidor |
| `Item` | já é instância; Template fica no catálogo |

GOLD/NEX continuam só em `Wallet`. Sem tabela ERC-20.

## 15. Combate em cartas (alvo — sem migration agora)

ADR 0009. Não aplicar no Prisma até a M4. M2 não depende disto.

| Conceito | Papel |
| --- | --- |
| `CardDefinition` | catálogo data-driven (key, type, cost, effects, upgradePaths). **Não** NFT |
| `SynergyDefinition` / `InteractionDefinition` | traits e combos |
| `StatusDefinition` | burn/poison/… com duration/stacks |
| Loadout de deck | personagem escolhe ~16 keys do pool autorizado |
| Formação | V2: FRONT / MIDDLE / BACK. V1 replay: FRONT / BACK_LEFT / BACK_RIGHT. `battles.rules_version` |
| Draft | runtime no `stateJson` (roster, ban, pick, bench). Sem tabelas extras nesta fatia |
| `Battle` / `BattleLog` | já existem; log passa a gravar actions (`PLAY_CARD`, draw, energy) |

`CreatureSkill` da M0 pode ser legado. **Não** usar 4 skills fixas como modelo da M3. O alvo é 10 loci (ADR 0011). Sem dual-write agora. Sem migration nesta entrega.

Instância de carta na luta é runtime (memória do engine), não linha obrigatória por token.

## 16. Genetic Card loci (alvo — sem migration agora)

ADR 0011. Não aplicar no Prisma até a revisão do modelo da M3.

| Conceito | Papel |
| --- | --- |
| 10 loci / Creature | `G1`–`G10`; `lociPerCreature` em config |
| Alelos | `expressed` + `recessive` por locus |
| Expressão | family, variant, element, power/energy/speed/status/target, modifiers, mutationState |
| Marketplace (futuro) | ficha genética pública: espécie, G1–G10 expressed, mutation, parents, generation |

Marketplace e schema **não** se implementam agora.
