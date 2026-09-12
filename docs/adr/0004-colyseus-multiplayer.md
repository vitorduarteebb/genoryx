# ADR 0004 — Colyseus para salas

- Status: aceito
- Data: 2026-09-01

## Contexto

Mapas, batalhas e PvP precisam de salas com estado. Socket.IO genérico forçaria reinventar room sync.

## Decisão

`apps/game-server` usará Colyseus para salas. NestJS (`apps/api`) permanece a API de persistência, auth e economia.

Na Milestone 0 o processo sobe só com Express (`/health`). Colyseus entra na M2: o pacote publicado puxa protocolo `workspace:` incompatível com npm workspaces neste ambiente.

## Execução (M2)

A decisão **não muda**: salas = Colyseus; persistência/economia = Nest. Não migrar o monorepo para pnpm (ADR 0001). O desbloqueio no npm foi comprovado na M2 e está em ADR **0010** (`@colyseus/core@0.16.24` + override). Sem Socket.IO paralelo. ADR 0008 = NFT. ADR 0009 = combate em cartas.

## Consequências

- Game-server não vira “segundo banco”.
- Salas de mundo/batalha começam na M2/M4, não na M0.
- Auth do socket valida JWT emitido pela API.
