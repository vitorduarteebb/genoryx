# ADR 0035 — Genetic Combat Engine V1

- Status: aceito
- Data: 2026-09-11

## Contexto

O kit G1–G10 (ADR 0034) ainda sorteava função/número a partir do catálogo e de tags de anatomia. O jogador via a mesma família elemental com nomes diferentes. O pedido de design é o inverso: a criatura nasce com uma **identidade genética de combate**; as cartas são manifestações dessa identidade, montadas por uma gramática de peças (não milhares de habilidades hardcoded).

## Decisão

1. Versão `gxr-gce-v1` (`GENETIC_ENGINE_VERSION`). Kits `gxr-kit-v1` já selados **não** são reescritos. Snapshot de identidade é gravado em `Creature.combatManifestJson` na primeira leitura.
2. `birthSeed` deriva de `genesisSeed + creatureId + geneticHash + versão`. Sub-seeds: phenotype, identity, cards, novelty. Sem `Math.random()` em traço permanente.
3. Camadas: Genome (existente) → Expression 0–99 → Birth rolls (potency/efficiency/coherence/…) → Combat Identity (recurso pessoal + verbos de anatomia) → G1–G10 via Combat Ability Grammar.
4. Efeitos são cláusulas (`TRIGGER/CONDITION/ACTION/RESOURCE`). `CardValidator` + `KitValidator` impedem absurdo (energia, teto numérico, Supreme sem condição). Kit estranho continua válido.
5. Variação de dano fica nos tetos por tier (G1 10–16, G10 22–32). Criatura “ruim” é incoerente/situacional, não 15 vs 150 de dano.
6. Estados universais + `reactionRegistry` data-driven. `MAX_REACTION_DEPTH = 3`. RNG de batalha continua `matchSeed` / `RandomService`.
7. Novelty: fingerprint mecânico; se similaridade > 0.92 tenta outra manifestação, no máximo 3 vezes. Genética vence unicidade artificial.
8. Starter tem piso de coerência/eficiência. Wild/breed usam a distribuição completa.
9. UI: ficha mostra identidade; cartas mostram função/tier traduzidos; formação lista sinergias `produces → consumes`.
10. Sem IA decidindo dano/status. Nomes vêm do léxico a partir da mecânica.

## Consequências

- `assembleCreatureCardKit` passa a gerar o kit via GCE.
- Prisma: `genetic_engine_version`, `combat_manifest_json`.
- Simulação virtual (sem persistir NFT) mede similaridade, custos e coerência.
- ROADMAP: Genetic Combat Engine V1.
