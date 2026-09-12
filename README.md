# GENORYX: Genesis

**Cada geração muda o mundo.**

RPG online no navegador: exploração, captura, genética evolutiva, breeding, PvE, PvP e economia entre jogadores.

O servidor é authoritative. O cliente nunca decide Gold, XP, dano, loot, captura, breeding ou resultado de combate.

## Documentação

Onboarding (o que existe hoje): [`docs/ESTADO_ATUAL.md`](docs/ESTADO_ATUAL.md).  
Sistemas: [`docs/SISTEMAS_BATALHA.md`](docs/SISTEMAS_BATALHA.md), [`docs/SISTEMAS_BREEDING.md`](docs/SISTEMAS_BREEDING.md), [`docs/SISTEMAS_PROGRESSAO.md`](docs/SISTEMAS_PROGRESSAO.md).  
Visão canônica: [`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md). Índice: [`docs/README.md`](docs/README.md).

## Stack

| Camada | Tecnologia |
| --- | --- |
| Monorepo | Turborepo + npm workspaces |
| Web | Next.js, React, Tailwind, Zustand, TanStack Query, Phaser 3 |
| API | NestJS |
| Game server | Colyseus |
| Banco | PostgreSQL + Prisma |
| Cache | Redis |

## Milestone 0

Fundação: docs, monorepo, Docker, schema, esqueleto dos apps. Sem gameplay.

O código antigo **AURORA** (chat de voz) foi isolado em `legacy/aurora`.

## Subir a fundação

```bash
copy .env.example .env
npm install
docker compose up -d
npm run db:migrate
npm run db:seed
npm run dev
```

- Web: http://localhost:3000
- API health: http://localhost:3001/health
- Game server: http://localhost:2567/health
- Admin: http://localhost:3002

Antes de fechar uma milestone:

```bash
npm run test
npm run lint
npm run typecheck
npm run build
```
