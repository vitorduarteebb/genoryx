# ADR 0005 — JWT com access e refresh

- Status: aceito
- Data: 2026-09-01

## Contexto

Browser + WebSocket precisam de auth stateless o bastante para escalar, com revogação real.

## Decisão

- Access JWT curto (alvo 15m).
- Refresh opaco, guardado como hash, rotacionado, revogável.
- Tabela `Session` para auditoria e logout.

Rotas de register/login: Milestone 1. M0 só configura módulo, secrets e schema.

## Consequências

- Access token não é a única verdade: refresh revogado derruba a sessão.
- Secrets só via env.
