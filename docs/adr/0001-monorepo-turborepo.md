# ADR 0001 — Monorepo com Turborepo

- Status: aceito
- Data: 2026-09-01

## Contexto

NEXORA tem web, API, game-server, admin e regras de jogo compartilhadas. Repositórios separados atrasariam tipos, configs e o vertical slice.

## Decisão

Um monorepo com Turborepo e npm workspaces.

```text
apps/web, api, game-server, admin
packages/database, game-engine, types, config, ui
```

npm (não pnpm) porque o ambiente Windows atual não tem pnpm instalado.

## Consequências

- `turbo` orquestra build/test/lint.
- Packages compilam para `dist` e são dependência das apps.
- Código legado AURORA fica em `legacy/aurora`, fora dos workspaces.
