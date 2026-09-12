# ADR 0036 — Recurso pessoal por criatura

- Status: aceito
- Data: 2026-09-11

## Contexto

O Genetic Combat Engine (ADR 0035) já dava um `PersonalResource` raso (`id`, `displayName`, `maxStacks`). HEAT parecia um glossário global: duas criaturas de fogo ganhavam Calor do mesmo jeito. O jogador via `HEAT 2/3` sem saber o que era, como ganhava ou o que arriscava.

## Decisão

1. A definição vive na Combat Identity da criatura (`combatManifestJson.identity.resource`). Não há coluna Prisma nova.
2. `PersonalResourceDefinition` é data-driven: `generationRules`, `consumptionRules`, thresholds, passives, decay, reset, `sourceGenes`, `relatedCardIds`, `variant`.
3. O texto da UI (ficha, `?`, chips) é formatado a partir das regras. Proibido `if (resource === "HEAT")` com frase fixa.
4. Duas criaturas podem usar o mesmo `resourceType` (HEAT) com `variant` diferente (Núcleo Magmático vs Fornalha Predatória vs Coração Instável).
5. O battle engine escuta eventos (`APPLY_STATUS`, `GAIN_SHIELD`, `RECEIVE_DAMAGE`, …) com escopo `SELF|ALLY|ENEMY|ANY`. Cartas G9/G10 (e algumas G5) consomem via `consumptionRules`. O servidor recusa a jogada se faltar stack.
6. Recurso ≠ status ≠ reação. Kits `gxr-kit-v1` selados não são reescritos; regras antigas são hidratadas sem rerrolar.
7. RNG permanente continua `RandomService` / `birthSeed`. Sem `Math.random()`.

## Consequências

- Ficha mostra identidade + medidor `● ● ○ 2/3 (?)` e resumo em linguagem natural.
- HUD de batalha mostra o mesmo medidor e feedback `+1 CALOR` / `−2 CALOR`.
- Carta bloqueada antecipa `REQUER 3 · ATUAL 1`.
- Alpha: debug interno só com `?gxdebug=1` / toggle de batalha, não no texto do jogador.
