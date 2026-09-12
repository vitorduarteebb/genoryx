# Arte de cartas por IA — GENORYX: Genesis

A IA é o **ilustrador da habilidade**. A `CardDefinition` e a variant já existem. A imagem nunca determina dano, custo, genes, captura ou vencedor.

```
CardDefinition + variant → CardArtPromptBuilder → OpenAI
  → QA → storage card-art → CardArtAsset READY
```

ADR: `0018`. Art Bible: `docs/ART_BIBLE.md` §11. Secrets: mesma política da ADR 0015.

---

## 1. Modelo e segredo

- Alias: `gpt-image-2`
- Snapshot de produção: `gpt-image-2-2026-04-21`
- Config: `OPENAI_CARD_ART_MODEL` (não espalhar model ID)
- Chave: `OPENAI_API_KEY` só no backend/worker
- Provider: `CARD_ART_PROVIDER=mock|openai` (CI = mock)

Proibido: frontend, Phaser, bundle Next, `NEXT_PUBLIC_*`, localStorage, metadata NFT, logs de header/key.

Jogador **não** tem endpoint para gerar/regenerar arte de carta.

---

## 2. Identidade

Dois escopos (`CardArtScope`, ADR 0023):

| Scope | Quando | Chave |
| --- | --- | --- |
| `SHARED` | cartas globais, items, fusion, catálogo | `cardDefinitionId + variant + versões + model` |
| `CREATURE` | 10 manifestações do Genetic Power daquela ficha | `creatureId + manifestationId + canonicalVisualImageHash + lifeStage + versões + model` |

Não entra na chave: dano, custo, XP, Gold, NEX.

Política: `GENETIC_CARD_ART_POLICY=SHARED|SIGNATURE_ONLY|FULL_CREATURE` e allowlist `GENETIC_CARD_ART_CREATURE_IDS`. Default **FULL_CREATURE**. Allowlist vazia = toda criatura. Abrir ficha **não** gera arte.

`CREATURE` exige `CreatureVisualAsset` READY canônico. Evolução não regenera 10 artes. Mudança de imageHash não regenera em silêncio.

---

## 3. Prompt builder

`buildCardArtPrompt(spec)` é determinístico. Dicionários e direções em `@nexora/config`. **Nenhum LLM escreve o prompt.**

`CardArtGenerationSpec`: cardKey, name, cardType, element, tags[], mechanics[] (conceitos, sem números), speciesAffinity[], variant, artDirection, artBibleVersion, promptVersion, referenceImages[].

O prompt manda explicitamente: NO TEXT, NO LETTERS, NO NUMBERS, NO CARD FRAME, NO UI, NO LOGO, NO WATERMARK.

---

## 4. Quando gerar

- **SHARED:** uma vez quando a definição/variant entra no catálogo (CLI / job).
- **CREATURE:** automaticamente quando o `CreatureVisualAsset` canônico fica READY (nascimento, starter, captura). O worker gera G1–G10 com o retrato como referência GPT.

Não gerar quando o jogador: abre o deck, abre a criatura, entra no PvP, compra criatura.

---

## 5. Storage

Local: `CARD_ART_STORAGE_DIR` (default `var/card-art`). VPS: volume `card_art:/app/var/card-art`. Produção futura: R2/S3. Bytes **não** vão no Postgres.

URL pública: `/card-art/:assetId/image` (o frontend também resolve por `cardKey` + variant).

---

## 6. Recessivo, variant, sinergia

- Expresso = recessivo (mesma família) → mesma arte.
- Recessivo diferente e oculto → sem arte na carta de batalha.
- Variant mecânica → `CardArtAsset` próprio.
- SynergyDefinition → arte da sinergia, não da Creature.
