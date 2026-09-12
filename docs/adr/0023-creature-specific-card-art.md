# ADR 0023 — Card art específica da Creature

- Status: aceito
- Data: 2026-09-03

## Contexto

A ADR 0018 definiu arte compartilhada por `CardDefinition + variant`. Isso continua válido para cartas globais. As 10 manifestações de um Genetic Power individual, porém, precisam mostrar **a mesma criatura** da ficha — especialmente no Alpha, onde cada NFT tem 1 poder + 10 cartas.

Gerar 10 imagens por NFT é caro. Não pode ligar sozinho.

## Decisão

1. `CardArtScope`: `SHARED` (catálogo) ou `CREATURE` (manifestação daquela ficha).
2. Fonte mecânica única: `GeneticPower → GeneticCardManifestation → CardDefinition / EffectDefinition → Presentation → CardArt`. Sem catálogo paralelo na UI.
3. `CREATURE` exige `CreatureVisualAsset` READY canônico como referência OpenAI. A arte mostra o mesmo indivíduo (life stage atual). Evolução **não** regenera 10 artes automaticamente. Campo futuro: `cardArtLifeStage`.
4. `generationKey` CREATURE = SHA-256(`creatureId + manifestationId + canonicalVisualImageHash + lifeStage + cardArtVersion + promptVersion + modelSnapshot`). Mudança de imageHash não regenera em silêncio.
5. Política `GENETIC_CARD_ART_POLICY`: `SHARED` | `SIGNATURE_ONLY` | `FULL_CREATURE`. Default **FULL_CREATURE**. Allowlist `GENETIC_CARD_ART_CREATURE_IDS` vazia = todas as criaturas. Worker processa SHARED e CREATURE.
6. Quando o retrato canônico fica READY, o servidor enfileira G1–G10 automaticamente e o GPT gera as artes. Abrir a ficha não dispara geração. Evolução não regenera as 10.

## Consequências

- SHARED da ADR 0018 permanece intacto.
- Custo: até 10 gerações por Creature autorizada.
- Estratégia futura (G1–G8 shared / G9–G10 creature) não entra agora.
