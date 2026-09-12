# Arquitetura — GENORYX: Genesis

Leia `docs/GAME_DESIGN.md` antes de alterar este documento.

Marca pública: **GENORYX: Genesis**. Código interno ainda usa workspaces `@nexora/*` (ADR 0012).

## 1. Objetivo desta fundação

Entregar um monorepo em que um jogador, nas milestones seguintes, consiga: criar conta, criar personagem, entrar em Haven, andar, encontrar uma criatura, batalhar, capturar e visualizar a criatura.

A Milestone 0 **não** implementa gameplay. Ela estabelece contratos, limites e infraestrutura para que cada sistema posterior nasça pequeno, testável e server-authoritative.

## 2. Princípios

1. **Servidor authoritative.** Cliente envia intenção (`MOVE`, `ATTACK`, `CAPTURE`, `BREED`). Servidor valida, aplica regras de `packages/game-engine` e persiste o resultado.
2. **Domínio separado de infraestrutura.** Regras de dano, cartas, captura, breeding, XP, elementos e Visual DNA vivem em `packages/game-engine`. NestJS, Prisma, Redis, Colyseus e o SDK OpenAI apenas orquestram. O engine **não** importa OpenAI (ADR 0015).
3. **Números em config.** Qualquer valor de balanceamento mora em `packages/config`. Código não contém drop rates, custos ou multiplicadores mágicos.
4. **RNG determinístico.** Regras importantes recebem um `RandomService` com seed. Proibido `Math.random` em combate, captura, breeding, loot, mercado e `visualSeed`.
5. **Ledger obrigatório.** Nenhuma mutação de GOLD ou NEX sem linha em `currency_transactions`.
6. **Módulos pequenos.** Um sistema por milestone. Arquivos grandes devem ser quebrados.
7. **Banco só por migration.** Schema muda via Prisma Migrate. Sem `db push` em produção.
8. **Blockchain = ownership, não gameplay.** NFT não calcula dano, XP, movimento, RNG nem posição. Mint é fila assíncrona. Detalhe: ADR 0008 e `docs/WEB3.md`. Sem contratos na M2.

## 3. Diagrama lógico

```text
                   HTTPS / JSON + JWT
┌────────────┐  ─────────────────────►  ┌─────────────┐
│  apps/web  │                          │  apps/api   │
│  Next.js   │                          │   NestJS    │
│  Phaser 3  │                          └──────┬──────┘
│  Zustand   │                                 │
└─────┬──────┘                                 ▼
      │ WebSocket (Colyseus)            ┌────────────┐
      │                                 │ PostgreSQL │
      ▼                                 │   Prisma   │
┌─────────────────┐                     └─────▲──────┘
│ apps/game-server│                           │
│    Colyseus     │──── Redis (cache,         │
└─────────────────┘     filas, locks) ────────┤
                                              │
┌─────────────────┐                           │
│  apps/admin     │── JWT admin ──────────────┘
│ Control Center  │
└─────────────────┘

packages/game-engine  → regras puras (testáveis sem I/O)
packages/config       → números de balanceamento
packages/types        → contratos TypeScript compartilhados
packages/database     → Prisma schema, client, seed
packages/ui           → primitivos visuais do jogo (não SaaS)
```

Web3 (milestone própria, não M2): job de mint/transfer → chain. Fora do hot path Colyseus/Nest de combate e movimento.

## 4. Apps

Estado oficial: **M0, M1 e M2 concluídas**. Criaturas = M3 (não iniciada). Alpha VPS: `docs/DEPLOYMENT.md`.

| App | Porta local | Papel atual (M2) | Próximo (M3) |
| --- | --- | --- | --- |
| `apps/web` | 3000 | Auth, personagem, canvas Phaser em `/game`, cliente Colyseus. | Visual da coleção. Sem combate. |
| `apps/api` | 3001 | Health, JWT, personagem, wallets 0. Não recebe `x/y` do cliente. | Espécies / instâncias. Sem spawn selvagem jogável. |
| `apps/game-server` | 2567 | Colyseus 0.16.24, salas `haven`/`verdantis`, JWT, movimento, persistência. | Sem criaturas na sala. |
| `apps/admin` | 3002 | Placeholder do Control Center. | Fora do compose Alpha. |

Produção Alpha (VPS): NGINX termina TLS e encaminha `/` → web, `/api/` → API, `/colyseus/` → game-server (WSS). Postgres e Redis só na rede Docker. Detalhe: `docs/DEPLOYMENT.md`.

## 5. Packages

| Package | Responsabilidade |
| --- | --- |
| `@nexora/types` | Enums, DTOs, protocolo de mundo, 10 `GENETIC_CARD_LOCI`. |
| `@nexora/config` | `combat`, `breeding`, `economy`, `capture`, `xp`, `elements`, `world`, `geneticCardConfig`. |
| `@nexora/database` | Schema Prisma, client singleton, seed de espécies/mapas. |
| `@nexora/game-engine` | Funções puras. M0: RNG + elemento. M2: movimento/colisão. M4: battle reduce de cartas (ADR 0009). Visual DNA + prompt builder (ADR 0015) — sem SDK OpenAI. |
| `@nexora/ui` | Tokens visuais e primitivos. Sem lógica econômica. |

