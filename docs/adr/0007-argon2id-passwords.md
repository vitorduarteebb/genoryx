# ADR 0007 — Argon2id para senhas

- Status: aceito
- Data: 2026-09-01

## Contexto

A M0 deixou um esqueleto com bcrypt. A M1 passa a persistir senhas reais. O GDD/SECURITY pedem Argon2id preferencialmente.

## Decisão

Hash de senha com **Argon2id** (`argon2`). Em teste, memoryCost é reduzido para o CI não ficar lento. Refresh tokens continuam opacos com hash SHA-256 (alta entropia; Argon2 seria desperdício).

## Consequências

- bcrypt sai da API.
- Hashes existentes da M0 não existem (nenhuma conta de jogador).
