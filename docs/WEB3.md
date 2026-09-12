# Web3 — GENORYX: Genesis

Fonte de produto: `docs/GAME_DESIGN.md`. Decisão: ADR `0008`. **Nenhum contrato, mint ou migration Web3 na M2.**

Princípio: **blockchain = ownership. Game-server = gameplay.** Combate, XP, movimento, RNG e posição **nunca** vão on-chain.

---

## 1. Camadas

```text
Jogador ── conta GENORYX (email) ── UserWallet (embedded / externa)
                │
                ▼
         PostgreSQL (fonte de gameplay)
         Character, Creature, Egg, Item, Wallet GOLD/NEX
                │
                │  fila assíncrona (mint / transfer / burn)
                ▼
         Blockchain (ERC-721 / ERC-1155)
         prova de posse transferível
```

A API e o Colyseus **não** chamam RPC de contrato no hot path (move, attack, capture, breed roll).

---

## 2. Padrões de token

| Ativo | Padrão | Unicidade |
| --- | --- | --- |
| Character | ERC-721 | 1 token / personagem |
| Creature | ERC-721 | 1 token / instância |
| Egg | ERC-721 | 1 token / ovo |
| Unique equipment | ERC-721 | instância |
| Unique artifact | ERC-721 | instância |
| Cosmético único | ERC-721 | instância |
| Stackable items | ERC-1155 | `tokenId` de template + quantidade |
| Materials | ERC-1155 | |
| Consumables | ERC-1155 | |
| NexOrb | ERC-1155 | |
| Cosmético stackable | ERC-1155 | |

GOLD: **moeda interna**, ledger atual. Sem token.

NEX: **saldo interno** (`Wallet` NEX). **Sem ERC-20** nesta decisão. Token NEX exige ADR de tokenomics próprio.

---

## 3. Identidade interna vs chain

Toda entidade jogável tem UUID interno. Ponte chain, quando existir, é **nullable**:

| Campo | Uso |
| --- | --- |
| `tokenId` | id no contrato (não PK) |
| `chainId` | rede |
| `contractAddress` | coleção |
| `mintStatus` | ver §6 |
| `mintTxHash` | última tx de mint |
| `metadataUri` | URI versionada |
| `metadataHash` | integridade do documento de metadata |

`tokenId` **nunca** substitui `Creature.id` / `Character.id` / `Egg.id` / `Item.id`.

Até o módulo Web3 existir, esses campos **não são obrigatórios** e o jogo trata tudo como `NOT_MINTED`.

---

## 4. ItemTemplate vs ItemInstance

Já no schema M0:

