# ADR 0008 — Propriedade digital (NFT) desacoplada do gameplay

- Status: aceito (documentação; **não implementado**)
- Data: 2026-09-01

## Contexto

NEXORA: Genesis passa a ser um RPG com propriedade transferível on-chain (personagem, criatura, ovo, equipamento único, itens stackable). O vertical slice (Haven, combate, captura, breed) não pode esperar confirmação de bloco. Colocar XP, DNA, dano ou posição na chain quebraria o servidor authoritative (ADR 0002) e o RNG seedável (ADR 0006).

## Decisão

1. **Blockchain = ownership.** Game-server / API = autoridade de gameplay.
2. **IDs internos (UUID) permanecem PK.** `tokenId` nunca é chave primária.
3. **Campos de mint são opcionais** até a milestone Web3. Gameplay não exige `MINTED`.
4. **GOLD não é token.** **NEX não vira ERC-20** nesta decisão; tokenomics de NEX é ADR futuro.
5. **Carteira embutida** (smart/embedded wallet) é o caminho padrão. MetaMask não é obrigatório.
6. **Mint e settlement são assíncronos** (fila + `BlockchainTransaction`). Andar, combater, XP e UI nunca esperam o chain.
7. **Dois mercados no alvo:** interno (ledger GOLD) e on-chain. Nenhum na M2. Reconciliação de posse é serviço próprio.
8. **Contratos e migrations Web3 não entram na M2.**

Padrões e ciclo de vida: `docs/WEB3.md`.

## Consequências

- Schema Prisma atual (M0/M1) continua válido. Extensões (`UserWallet`, `AssetOwnership`, ponte NFT, `geneticHash`) só na milestone Web3.
- Cliente com NFT **não** pode enviar level, XP, DNA, fertility, damage, rarity ou mutation.
- Chaves de minter nunca no browser nem em plaintext no banco.
- ADR 0010 (Colyseus/npm) permanece independente desta decisão.