## 6. Fluxos que o cliente não pode decidir

| Ação do cliente | O que o servidor faz |
| --- | --- |
| “Joguei Fireball e causei 340” | Recalcula effects, energy, alvo, seed; loga a action. |
| “Capturei com 100%” | Recalcula chance com HP, orb, raridade e RNG. |
| “Breed gerou SS/SS” | Recalcula genes a partir dos pais. |
| “Recebi 5000 Gold” | Só credita via serviço de ledger com `source` e `referenceId`. |
| “Ganhei o PvP” | Resultado sai da sala Colyseus authoritative. |
| “Regenerei a arte / mudei o DNA pela imagem” | Recusado. Arte só por evento de sistema; DNA só pelo engine. |

O frontend pode prever para UX (barra de captura, preview de breeding). A previsão nunca persiste.

## 7. Autenticação (M1)

- Access JWT curto (`typ=access`, 15m).
- Refresh opaco, só o hash SHA-256 no banco, com **rotação**.
- Reuso de refresh revogado invalida a sessão inteira.
- Senha: Argon2id (ADR 0007).
- Access em memória no web; refresh em `sessionStorage`.
- Classe inicial do personagem: `HUNTER` no servidor. Cliente só envia `name`.

Detalhes: `docs/SECURITY.md` e ADR `0005`.

## 8. Multiplayer

Colyseus hospeda salas:

| Sala | Milestone |
| --- | --- |
| `haven` / mapas de exploração | 2 |
| `battle-pve` | 4 |
| `battle-pvp` | 10 |
| `world-boss` | 13 |

A API NestJS continua sendo a fonte de verdade para persistência. O game-server consulta serviços internos, nunca o estado local do cliente.

## 9. Redis

Usos previstos, sem implementar todos agora:

- cache de sessões e rate limit
- filas de matchmaking
- leaderboards
- locks de marketplace e breeding
- pub/sub de World Director
- cooldowns

Na M0 o container sobe e a API verifica conectividade no `/health`.

## 10. Fronteiras de código

```text
HTTP/WS adapter  →  application service  →  game-engine  →  persistência
  Nest / Colyseus       casos de uso           puro         Prisma / Redis
```

- Adapters conhecem HTTP, JWT e salas.
- Services conhecem transações e autorização.
- Engine não importa Prisma, Nest, Redis, React nem SDK OpenAI.
- Combate competitivo V2 (ADR 0022): draft, formação F/M/B, targeting e fusion/convergence vivem no engine. Unity/web só apresentam `validTargets` e eventos.
- UI não importa Prisma nem regras de dano.
- Arte oficial: `apps/api` módulo `creature-visuals` (provider + storage + job). Bytes fora do Postgres.

## 11. CI local obrigatório por milestone

Antes de marcar uma milestone como concluída:

```bash
npm run test
npm run lint
npm run typecheck
npm run build
```

Corrigir todos os erros. Não deixar TODO crítico sem linha em `docs/ROADMAP.md`.

## 12. Decisões registradas

| ADR | Decisão |
| --- | --- |
| [0001](adr/0001-monorepo-turborepo.md) | Monorepo Turborepo + npm workspaces |
| [0002](adr/0002-server-authoritative.md) | Servidor authoritative |
| [0003](adr/0003-postgresql-prisma.md) | PostgreSQL + Prisma |
| [0004](adr/0004-colyseus-multiplayer.md) | Colyseus para salas |
| [0005](adr/0005-jwt-auth.md) | JWT access + refresh |
| [0006](adr/0006-pure-game-engine.md) | Regras puras em package |
| [0007](adr/0007-argon2id-passwords.md) | Argon2id para senhas |
| [0008](adr/0008-web3-asset-ownership.md) | NFT = posse; servidor = jogo; sem chain na M2 |
| [0009](adr/0009-card-based-tactical-combat.md) | Combate tático em cartas; não TCG; sem engine na M2 |
| [0010](adr/0010-colyseus-npm-workspaces.md) | Colyseus 0.16.24 no npm; sem meta-pacote; override do core |
| [0011](adr/0011-ten-genetic-card-loci.md) | 10 Genetic Card loci / Creature; sem NFT por carta; sem migration |
| [0012](adr/0012-public-brand-genoryx.md) | Marca pública GENORYX; packages `@nexora/*` até refactor |
| [0013](adr/0013-alpha-playable-loop.md) | Alpha Playable Loop V1 |
| [0014](adr/0014-mapa-mestre-sete-pilares.md) | Mapa mestre: 7 pilares |
| [0015](adr/0015-ai-rendered-genetic-creatures.md) | IA renderiza DNA; genome no servidor; job assíncrono |
| [0016](adr/0016-meshy-creature-3d.md) | Meshy esculpe o GLB a partir do retrato; DNA intacto |
| [0017](adr/0017-creature-profile-presence.md) | Ficha V2; PresenceController no root sem rig |

Mudança de qualquer item acima exige novo ADR. Não alterar arquitetura só no código.
