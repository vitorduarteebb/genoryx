# ADR 0012 — Marca pública GENORYX

- Status: aceito
- Data: 2026-09-02

## Contexto

O nome de trabalho era NEXORA: Genesis. O domínio oficial `genoryx.com.br` foi registrado. Testers já usam a VPS `85.31.60.84` em `:8443` (AURORA ocupa a 443 do hostname Hostinger).

Renomear packages `@nexora/*` agora quebraria imports, lockfile e imagens sem ganho de gameplay.

## Decisão

1. **Marca pública:** GENORYX. Nome completo: **GENORYX: Genesis**. Tagline: **Cada geração muda o mundo.**
2. **Domínio:** `genoryx.com.br`. Alpha: `alpha.genoryx.com.br`. Jogo futuro: `play.genoryx.com.br`. API em subdomínio só quando fizer sentido.
3. **Identidade no produto** (UI, títulos, logs, GDD) usa GENORYX. Números/URLs públicas em `@nexora/config` (`brandConfig`).
4. **Packages, workspaces e nomes de pasta** continuam `@nexora/*` até uma refatoração técnica própria, com quality gate.
5. Alpha permanece na VPS atual. Corte HTTPS 443 no hostname `alpha.genoryx.com.br` (SNI), sem tomar o vhost AURORA `srv1568762.hstgr.cloud`. `:8443` redireciona depois do certificado.

## Consequências

- Docs e UI mudam agora.
- Rebuild da imagem `web` quando a URL pública mudar (bundle `NEXT_PUBLIC_*`).
- ADRs anteriores podem ainda dizer NEXORA; são históricas.
