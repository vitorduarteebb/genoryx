# ADR 0015 — Criaturas genéticas com arte por IA

- Status: aceito
- Data: 2026-09-02

## Contexto

O compositor PNG (BODY/HEAD/TAIL) prova o fenótipo no Alpha, mas não é a arte oficial. A aparência final precisa nascer do DNA, não de colagem de peças. A IA não pode virar fonte de verdade genética.

## Decisão

1. O **game-engine** calcula e persiste o genome **antes** de qualquer imagem. A IA é só o renderizador visual do DNA.
2. `assembleVisualGenome` + `buildCreatureImagePrompt` são determinísticos. Recessivos **não** entram no prompt (exceto modo admin explícito).
3. OpenAI (`OPENAI_CREATURE_IMAGE_MODEL`, snapshot de produção `gpt-image-2-2026-04-21`) vive só no backend/worker. Nunca no frontend, Phaser, bundle Next, localStorage ou metadata NFT.
4. `packages/game-engine` **não** importa SDK OpenAI. Provider atrás de `CreatureImageProvider` (`mock` no CI, `openai` quando configurado).
5. Geração é job assíncrono (`PENDING → GENERATING → VALIDATING → READY | FAILED`). Breeding/hatch/captura **não** esperam a API. Falha de imagem não desfaz o nascimento.
6. Uma criatura = um Creature ID = um NFT futuro. EGG/BABY/YOUNG/ADULT são o mesmo indivíduo. Evolução visual usa a fase anterior como referência.
7. `generationKey` = SHA-256(`creatureId + lifeStage + visualGenomeVersion + artBibleVersion + promptVersion + modelVersion`). Retry com a mesma chave reutiliza o asset.
8. `geneticHash` é o DNA (imutável após o nascimento). `imageHash` é o arquivo daquela fase. Arte inválida se regenera; o DNA não muda.
9. Storage operacional é object storage (local/S3-compatible). Bytes não vão no Postgres. NFT/IPFS é milestone Web3 (ADR 0008).
10. Jogador **não** tem `POST /creatures/:id/regenerate-image`. Só eventos de sistema: HATCH, EVOLVE_TO_YOUNG, EVOLVE_TO_ADULT, ADMIN_RETRY.
11. Cartas só alteram arte se `CardDefinition.visualTags` estiver declarado. A IA não interpreta o nome da carta.
12. `GOLEM` no domínio continua `GOLEM`. O prompt descreve golem colossal. Heads `BEAST`/`SERPENT`/`EXOTIC` mapeiam para a linguagem da Art Bible sem rename de enum.

## Consequências

- Primeira entrega: genome → baby → storage → banco → coleção. Young/Adult e mint NFT entram depois, no mesmo contrato de identidade.
- Compositor PNG permanece fallback quando não há asset READY do life stage atual. A coleção usa `resolveCreatureVisual()`; o retrato oficial vem no campo `visual` do backend. Hatch de breeding passa por Genesis Reveal (`REVEALED` é UX, não ownership).
- TODO crítico em `docs/ROADMAP.md`. Detalhe em `docs/AI_CREATURE_GENERATION.md` e `docs/ART_BIBLE.md`.