- `ItemTemplate` = catálogo (“Dragon Sword”, NexOrb).
- `Item` = instância (“Dragon Sword #8382”, affixes). Na documentação alvo, `Item` **é** `ItemInstance`.

Únicos (não stackable) → futuro ERC-721 por `Item`.  
Stackable → futuro ERC-1155 por template (+ quantidade no inventário / 1155 balance).

Não renomear a tabela `items` na M2.

## 4.1 Cartas não são NFT

Cartas de combate são **derivadas** de Character, Creature, Egg, Equipment e itens. As **10 Genetic Card loci** (ADR 0011) e o **GeneticPower** (ADR 0021) vivem no DNA da Creature. Não mintar uma carta por habilidade, nem o poder como NFT separado.

Skill Rune NFT, se existir um dia, é ADR separado. Raridade NFT não decide vitória (ADR 0009).

---

## 5. Ownership

Não assumir `userId` = dono on-chain para sempre.

```text
User  →  UserWallet[]  →  NFT (chain)
  │
  └── posse de gameplay (Character.userId, Creature.ownerCharacterId, …)
```

### UserWallet (alvo)

`id`, `userId`, `address`, `chainId`, `type` (`EMBEDDED` \| `EXTERNAL`), `isPrimary`, `createdAt`.

### AssetOwnership (alvo)

Registro de posse **de jogo** reconciliável com a chain:

- `assetType` (`CHARACTER` \| `CREATURE` \| `EGG` \| `ITEM` …)
- `assetId` (UUID interno)
- `userId`
- `walletId` (opcional até haver wallet)
- `source` (`GAME` \| `CHAIN` \| `RECONCILED`)
- `updatedAt`

O dono de combate/breed continua sendo o personagem/conta no Postgres. A chain atesta transferência quando o módulo Web3 estiver ligado.

Serviço futuro: **Ownership Reconciliation** — se listing interno e transfer on-chain divergirem, o ativo fica `LOCKED` até resolver. Sem isso, marketplace on-chain não abre.

---

## 6. Mint status e transações

`mintStatus` no asset: `NOT_MINTED` \| `QUEUED` \| `MINTING` \| `MINTED` \| `FAILED`.

### BlockchainTransaction (alvo)

`id`, `userId`, `assetType`, `assetId`, `chainId`, `contractAddress`, `txHash`, `operation` (`MINT` \| `TRANSFER` \| `BURN` \| `LAZY_REVEAL` …), `status`, `createdAt`, `confirmedAt`, `failureReason`.

Status da tx: `PENDING` \| `SUBMITTED` \| `CONFIRMED` \| `FAILED`.

**Gameplay nunca bloqueia** em `PENDING` / `SUBMITTED`. O jogador anda, luta, abre UI, ganha XP, troca equipamento e usa consumível com o estado do banco.

---

## 7. Metadata e geneticHash

Metadata versionada. Não depender só de URI mutável sem hash.

O mint futuro pode ocorrer depois da arte canônica existir. `Creature.revealStatus = REVEALED` é só UX — o NFT nunca deve depender do jogador ter assistido a animação.

Creature / Genesis Certificate (documento de metadata, não o schema de combate):

- species, generation, parents, birth, breeder, mutation
- 10 **expressed** card genes (G1–G10)
- `geneticHash`
- visual traits

Genes **recessivos** ficam server-side por padrão (descoberta no breeding). Genetic Scan / DNA Reveal exige ADR próprio.

Life stage (EGG/BABY/YOUNG/ADULT) atualiza metadata do **mesmo** token. Não mintar NFT por fase. A URI de imagem aponta para a arte canônica já armazenada — nunca gerar arte no market.

`imageHash` ≠ `geneticHash`. Regenerar arte inválida não muda o DNA.

**Fora da metadata permanente:** XP, HP atual, posição, buffs. Isso é gameplay.

### geneticHash

DNA completo (stats, 10 loci × 2 alelos, traits, mutação, elementos) vive no servidor.

`geneticHash` = hash determinístico desse conjunto (algoritmo na milestone Web3, testes de estabilidade). Pode ir na metadata/token para auditar que a genética **não foi editada** fora do `RandomService` / engine.

O cliente **não** envia `geneticHash` para “atualizar” a criatura.

---

## 8. Breeding (alvo; implementação = M6 + job Web3)

```text
NFT A + NFT B
  → game-server valida ownership de jogo + fertility + locks
  → game-engine + RandomService gera DNA do filho
  → transação Postgres (BreedingSession, Egg, ledger GOLD)
  → job: mint Egg NFT (async)
Hatch:
  → burn/consume Egg on-chain (async) + criar Creature no banco
  → job: mint Creature NFT
```

A chain **não** sorteia genes. Sem GOLD no ledger, não há ovo — mesmo que os NFTs existam.

---

## 9. Mercados

| Mercado | Moeda | Milestone |
| --- | --- | --- |
| Interno (Nexus Market) | GOLD + lock de ativo | 18 (GDD) |
| On-chain | NFT / 1155 | depois do Reconciliation Service |

Nenhum na M2. Transferência interna e transfer na chain devem convergir; senão o ativo não anuncia.

Listagem futura de Creature (exemplo de UI, não schema):

```text
PYRON #12882
G1 … G10 (expressed)
Genetic traits · Mutation · Parents · Generation
```

Recessivos: política de visibilidade própria. Sem implementação agora.

---

## 10. Lazy mint (política final = milestone Web3)

Arquitetura **permite**; política não está fechada.

| Ativo | Intenção atual (revisável) |
| --- | --- |
| Character | mint automático quando o módulo Web3 ligar |
| Creature | mint automático ou no momento da aquisição |
| Unique equipment | lazy mint |
| Stackable / 1155 | settlement preguiçoso |

Até lá, tudo é `NOT_MINTED` e jogável.

---

## 11. Wallet

- Cadastro M1 (email/senha) permanece. **Não exigir MetaMask.**
- Alvo: **embedded/smart wallet** criada de forma transparente, ligada a `User`.
- Depois: wallet externa, linking, export quando o provedor permitir.
- Custody: chave de usuário **nunca** plaintext no Postgres. Segredo de minter **nunca** no frontend nem em `NEXT_PUBLIC_*`.

---

## 12. Segurança dos contratos (quando existirem)

- AccessControl, Pausable se couber
- limites de mint
- roles separadas (minter ≠ admin ≠ pauser)
- admin de produção via multisig
- mint só em serviço backend confiável

NFT **não** autoriza o cliente a ditar level, XP, DNA, fertility, damage, rarity ou mutation.

---

## 13. Relação banco ↔ chain

| Pergunta | Resposta |
| --- | --- |
| Quem pode breed/combat? | Postgres (owner + locks) |
| Quem prova venda mundial? | NFT / 1155 após mint |
| E se o mint falhar? | Asset continua jogável; `FAILED` + retry na fila |
| PK | sempre UUID interno |
| GOLD / NEX | só `Wallet` + ledger |

---

## 14. O que não fazer agora

- Smart contracts, subgraph, indexer, MetaMask, ERC-20 NEX
- Migration Prisma só para colunas NFT
- Qualquer espera de bloco na M2 (Phaser / Haven / Colyseus)
