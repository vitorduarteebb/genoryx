# ADR 0018 — Ilustração de cartas por IA (Card Art)

- Status: aceito
- Data: 2026-09-02

## Contexto

As cartas genéticas do Alpha ainda pareciam retângulos de interface. Texto gerado dentro da imagem seria inconsistente e impediria balanceamento e localização. Gerar uma arte por Creature seria financeiramente inviável.

## Decisão

1. A IA gera **somente ilustração**. Moldura, custo, G#, nome, tipo, elemento, descrição e ícones são do frontend (`GeneticCard`).
2. A arte pertence a `CardDefinition + variant`, nunca à Creature. `FLAME_FANG` é uma arte; `PLASMA_FANG` é outra. Dez mil criaturas com a mesma carta reutilizam o mesmo `CardArtAsset`.
3. `CardArtPromptBuilder` é determinístico. Entrada: `CardArtGenerationSpec`. Nenhum prompt livre vem do frontend. Números de dano/custo **não** entram no prompt nem na `generationKey`.
4. OpenAI (`OPENAI_CARD_ART_MODEL`, snapshot `gpt-image-2-2026-04-21`) vive só no backend/worker. Mesma política de secrets da ADR 0015. Nunca `NEXT_PUBLIC_*`.
5. `packages/game-engine` **não** importa SDK OpenAI. Provider: `CardArtProvider` (`mock` no CI, `openai` quando configurado).
6. Geração é job (`PENDING → GENERATING → VALIDATING → READY | FAILED | FAILED_REVIEW`). Abrir deck, ficha, PvP ou market **não** enfileira arte.
7. `generationKey` = SHA-256(`cardDefinitionId + variant + cardArtVersion + artBibleVersion + promptVersion + modelSnapshot`). A mesma combinação não gera outra arte.
8. Bytes ficam em object storage (`var/card-art`, volume `card_art`). Postgres só metadados.
9. Recessivo igual ao expresso reutiliza a arte. Recessivo oculto não aparece na carta de batalha.
10. Primeira prova: só Florune G1–G10. Pyron/Nympha e o catálogo completo só após aprovação visual.

## Consequências

- Balancear `vine_tap` de 12 para 14 de dano **não** regenera arte.
- Nova `CardDefinition` ou variant mecânica pode enfileirar **uma** arte.
- `visualGenerationConfig.artBibleVersion` das criaturas **não** sobe por causa desta seção — senão todas as criaturas regenerariam retrato.
- TODO em `docs/ROADMAP.md`. Detalhe em `docs/AI_CARD_ART.md` e `docs/ART_BIBLE.md` §11.
