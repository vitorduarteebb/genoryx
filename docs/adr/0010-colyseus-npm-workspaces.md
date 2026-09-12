# ADR 0010 — Colyseus no npm workspaces

- Status: aceito
- Data: 2026-09-01

## Contexto

ADR 0004 escolheu Colyseus para salas e npm workspaces (ADR 0001). O meta-pacote `colyseus@0.16.x` e `@colyseus/core@0.16.25` declaram `@colyseus/greeting-banner: workspace:^`. npm trata `workspace:` como protocolo e falha com `EUNSUPPORTEDPROTOCOL`.

`colyseus@0.18` existe no npm, mas o cliente publicado `colyseus.js` para neste workspace em `0.16.22`. Subir o servidor a 0.18 quebraria o cliente.

Migrar o monorepo para pnpm só para instalar Colyseus violaria ADR 0001.

## Decisão

1. **Não instalar o meta-pacote `colyseus`.** Ele puxa `@colyseus/core@0.16.25` e tools com `workspace:`.
2. **Não instalar `@colyseus/testing`.** O mesmo problema de protocolo.
3. **Pin:** `@colyseus/core@0.16.24` (greeting-banner em semver `^2.0.6`, sem `workspace:`).
4. **Override no root** `package.json`: `"@colyseus/core": "0.16.24"` para qualquer dependência transitiva não subir a 0.16.25.
5. Transporte: `@colyseus/ws-transport@0.16.5`. Schema: `@colyseus/schema@3.0.76`.
6. Cliente: `colyseus.js@0.16.22` no web e nos testes do game-server.
7. **Não usar Colyseus 0.18** nesta milestone.

## Comprovação

- `npm install` completa com o override.
- `GET /health` do game-server reporta `colyseus: "0.16.24"`.
- e2e: dois clientes `colyseus.js` na mesma `haven`; `MOVE_INPUT` de A altera `x` visível em B; posição persiste no leave.

## Consequências

- Salas `haven` e `verdantis` vivem em `@colyseus/core`, não no meta-pacote.
- Vitest precisa filtrar IPC `axm:*` de `@pm2/io` (peer do core); stub/filtro só nos testes.
- Schema 3 exige `experimentalDecorators` e `useDefineForClassFields: false` no tsconfig do game-server.
- Socket.IO paralelo continua fora. Combate (0.18/cartas) não muda esta decisão.
